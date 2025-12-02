import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { formatDateForApi } from '../utils/dateHelpers';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

// Types for Manager
export interface SlotBooking {
  id: string;
  client_name: string;
  client_phone: string;
  status: string;
  created_by_staff: boolean;
}

export interface ScheduleSlot {
  time_slot_id: string;
  start_time: string;
  end_time: string;
  status: 'free' | 'paid' | 'unpaid' | 'past';
  booking: SlotBooking | null;
}

export interface CourtSchedule {
  id: string;
  name: string;
  type: string;
  price: number;
  slots: ScheduleSlot[];
}

export interface DaySchedule {
  date: string;
  courts: CourtSchedule[];
}

export interface ClientWithStats {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  bookings_count: number;
  last_booking_date: string | null;
  pending_fines_total: number;
  credits_balance: number;
  created_at: string;
}

export interface BookingWithRelations {
  id: string;
  user_id: string;
  court_id: string;
  time_slot_id: string;
  date: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  total_amount: number;
  credit_used: number;
  created_at: string;
  created_by_staff_id: string | null;
  client: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string;
  };
  court: {
    id: string;
    name: string;
    type: string;
    price: number;
  };
  time_slot: {
    id: string;
    start_time: string;
    end_time: string;
  };
}

export interface UserFine {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

export interface AdminCreateBookingResponse {
  success: boolean;
  booking?: BookingWithRelations;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  client_created?: boolean;
  overridden_booking_id?: string | null;
  message?: string;
  error?: string;
  error_code?: string;
  // Warning for client with fines
  warning?: string;
  pending_fines_total?: number;
  fines?: UserFine[];
}

export interface AdminCancelBookingResponse {
  success: boolean;
  message?: string;
  refund_amount?: number;
  fine_amount?: number;
  late_cancellation?: boolean;
  error?: string;
}

export interface AdminMarkNoShowResponse {
  success: boolean;
  fine_amount?: number;
  message?: string;
  error?: string;
}

interface BookingsFilter {
  date?: string;
  court_id?: string;
  status?: string;
  user_id?: string;
}

interface ManagerState {
  // Day schedule
  daySchedule: DaySchedule | null;
  selectedDate: Date;

  // All bookings
  allBookings: BookingWithRelations[];
  bookingsFilter: BookingsFilter;

  // Clients
  clients: ClientWithStats[];
  selectedClient: ClientWithStats | null;
  clientSearchQuery: string;

  // No-shows (recent bookings that can be marked as no-show)
  pendingNoShows: BookingWithRelations[];

  // Loading states
  isLoading: boolean;
  isCreatingBooking: boolean;
  error: string | null;

  // Actions
  setSelectedDate: (date: Date) => void;
  fetchDaySchedule: (date?: Date) => Promise<void>;
  createBookingForClient: (params: {
    court_id: string;
    time_slot_id: string;
    date: string;
    client_phone: string;
    client_first_name?: string;
    client_last_name?: string;
    force?: boolean;
  }) => Promise<AdminCreateBookingResponse>;
  cancelClientBooking: (bookingId: string) => Promise<AdminCancelBookingResponse>;
  markNoShow: (bookingId: string) => Promise<AdminMarkNoShowResponse>;
  fetchAllBookings: (filters?: BookingsFilter) => Promise<void>;
  fetchClients: (search?: string) => Promise<void>;
  setSelectedClient: (client: ClientWithStats | null) => void;
  fetchPendingNoShows: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

// Helper to call Edge Functions
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

  // Don't throw if error_code is present - return the data so caller can handle it
  if (!response.ok && !data.warning && !data.error_code) {
    throw new Error(data.error || 'Une erreur est survenue');
  }

  return data as T;
}

export const useManagerStore = create<ManagerState>()((set, get) => ({
  // Initial state
  daySchedule: null,
  selectedDate: new Date(),
  allBookings: [],
  bookingsFilter: {},
  clients: [],
  selectedClient: null,
  clientSearchQuery: '',
  pendingNoShows: [],
  isLoading: false,
  isCreatingBooking: false,
  error: null,

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },

  fetchDaySchedule: async (date?: Date) => {
    const targetDate = date || get().selectedDate;
    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<{ success: boolean; date: string; courts: CourtSchedule[] }>(
        'admin-get-day-schedule',
        { date: formatDateForApi(targetDate) }
      );

      if (response.success) {
        // Post-process: mark free past slots as 'past'
        const now = new Date();
        const [year, month, day] = response.date.split('-').map(Number);

        const processedCourts = response.courts.map(court => ({
          ...court,
          slots: court.slots.map(slot => {
            const [hours, minutes] = slot.end_time.split(':').map(Number);
            const slotEndDate = new Date(year, month - 1, day, hours, minutes);

            // Only mark as 'past' if slot is free and time has passed
            if (now > slotEndDate && slot.status === 'free') {
              return { ...slot, status: 'past' as const };
            }
            return slot;
          }),
        }));

        set({
          daySchedule: {
            date: response.date,
            courts: processedCourts,
          },
          selectedDate: targetDate,
          isLoading: false,
        });
      } else {
        throw new Error('Erreur lors du chargement du planning');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createBookingForClient: async (params) => {
    set({ isCreatingBooking: true, error: null });

    try {
      const response = await callEdgeFunction<AdminCreateBookingResponse>(
        'admin-create-booking',
        params
      );

      set({ isCreatingBooking: false });

      // If success, refresh day schedule
      if (response.success && !response.warning) {
        get().fetchDaySchedule();
      }

      return response;
    } catch (error: any) {
      set({ error: error.message, isCreatingBooking: false });
      return { success: false, error: error.message };
    }
  },

  cancelClientBooking: async (bookingId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<AdminCancelBookingResponse>(
        'admin-cancel-booking',
        { booking_id: bookingId }
      );

      if (response.success) {
        // Refresh day schedule and bookings
        get().fetchDaySchedule();

        // Update local bookings list
        const { allBookings } = get();
        set({
          allBookings: allBookings.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
        });
      }

      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  markNoShow: async (bookingId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await callEdgeFunction<AdminMarkNoShowResponse>(
        'admin-mark-no-show',
        { booking_id: bookingId }
      );

      if (response.success) {
        // Remove from pending no-shows
        const { pendingNoShows } = get();
        set({
          pendingNoShows: pendingNoShows.filter(b => b.id !== bookingId),
        });

        // Update in all bookings if present
        const { allBookings } = get();
        set({
          allBookings: allBookings.map(b =>
            b.id === bookingId ? { ...b, status: 'no_show' } : b
          ),
        });
      }

      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchAllBookings: async (filters?: BookingsFilter) => {
    set({ isLoading: true, error: null, bookingsFilter: filters || {} });

    try {
      // Build query
      let query = supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_user_id_fkey(id, first_name, last_name, phone),
          court:courts(*),
          time_slot:time_slots(*)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.date) {
        query = query.eq('date', filters.date);
      }
      if (filters?.court_id) {
        query = query.eq('court_id', filters.court_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      set({ allBookings: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchClients: async (search?: string) => {
    set({ isLoading: true, error: null, clientSearchQuery: search || '' });

    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      // Search by phone or name
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(`phone.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
      }

      const { data: profiles, error: profilesError } = await query.limit(50);

      if (profilesError) throw profilesError;

      // For each client, get stats
      const clientsWithStats: ClientWithStats[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get bookings count and last booking
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('id, date')
            .eq('user_id', profile.id)
            .order('date', { ascending: false })
            .limit(1);

          const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Get pending fines
          const { data: finesData } = await supabase
            .from('user_fines')
            .select('amount')
            .eq('user_id', profile.id)
            .eq('status', 'pending');

          const pendingFinesTotal = finesData?.reduce((sum, f) => sum + f.amount, 0) || 0;

          // Get credits balance
          const { data: creditsData } = await supabase
            .from('user_credits')
            .select('amount')
            .eq('user_id', profile.id);

          const creditsBalance = creditsData?.reduce((sum, c) => sum + c.amount, 0) || 0;

          return {
            id: profile.id,
            phone: profile.phone,
            first_name: profile.first_name,
            last_name: profile.last_name,
            bookings_count: bookingsCount || 0,
            last_booking_date: bookingsData?.[0]?.date || null,
            pending_fines_total: pendingFinesTotal,
            credits_balance: creditsBalance,
            created_at: profile.created_at,
          };
        })
      );

      set({ clients: clientsWithStats, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setSelectedClient: (client: ClientWithStats | null) => {
    set({ selectedClient: client });
  },

  fetchPendingNoShows: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get current time minus 2 hours (window for marking no-show)
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const todayStr = now.toISOString().split('T')[0];

      // Get paid/confirmed bookings from today where slot has ended but within 2h window
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_user_id_fkey(id, first_name, last_name, phone),
          court:courts(*),
          time_slot:time_slots(*)
        `)
        .eq('date', todayStr)
        .in('status', ['paid', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to only show slots that have ended
      const currentTime = now.toTimeString().split(' ')[0];
      const pendingNoShows = (data || []).filter(booking => {
        return booking.time_slot.end_time <= currentTime;
      });

      set({ pendingNoShows, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  resetState: () => set({
    daySchedule: null,
    selectedDate: new Date(),
    allBookings: [],
    bookingsFilter: {},
    clients: [],
    selectedClient: null,
    clientSearchQuery: '',
    pendingNoShows: [],
    isLoading: false,
    isCreatingBooking: false,
    error: null,
  }),
}));
