import { create } from 'zustand';
import {
  Court,
  AvailableSlot,
  Booking,
  PaymentMethod,
  MobilePaymentMethod,
  UserFine,
  CheckUserCanBookResponse,
  CreateBookingResponse,
  CancelBookingResponse,
  PayFineResponse,
  PayBookingResponse,
  SlotStatus
} from '../types';
import { supabase } from '../config/supabase';
import { formatDateForApi } from '../utils/dateHelpers';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

interface BookingState {
  courts: Court[];
  selectedCourt: Court | null;
  selectedDate: Date | null;
  availableSlots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  selectedPaymentMethod: PaymentMethod | null;
  userBookings: Booking[];
  isLoading: boolean;
  error: string | null;

  // Nouveau: État des amendes
  canBook: boolean;
  pendingFines: UserFine[];
  pendingFinesTotal: number;

  // Solde des crédits
  userCreditsBalance: number;

  // Actions
  fetchCourts: () => Promise<void>;
  selectCourt: (court: Court) => void;
  selectDate: (date: Date) => void;
  fetchAvailableSlots: (courtId: string, date: Date) => Promise<void>;
  selectSlot: (slot: AvailableSlot) => void;
  selectPaymentMethod: (method: PaymentMethod) => void;

  // Nouvelles actions avec Edge Functions
  checkUserCanBook: () => Promise<CheckUserCanBookResponse>;
  createBooking: (isPaying: boolean, useCredit?: boolean, mobileMethod?: MobilePaymentMethod) => Promise<CreateBookingResponse>;
  cancelBooking: (bookingId: string) => Promise<CancelBookingResponse>;
  payFine: (fineId: string) => Promise<PayFineResponse>;
  payExistingBooking: (bookingId: string, paymentMethod: PaymentMethod, useCredit?: boolean, mobileMethod?: MobilePaymentMethod) => Promise<PayBookingResponse>;
  fetchUserCredits: () => Promise<void>;

  fetchUserBookings: (userId: string) => Promise<void>;
  resetSelection: () => void;
  clearError: () => void;
}

// Helper pour appeler les Edge Functions
async function callEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Une erreur est survenue');
  }

  return data as T;
}

export const useBookingStore = create<BookingState>()((set, get) => ({
  courts: [],
  selectedCourt: null,
  selectedDate: null,
  availableSlots: [],
  selectedSlot: null,
  selectedPaymentMethod: null,
  userBookings: [],
  isLoading: false,
  error: null,
  canBook: true,
  pendingFines: [],
  pendingFinesTotal: 0,
  userCreditsBalance: 0,

  fetchCourts: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      set({ courts: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  selectCourt: (court: Court) => {
    set({
      selectedCourt: court,
      selectedDate: null,
      availableSlots: [],
      selectedSlot: null,
    });
  },

  selectDate: (date: Date) => {
    const { selectedCourt } = get();
    set({ selectedDate: date, selectedSlot: null });

    if (selectedCourt) {
      get().fetchAvailableSlots(selectedCourt.id, date);
    }
  },

  fetchAvailableSlots: async (courtId: string, date: Date) => {
    set({ isLoading: true, error: null });

    try {
      const dateStr = formatDateForApi(date);

      // Utiliser la nouvelle Edge Function
      const response = await callEdgeFunction<{ slots: any[] }>('get-available-slots', {
        court_id: courtId,
        date: dateStr,
      });

      // Transformer les résultats
      const slots: AvailableSlot[] = response.slots.map((slot) => ({
        id: slot.slot_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_order: 0,
        is_available: slot.status === 'free' || slot.status === 'unpaid',
        status: slot.status as SlotStatus,
        booking_id: slot.booking_id,
        can_override: slot.can_override,
      }));

      set({ availableSlots: slots, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  selectSlot: (slot: AvailableSlot) => {
    // Permettre la sélection si le créneau est libre ou peut être overridé
    if (slot.status === 'free' || slot.can_override) {
      set({ selectedSlot: slot });
    }
  },

  selectPaymentMethod: (method: PaymentMethod) => {
    set({ selectedPaymentMethod: method });
  },

  checkUserCanBook: async () => {
    try {
      const response = await callEdgeFunction<CheckUserCanBookResponse>('check-user-can-book');

      set({
        canBook: response.can_book,
        pendingFines: response.fines,
        pendingFinesTotal: response.pending_fines_total,
      });

      return response;
    } catch (error: any) {
      console.error('Error checking if user can book:', error);
      // En cas d'erreur, on permet la réservation (fail open)
      return { can_book: true, pending_fines_total: 0, fines: [] };
    }
  },

  createBooking: async (isPaying: boolean, useCredit?: boolean, mobileMethod?: MobilePaymentMethod) => {
    const { selectedCourt, selectedDate, selectedSlot, selectedPaymentMethod } = get();

    if (!selectedCourt || !selectedDate || !selectedSlot) {
      return { success: false, error: 'Sélection incomplète' };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<CreateBookingResponse>('create-booking', {
        court_id: selectedCourt.id,
        time_slot_id: selectedSlot.id,
        date: formatDateForApi(selectedDate),
        is_paying: isPaying,
        payment_method: selectedPaymentMethod,
        use_credit: useCredit,
        mobile_method: mobileMethod,
      });

      if (response.success) {
        // Réinitialiser la sélection
        get().resetSelection();
        // Rafraîchir le solde crédit si du crédit a été utilisé
        if (useCredit) {
          get().fetchUserCredits();
        }
      }

      set({ isLoading: false });

      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  cancelBooking: async (bookingId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<CancelBookingResponse>('cancel-booking', {
        booking_id: bookingId,
      });

      if (response.success) {
        // Mettre à jour la liste locale
        const { userBookings } = get();
        set({
          userBookings: userBookings.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
        });

        // Rafraîchir l'état des amendes si une amende a été créée
        if (response.fine_amount && response.fine_amount > 0) {
          get().checkUserCanBook();
        }
      }

      set({ isLoading: false });

      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, message: error.message, error: error.message };
    }
  },

  payFine: async (fineId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<PayFineResponse>('pay-fine', {
        fine_id: fineId,
      });

      if (response.success) {
        // Rafraîchir l'état des amendes
        await get().checkUserCanBook();
      }

      set({ isLoading: false });

      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, message: error.message, error: error.message };
    }
  },

  payExistingBooking: async (bookingId: string, paymentMethod: PaymentMethod, useCredit?: boolean, mobileMethod?: MobilePaymentMethod) => {
    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<PayBookingResponse>('pay-booking', {
        booking_id: bookingId,
        payment_method: paymentMethod,
        use_credit: useCredit,
        mobile_method: mobileMethod,
      });

      if (response.success && response.booking) {
        // Mettre à jour la réservation dans la liste locale
        const { userBookings } = get();
        set({
          userBookings: userBookings.map(b =>
            b.id === bookingId ? { ...b, ...response.booking } : b
          ),
        });
        // Rafraîchir le solde crédit si du crédit a été utilisé
        if (useCredit) {
          get().fetchUserCredits();
        }
      }

      set({ isLoading: false });

      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchUserCredits: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('user_credits')
        .select('amount')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching user credits:', error);
        return;
      }

      const total = data?.reduce((sum, credit) => sum + credit.amount, 0) || 0;
      set({ userCreditsBalance: total });
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  },

  fetchUserBookings: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*),
          time_slot:time_slots(*)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ userBookings: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  resetSelection: () => {
    set({
      selectedCourt: null,
      selectedDate: null,
      availableSlots: [],
      selectedSlot: null,
      selectedPaymentMethod: null,
    });
  },

  clearError: () => set({ error: null }),
}));
