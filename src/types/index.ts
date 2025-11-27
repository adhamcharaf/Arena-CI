// Types pour l'application Arena

export type UserRole = 'user' | 'manager' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | 'unpaid' | 'paid' | 'cancelled_by_override';
export type PaymentMethod = 'orange_money' | 'wave' | 'cash' | 'credit' | 'credit_and_mobile';
export type MobilePaymentMethod = 'orange_money' | 'wave';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type CourtType = 'football' | 'padel';
export type SlotStatus = 'free' | 'unpaid' | 'paid' | 'past';

export interface User {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  email: string | null;
  role: UserRole;
  phone_verified: boolean;
  phone_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  push_token: string | null;
}

// Helper pour afficher le nom complet
export const getFullName = (user: User | null): string => {
  if (!user) return 'Utilisateur';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Utilisateur';
};

// Vérifier si le profil est complet
export const isProfileComplete = (user: User | null): boolean => {
  return !!user?.first_name && !!user?.last_name;
};

// Helper pour obtenir les initiales
export const getInitials = (user: User | null): string => {
  if (!user) return '?';
  const firstInitial = user.first_name?.charAt(0).toUpperCase() || '';
  const lastInitial = user.last_name?.charAt(0).toUpperCase() || '';
  return firstInitial + lastInitial || '?';
};

export interface Court {
  id: string;
  name: string;
  slug: string;
  type: CourtType;
  price: number;
  duration: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  slot_order: number;
}

export interface AvailableSlot extends TimeSlot {
  is_available: boolean;
  status: SlotStatus;
  booking_id?: string;
  can_override: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  time_slot_id: string;
  date: string;
  status: BookingStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  total_amount: number;
  credit_used: number;
  created_at: string;
  overridden_booking_id?: string | null;
  // Relations jointes
  court?: Court;
  time_slot?: TimeSlot;
}

// Breakdown du paiement (crédit + mobile)
export interface PaymentBreakdown {
  credit_amount: number;      // Montant payé en crédit
  mobile_amount: number;      // Montant payé en mobile money
  mobile_method?: MobilePaymentMethod;  // Méthode mobile si applicable
  total_amount: number;       // Montant total
}

export interface ApiError {
  error: string;
  code?: string;
  retry_after?: number;
}

// Types pour le système d'amendes et crédits
export interface UserFine {
  id: string;
  user_id: string;
  booking_id: string | null;
  amount: number;
  reason: string;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
}

export interface UserCredit {
  id: string;
  user_id: string;
  booking_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

// Réponses des Edge Functions
export interface CheckUserCanBookResponse {
  can_book: boolean;
  pending_fines_total: number;
  fines: UserFine[];
}

export interface CreateBookingResponse {
  success: boolean;
  booking?: Booking;
  error?: string;
  error_code?: string;
  pending_fines?: number;
  overridden_booking_id?: string;
  notification_sent?: boolean;
  // Nouveau: détection propre réservation non payée
  own_unpaid_booking?: boolean;
  booking_id?: string;
  message?: string;
  // Nouveau: breakdown du paiement crédit
  payment_breakdown?: PaymentBreakdown;
}

export interface PayBookingResponse {
  success: boolean;
  booking?: Booking;
  message?: string;
  error?: string;
  // Nouveau: breakdown du paiement crédit
  payment_breakdown?: PaymentBreakdown;
}

export interface CancelBookingResponse {
  success: boolean;
  refund_amount?: number;
  fine_amount?: number;
  message: string;
  error?: string;
}

export interface PayFineResponse {
  success: boolean;
  message: string;
  error?: string;
}
