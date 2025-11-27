import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types';
import { supabase } from '../config/supabase';
import { notificationService } from '../services/notificationService';

// Storage adapter pour Zustand
const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  sendVerificationCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      sendVerificationCode: async (phone: string) => {
        set({ isLoading: true, error: null });

        try {
          const cleanPhone = phone.replace(/\s/g, '');

          const { error } = await supabase.auth.signInWithOtp({
            phone: cleanPhone,
          });

          set({ isLoading: false });

          if (error) {
            let errorMessage = error.message;
            // Traduire les erreurs courantes
            if (error.message.includes('Phone not allowed')) {
              errorMessage = 'Ce numéro de téléphone n\'est pas autorisé';
            } else if (error.message.includes('rate limit')) {
              errorMessage = 'Trop de tentatives. Réessayez dans quelques minutes.';
            } else if (error.message.includes('not a valid phone number')) {
              errorMessage = 'Numéro de téléphone invalide';
            }
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          }

          return { success: true };
        } catch (error: any) {
          const errorMessage = error.message || 'Erreur lors de l\'envoi du code';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      verifyCode: async (phone: string, code: string) => {
        set({ isLoading: true, error: null });

        try {
          const cleanPhone = phone.replace(/\s/g, '');

          const { data, error } = await supabase.auth.verifyOtp({
            phone: cleanPhone,
            token: code,
            type: 'sms',
          });

          if (error) {
            let errorMessage = error.message;
            // Traduire les erreurs courantes
            if (error.message.includes('Invalid') || error.message.includes('invalid')) {
              errorMessage = 'Code invalide ou expiré';
            } else if (error.message.includes('expired')) {
              errorMessage = 'Code expiré. Demandez un nouveau code.';
            }
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }

          if (data.user) {
            // Le profil est créé automatiquement par le trigger on_auth_user_created
            // On le récupère (avec retry car le trigger peut prendre quelques ms)
            let profile = null;
            let retries = 3;

            while (!profile && retries > 0) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

              if (profileData) {
                profile = profileData;
              } else if (retries > 1) {
                // Attendre un peu avant de réessayer
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              retries--;
            }

            if (!profile) {
              set({ isLoading: false, error: 'Erreur lors de la récupération du profil' });
              return { success: false, error: 'Erreur lors de la récupération du profil' };
            }

            // Mettre à jour last_login_at
            await supabase
              .from('profiles')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', data.user.id);

            set({
              user: profile,
              isAuthenticated: true,
              isLoading: false,
            });

            // Initialize push notifications and save token
            notificationService.initialize().then(() => {
              notificationService.savePushTokenToProfile();
            });
          }

          return { success: true };
        } catch (error: any) {
          const errorMessage = error.message || 'Code invalide ou expiré';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      signOut: async () => {
        set({ isLoading: true });

        try {
          // Remove push token from profile before signing out
          await notificationService.removePushTokenFromProfile();
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Sign out error:', error);
        }

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({ user: profile, isAuthenticated: true });

              // Initialize push notifications for returning users
              notificationService.initialize().then(() => {
                notificationService.savePushTokenToProfile();
              });

              return true;
            }
          }

          set({ user: null, isAuthenticated: false });
          return false;
        } catch (error) {
          console.error('Check session error:', error);
          return false;
        }
      },

      updateUser: async (data: Partial<User>) => {
        const { user } = get();

        if (!user) return;

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', user.id);

          if (error) throw error;

          set({ user: { ...user, ...data } });
        } catch (error) {
          console.error('Update user error:', error);
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'arena-auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
