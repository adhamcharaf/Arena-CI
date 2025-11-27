/**
 * Arena App Haptic Feedback Utilities
 * Provides consistent haptic feedback across the app
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are available (not on web)
const isHapticsAvailable = Platform.OS !== 'web';

/**
 * Haptic feedback utilities for different interaction types
 */
export const haptics = {
  /**
   * Light impact - Use for subtle interactions like button taps
   */
  light: async () => {
    if (isHapticsAvailable) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact - Use for more significant interactions
   */
  medium: async () => {
    if (isHapticsAvailable) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact - Use for important actions
   */
  heavy: async () => {
    if (isHapticsAvailable) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Success notification - Use after successful actions (booking confirmed, etc.)
   */
  success: async () => {
    if (isHapticsAvailable) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Error notification - Use for errors or failed actions
   */
  error: async () => {
    if (isHapticsAvailable) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /**
   * Warning notification - Use for warnings or important alerts
   */
  warning: async () => {
    if (isHapticsAvailable) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Selection feedback - Use for picker selections, toggles, etc.
   */
  selection: async () => {
    if (isHapticsAvailable) {
      await Haptics.selectionAsync();
    }
  },
};

export default haptics;
