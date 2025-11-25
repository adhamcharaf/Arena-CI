// Types pour l'application Arena

export type UserRole = 'user' | 'manager' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
export type PaymentMethod = 'orange_money' | 'wave' | 'cash';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type CourtType = 'football' | 'padel';

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
  created_at: string;
  // Relations jointes
  court?: Court;
  time_slot?: TimeSlot;
}

export interface ApiError {
  error: string;
  code?: string;
  retry_after?: number;
}
