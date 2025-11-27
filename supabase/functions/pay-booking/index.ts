import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayBookingRequest {
  booking_id: string
  payment_method: 'orange_money' | 'wave' | 'cash'
  use_credit?: boolean  // Si true, utiliser le solde crédit en priorité
  mobile_method?: 'orange_money' | 'wave'  // Méthode mobile pour complément
}

interface PaymentBreakdown {
  credit_amount: number
  mobile_amount: number
  mobile_method?: 'orange_money' | 'wave'
  total_amount: number
}

// Helper: Récupérer le solde crédit de l'utilisateur
async function getUserCreditBalance(supabaseClient: ReturnType<typeof createClient>, userId: string): Promise<number> {
  const { data, error } = await supabaseClient
    .from('user_credits')
    .select('amount')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user credits:', error)
    return 0
  }

  return data?.reduce((sum, credit) => sum + credit.amount, 0) || 0
}

// Helper: Déduire le crédit de l'utilisateur
async function deductUserCredit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  amount: number,
  bookingId: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('user_credits')
    .insert({
      user_id: userId,
      booking_id: bookingId,
      amount: -amount,  // Montant négatif pour déduction
      reason: 'booking_payment'
    })

  if (error) {
    console.error('Error deducting credit:', error)
    return false
  }

  return true
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    // Admin client for credit operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { booking_id, payment_method, use_credit, mobile_method }: PayBookingRequest = await req.json()

    if (!booking_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID de réservation manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, court:courts(*), time_slot:time_slots(*)')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ success: false, error: 'Réservation introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the booking belongs to the current user
    if (booking.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cette réservation ne vous appartient pas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the booking is unpaid
    if (booking.status !== 'unpaid') {
      return new Response(
        JSON.stringify({
          success: false,
          error: booking.status === 'paid'
            ? 'Cette réservation est déjà payée'
            : 'Cette réservation ne peut pas être payée'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the booking is in the future
    const bookingDateTime = new Date(`${booking.date}T${booking.time_slot.start_time}`)
    if (bookingDateTime <= new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cette réservation est passée' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalAmount = booking.total_amount

    // Calculate payment breakdown with credit
    let paymentBreakdown: PaymentBreakdown = {
      credit_amount: 0,
      mobile_amount: totalAmount,
      total_amount: totalAmount
    }
    let finalPaymentMethod: string = payment_method || 'orange_money'
    let creditUsed = 0

    if (use_credit) {
      const creditBalance = await getUserCreditBalance(supabaseClient, user.id)

      if (creditBalance >= totalAmount) {
        // 100% credit - no mobile payment needed
        paymentBreakdown = {
          credit_amount: totalAmount,
          mobile_amount: 0,
          total_amount: totalAmount
        }
        finalPaymentMethod = 'credit'
        creditUsed = totalAmount
      } else if (creditBalance > 0) {
        // Partial credit + mobile money
        if (!mobile_method) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Méthode de paiement mobile requise pour compléter le crédit'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        paymentBreakdown = {
          credit_amount: creditBalance,
          mobile_amount: totalAmount - creditBalance,
          mobile_method: mobile_method,
          total_amount: totalAmount
        }
        finalPaymentMethod = 'credit_and_mobile'
        creditUsed = creditBalance
      }
      // If creditBalance = 0, use full mobile payment (default)
    } else {
      // No credit usage - validate payment method is provided
      if (!payment_method) {
        return new Response(
          JSON.stringify({ success: false, error: 'Méthode de paiement requise' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update the booking to paid status
    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'paid',
        payment_method: finalPaymentMethod,
        payment_status: 'completed',
        credit_used: creditUsed,
      })
      .eq('id', booking_id)
      .select('*, court:courts(*), time_slot:time_slots(*)')
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la mise à jour de la réservation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct credit if used (after booking is updated successfully)
    if (creditUsed > 0 && updatedBooking) {
      const deductSuccess = await deductUserCredit(supabaseAdmin, user.id, creditUsed, booking_id)
      if (!deductSuccess) {
        console.error('Failed to deduct credit, but booking was updated')
        // Note: In production, you might want to handle this with a transaction
      }
    }

    // Create a notification for the user
    await supabaseClient
      .from('user_notifications')
      .insert({
        user_id: user.id,
        type: 'booking_paid',
        title: 'Paiement confirmé',
        message: `Votre réservation pour ${booking.court.name} le ${booking.date} est maintenant confirmée et verrouillée.`,
        data: { booking_id: booking_id }
      })

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: 'Paiement effectué avec succès. Votre réservation est maintenant verrouillée.',
        payment_breakdown: paymentBreakdown
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in pay-booking function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
