// Service de réservation - wrapper simplifié autour du store
import { useBookingStore } from '../stores/bookingStore';
import { Court, AvailableSlot, PaymentMethod, Booking } from '../types';

/**
 * Récupère la liste des terrains disponibles
 */
export async function getCourts(): Promise<Court[]> {
  await useBookingStore.getState().fetchCourts();
  return useBookingStore.getState().courts;
}

/**
 * Récupère les créneaux disponibles pour un terrain et une date
 */
export async function getAvailableSlots(courtId: string, date: Date): Promise<AvailableSlot[]> {
  await useBookingStore.getState().fetchAvailableSlots(courtId, date);
  return useBookingStore.getState().availableSlots;
}

/**
 * Crée une nouvelle réservation
 * @param isPaying - true si l'utilisateur paie maintenant, false sinon
 */
export async function createBooking(isPaying: boolean = false): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  return useBookingStore.getState().createBooking(isPaying);
}

/**
 * Récupère les réservations d'un utilisateur
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
  await useBookingStore.getState().fetchUserBookings(userId);
  return useBookingStore.getState().userBookings;
}

/**
 * Annule une réservation
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  return useBookingStore.getState().cancelBooking(bookingId);
}

/**
 * Sélectionne un terrain
 */
export function selectCourt(court: Court): void {
  useBookingStore.getState().selectCourt(court);
}

/**
 * Sélectionne une date
 */
export function selectDate(date: Date): void {
  useBookingStore.getState().selectDate(date);
}

/**
 * Sélectionne un créneau
 */
export function selectSlot(slot: AvailableSlot): void {
  useBookingStore.getState().selectSlot(slot);
}

/**
 * Sélectionne un moyen de paiement
 */
export function selectPaymentMethod(method: PaymentMethod): void {
  useBookingStore.getState().selectPaymentMethod(method);
}

/**
 * Réinitialise la sélection
 */
export function resetSelection(): void {
  useBookingStore.getState().resetSelection();
}
