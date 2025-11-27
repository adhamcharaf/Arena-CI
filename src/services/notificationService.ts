import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: string;
  booking_id?: string;
  [key: string]: unknown;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Check if running in Expo Go
   */
  private isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  /**
   * Initialize push notifications and get token
   */
  async initialize(): Promise<string | null> {
    // Check if physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Warn about Expo Go limitations on Android
    if (this.isExpoGo() && Platform.OS === 'android') {
      console.warn(
        'Push notifications are not available in Expo Go on Android (SDK 53+). ' +
        'Use a development build to test push notifications.'
      );
      // Continue anyway - local notifications still work
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Arena Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F97316',
        });
      }

      // Get projectId from Constants (set by EAS)
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('No projectId found - push notifications disabled. Run `npx eas project:init` to configure.');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('Push token:', this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      // Handle Expo Go limitation gracefully
      if (this.isExpoGo() && Platform.OS === 'android') {
        console.warn('Push token unavailable in Expo Go on Android. This is expected.');
        return null;
      }
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Save push token to user profile in database
   */
  async savePushTokenToProfile(): Promise<boolean> {
    if (!this.expoPushToken) {
      console.log('No push token to save');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('No authenticated user');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: this.expoPushToken })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving push token:', error);
        return false;
      }

      console.log('Push token saved to profile');
      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  /**
   * Remove push token from profile (on logout)
   */
  async removePushTokenFromProfile(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('id', user.id);
      }

      this.expoPushToken = null;
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  /**
   * Add listener for received notifications (when app is foregrounded)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add listener for notification responses (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  }
}

export const notificationService = new NotificationService();
