import { create } from 'zustand';
import { Court, TimeSlot, AvailableSlot, Booking, PaymentMethod } from '../types';
import { supabase } from '../config/supabase';
import { formatDateForApi } from '../utils/dateHelpers';

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

  // Actions
  fetchCourts: () => Promise<void>;
  selectCourt: (court: Court) => void;
  selectDate: (date: Date) => void;
  fetchAvailableSlots: (courtId: string, date: Date) => Promise<void>;
  selectSlot: (slot: AvailableSlot) => void;
  selectPaymentMethod: (method: PaymentMethod) => void;
  createBooking: () => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  fetchUserBookings: (userId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  resetSelection: () => void;
  clearError: () => void;
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

      // Appeler la fonction PostgreSQL get_available_slots
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_court_id: courtId,
        p_date: dateStr,
      });

      if (error) throw error;

      // Transformer les résultats
      const slots: AvailableSlot[] = (data || []).map((slot: any) => ({
        id: slot.slot_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_order: 0, // Non retourné par la fonction
        is_available: slot.is_available,
      }));

      set({ availableSlots: slots, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  selectSlot: (slot: AvailableSlot) => {
    if (slot.is_available) {
      set({ selectedSlot: slot });
    }
  },

  selectPaymentMethod: (method: PaymentMethod) => {
    set({ selectedPaymentMethod: method });
  },

  createBooking: async () => {
    const { selectedCourt, selectedDate, selectedSlot, selectedPaymentMethod } = get();

    if (!selectedCourt || !selectedDate || !selectedSlot) {
      return { success: false, error: 'Sélection incomplète' };
    }

    set({ isLoading: true, error: null });

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Vous devez être connecté pour réserver');
      }

      const bookingData = {
        user_id: user.id,
        court_id: selectedCourt.id,
        time_slot_id: selectedSlot.id,
        date: formatDateForApi(selectedDate),
        status: 'confirmed',
        payment_method: selectedPaymentMethod,
        payment_status: 'pending', // Mock: toujours pending
        total_amount: selectedCourt.price,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select(`
          *,
          court:courts(*),
          time_slot:time_slots(*)
        `)
        .single();

      if (error) {
        // Vérifier si c'est une erreur de doublon
        if (error.code === '23505') {
          throw new Error('Ce créneau vient d\'être réservé par quelqu\'un d\'autre');
        }
        throw error;
      }

      // Réinitialiser la sélection
      get().resetSelection();

      set({ isLoading: false });

      return { success: true, booking: data };
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
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

  cancelBooking: async (bookingId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      // Mettre à jour la liste locale
      const { userBookings } = get();
      set({
        userBookings: userBookings.map(b =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ),
        isLoading: false,
      });

      return { success: true };
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
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
