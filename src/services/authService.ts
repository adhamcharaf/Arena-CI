// Service d'authentification - wrapper simplifié autour du store
import { useAuthStore } from '../stores/authStore';

/**
 * Envoie un code de vérification par SMS
 */
export async function sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
  return useAuthStore.getState().sendVerificationCode(phone);
}

/**
 * Vérifie le code SMS et connecte l'utilisateur
 */
export async function verifyCode(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  return useAuthStore.getState().verifyCode(phone, code);
}

/**
 * Déconnecte l'utilisateur
 */
export async function signOut(): Promise<void> {
  return useAuthStore.getState().signOut();
}

/**
 * Vérifie si la session est valide
 */
export async function checkSession(): Promise<boolean> {
  return useAuthStore.getState().checkSession();
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  birth_date?: string | null;
  email?: string | null;
}): Promise<void> {
  return useAuthStore.getState().updateUser(data);
}
