import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateBookingRequest {
  court_id: string
  time_slot_id: string
  date: string
  is_paying: boolean
  payment_method: 'orange_money' | 'wave' | 'cash' | null
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

// Helper: Acquérir un verrou sur le créneau (2 minutes)
async function acquireSlotLock(
  supabaseAdmin: ReturnType<typeof createClient>,
  courtId: string,
  timeSlotId: string,
  date: string,
  userId: string
): Promise<{ success: boolean; error_code?: string; error?: string }> {
  // 1. Nettoyer les locks expirés pour ce créneau
  await supabaseAdmin
    .from('slot_locks')
    .delete()
    .eq('court_id', courtId)
    .eq('time_slot_id', timeSlotId)
    .eq('date', date)
    .lt('expires_at', new Date().toISOString())

  // 2. Tenter d'acquérir le verrou (2 minutes)
  const lockExpires = new Date(Date.now() + 2 * 60 * 1000)
  const { error: lockError } = await supabaseAdmin
    .from('slot_locks')
    .insert({
      court_id: courtId,
      time_slot_id: timeSlotId,
      date,
      user_id: userId,
      expires_at: lockExpires.toISOString()
    })

  if (lockError) {
    // Lock existe déjà - vérifier s'il appartient à un autre user
    if (lockError.code === '23505') {
      const { data: existingLock } = await supabaseAdmin
        .from('slot_locks')
        .select('user_id, expires_at')
        .eq('court_id', courtId)
        .eq('time_slot_id', timeSlotId)
        .eq('date', date)
        .single()

      if (existingLock && existingLock.user_id !== userId && new Date(existingLock.expires_at) > new Date()) {
        return {
          success: false,
          error_code: 'SLOT_LOCKED',
          error: 'Ce créneau est en cours de réservation par un autre utilisateur. Réessayez dans quelques instants.'
        }
      }
      // Lock expiré ou appartient au même user, on peut continuer
    } else {
      console.error('Error acquiring slot lock:', lockError)
    }
  }

  return { success: true }
}

// Helper: Libérer le verrou sur le créneau
async function releaseSlotLock(
  supabaseAdmin: ReturnType<typeof createClient>,
  courtId: string,
  timeSlotId: string,
  date: string,
  userId: string
): Promise<void> {
  await supabaseAdmin
    .from('slot_locks')
    .delete()
    .eq('court_id', courtId)
    .eq('time_slot_id', timeSlotId)
    .eq('date', date)
    .eq('user_id', userId)
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

    // Admin client for notifications
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
    const { court_id, time_slot_id, date, is_paying, payment_method, use_credit, mobile_method }: CreateBookingRequest = await req.json()

    if (!court_id || !time_slot_id || !date) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paramètres manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Variable pour tracker si on a acquis un lock (pour le libérer à la fin)
    let hasLock = false

    // Si paiement, acquérir un verrou sur le créneau (2 minutes)
    if (is_paying) {
      const lockResult = await acquireSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
      if (!lockResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error_code: lockResult.error_code,
            error: lockResult.error
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      hasLock = true
    }

    // Check for pending fines
    const { data: pendingFines } = await supabaseClient
      .from('user_fines')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'pending')

    const totalPendingFines = pendingFines?.reduce((sum, fine) => sum + fine.amount, 0) || 0

    if (totalPendingFines > 0) {
      // Libérer le lock avant de retourner
      if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Vous avez des amendes en attente',
          error_code: 'PENDING_FINES',
          pending_fines: totalPendingFines
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get court info for pricing
    const { data: court, error: courtError } = await supabaseClient
      .from('courts')
      .select('*')
      .eq('id', court_id)
      .single()

    if (courtError || !court) {
      // Libérer le lock avant de retourner
      if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Terrain introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for existing booking on this slot
    const { data: existingBooking } = await supabaseClient
      .from('bookings')
      .select('*, user:profiles(id, first_name, push_token)')
      .eq('court_id', court_id)
      .eq('time_slot_id', time_slot_id)
      .eq('date', date)
      .in('status', ['paid', 'unpaid', 'confirmed'])
      .single()

    // CASE 1: Existing booking belongs to current user
    if (existingBooking && existingBooking.user_id === user.id) {
      // If user already has a PAID booking, block
      if (existingBooking.status === 'paid' || existingBooking.status === 'confirmed') {
        if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Vous avez déjà une réservation payée pour ce créneau'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If user has an UNPAID booking and is trying to pay via booking flow
      // Return special response to redirect to "Mes Réservations"
      if (existingBooking.status === 'unpaid') {
        if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
        return new Response(
          JSON.stringify({
            success: false,
            error_code: 'OWN_UNPAID_BOOKING',
            error: 'Vous avez déjà une réservation non payée pour ce créneau',
            own_unpaid_booking: true,
            booking_id: existingBooking.id,
            message: 'Rendez-vous dans vos réservations pour la payer.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // CASE 2: Existing booking belongs to another user
    if (existingBooking && existingBooking.user_id !== user.id) {
      // If it's a paid booking, block
      if (existingBooking.status === 'paid' || existingBooking.status === 'confirmed') {
        if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
        return new Response(
          JSON.stringify({
            success: false,
            error_code: 'SLOT_ALREADY_BOOKED',
            error: 'Ce créneau est déjà réservé par un autre utilisateur.'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If it's an unpaid booking and current user wants to PAY (override)
      if (existingBooking.status === 'unpaid' && is_paying) {
        // Calculate payment breakdown with credit
        let paymentBreakdown: PaymentBreakdown = {
          credit_amount: 0,
          mobile_amount: court.price,
          total_amount: court.price
        }
        let finalPaymentMethod: string = payment_method || 'orange_money'
        let creditUsed = 0

        if (use_credit) {
          const creditBalance = await getUserCreditBalance(supabaseClient, user.id)

          if (creditBalance >= court.price) {
            // 100% credit - no mobile payment needed
            paymentBreakdown = {
              credit_amount: court.price,
              mobile_amount: 0,
              total_amount: court.price
            }
            finalPaymentMethod = 'credit'
            creditUsed = court.price
          } else if (creditBalance > 0) {
            // Partial credit + mobile money
            if (!mobile_method) {
              if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
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
              mobile_amount: court.price - creditBalance,
              mobile_method: mobile_method,
              total_amount: court.price
            }
            finalPaymentMethod = 'credit_and_mobile'
            creditUsed = creditBalance
          }
          // If creditBalance = 0, use full mobile payment (default)
        }

        // Override: Cancel the existing booking
        await supabaseClient
          .from('bookings')
          .update({ status: 'cancelled_by_override' })
          .eq('id', existingBooking.id)

        // Notify the overridden user
        const overriddenUserId = existingBooking.user_id
        await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: overriddenUserId,
            type: 'booking_overridden',
            title: 'Réservation prise',
            message: `Votre réservation non payée pour ${court.name} le ${date} a été prise par un autre utilisateur qui a payé.`,
            data: { booking_id: existingBooking.id, court_name: court.name, date }
          })

        // Send push notification if user has push token
        if (existingBooking.user?.push_token) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: existingBooking.user.push_token,
                title: 'Réservation prise',
                body: `Votre réservation pour ${court.name} a été prise par un payant.`,
                data: { type: 'booking_overridden', booking_id: existingBooking.id }
              })
            })
          } catch (e) {
            console.error('Failed to send push notification:', e)
          }
        }

        // Create new booking for current user
        const { data: newBooking, error: createError } = await supabaseClient
          .from('bookings')
          .insert({
            user_id: user.id,
            court_id,
            time_slot_id,
            date,
            status: 'paid',
            payment_method: finalPaymentMethod,
            payment_status: 'completed',
            total_amount: court.price,
            credit_used: creditUsed,
            overridden_booking_id: existingBooking.id
          })
          .select('*, court:courts(*), time_slot:time_slots(*)')
          .single()

        if (createError) {
          console.error('Error creating booking:', createError)
          if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
          return new Response(
            JSON.stringify({ success: false, error: 'Erreur lors de la création de la réservation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Deduct credit if used (after booking is created successfully)
        if (creditUsed > 0 && newBooking) {
          const deductSuccess = await deductUserCredit(supabaseAdmin, user.id, creditUsed, newBooking.id)
          if (!deductSuccess) {
            console.error('Failed to deduct credit, but booking was created')
            // Note: In production, you might want to handle this with a transaction
          }
        }

        // Libérer le lock après succès
        if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)

        return new Response(
          JSON.stringify({
            success: true,
            booking: newBooking,
            overridden_booking_id: existingBooking.id,
            notification_sent: !!existingBooking.user?.push_token,
            payment_breakdown: paymentBreakdown
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If it's an unpaid booking and current user wants to book WITHOUT paying
      if (existingBooking.status === 'unpaid' && !is_paying) {
        // Pas de lock car is_paying = false
        return new Response(
          JSON.stringify({
            success: false,
            error_code: 'SLOT_ALREADY_BOOKED',
            error: 'Ce créneau est déjà réservé par un autre utilisateur.'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // CASE 3: No existing booking - create new booking

    // If not paying (unpaid reservation), no credit logic needed
    if (!is_paying) {
      const { data: newBooking, error: createError } = await supabaseClient
        .from('bookings')
        .insert({
          user_id: user.id,
          court_id,
          time_slot_id,
          date,
          status: 'unpaid',
          payment_method: null,
          payment_status: 'pending',
          total_amount: court.price,
          credit_used: 0
        })
        .select('*, court:courts(*), time_slot:time_slots(*)')
        .single()

      if (createError) {
        console.error('Error creating booking:', createError)
        return new Response(
          JSON.stringify({ success: false, error: 'Erreur lors de la création de la réservation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          booking: newBooking
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Paying: Calculate payment breakdown with credit
    let paymentBreakdown: PaymentBreakdown = {
      credit_amount: 0,
      mobile_amount: court.price,
      total_amount: court.price
    }
    let finalPaymentMethod: string = payment_method || 'orange_money'
    let creditUsed = 0

    if (use_credit) {
      const creditBalance = await getUserCreditBalance(supabaseClient, user.id)

      if (creditBalance >= court.price) {
        // 100% credit - no mobile payment needed
        paymentBreakdown = {
          credit_amount: court.price,
          mobile_amount: 0,
          total_amount: court.price
        }
        finalPaymentMethod = 'credit'
        creditUsed = court.price
      } else if (creditBalance > 0) {
        // Partial credit + mobile money
        if (!mobile_method) {
          if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
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
          mobile_amount: court.price - creditBalance,
          mobile_method: mobile_method,
          total_amount: court.price
        }
        finalPaymentMethod = 'credit_and_mobile'
        creditUsed = creditBalance
      }
      // If creditBalance = 0, use full mobile payment (default)
    }

    const { data: newBooking, error: createError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user.id,
        court_id,
        time_slot_id,
        date,
        status: 'paid',
        payment_method: finalPaymentMethod,
        payment_status: 'completed',
        total_amount: court.price,
        credit_used: creditUsed
      })
      .select('*, court:courts(*), time_slot:time_slots(*)')
      .single()

    if (createError) {
      console.error('Error creating booking:', createError)
      if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la création de la réservation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct credit if used (after booking is created successfully)
    if (creditUsed > 0 && newBooking) {
      const deductSuccess = await deductUserCredit(supabaseAdmin, user.id, creditUsed, newBooking.id)
      if (!deductSuccess) {
        console.error('Failed to deduct credit, but booking was created')
        // Note: In production, you might want to handle this with a transaction
      }
    }

    // Libérer le lock après succès
    if (hasLock) await releaseSlotLock(supabaseAdmin, court_id, time_slot_id, date, user.id)

    return new Response(
      JSON.stringify({
        success: true,
        booking: newBooking,
        payment_breakdown: paymentBreakdown
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-booking function:', error)
    // Note: On ne peut pas libérer le lock ici car on n'a pas accès aux variables
    // Le lock expirera automatiquement après 2 minutes
    return new Response(
      JSON.stringify({ success: false, error: 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
