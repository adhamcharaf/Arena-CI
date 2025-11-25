import { format, addDays, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: Date | string, formatStr: string = 'dd MMMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: fr });
}

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formate une heure pour l'affichage (HH:mm)
 */
export function formatTime(time: string): string {
  // time est au format HH:mm:ss, on veut HH:mm
  return time.substring(0, 5);
}

/**
 * Formate un créneau horaire pour l'affichage
 */
export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Génère les prochains N jours à partir d'aujourd'hui
 */
export function getNextDays(count: number = 14): Date[] {
  const days: Date[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < count; i++) {
    days.push(addDays(today, i));
  }

  return days;
}

/**
 * Vérifie si une date est dans le passé
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(startOfDay(dateObj), startOfDay(new Date()));
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = startOfDay(new Date());
  return startOfDay(dateObj).getTime() === today.getTime();
}

/**
 * Génère un objet markedDates pour react-native-calendars
 */
export function generateMarkedDates(
  selectedDate: string | null,
  bookedDates: string[] = []
): Record<string, { selected?: boolean; marked?: boolean; dotColor?: string; selectedColor?: string }> {
  const marked: Record<string, { selected?: boolean; marked?: boolean; dotColor?: string; selectedColor?: string }> = {};

  // Marquer les dates avec des réservations
  bookedDates.forEach(date => {
    marked[date] = { marked: true, dotColor: '#10B981' };
  });

  // Marquer la date sélectionnée
  if (selectedDate) {
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#F97316',
    };
  }

  return marked;
}

/**
 * Formate le prix en FCFA
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}
