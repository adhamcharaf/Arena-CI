/**
 * Arena App Skeleton Loader Component
 * Animated placeholder for loading states
 * Using React Native Animated API for compatibility
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors, borderRadius as br } from '../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonGroupProps {
  children: React.ReactNode;
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = br.md,
  style
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: shimmerAnim },
        style,
      ]}
    />
  );
}

/**
 * Skeleton variant for text lines
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = '60%' as `${number}%`,
  lineHeight = 16,
  gap = 8,
}: {
  lines?: number;
  lastLineWidth?: number | `${number}%`;
  lineHeight?: number;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          borderRadius={br.xs}
        />
      ))}
    </View>
  );
}

/**
 * Skeleton variant for cards
 */
export function SkeletonCard({
  height = 120,
  showImage = true,
  showTitle = true,
  showSubtitle = true,
}: {
  height?: number;
  showImage?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
}) {
  return (
    <View style={[styles.card, { minHeight: height }]}>
      {showImage && (
        <Skeleton
          width={64}
          height={64}
          borderRadius={br.lg}
          style={{ marginRight: 16 }}
        />
      )}
      <View style={styles.cardContent}>
        {showTitle && <Skeleton width="70%" height={20} borderRadius={br.sm} />}
        {showSubtitle && (
          <Skeleton
            width="50%"
            height={14}
            borderRadius={br.xs}
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </View>
  );
}

/**
 * Skeleton variant for time slots
 */
export function SkeletonTimeSlots({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.timeSlotsContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={80}
          height={80}
          borderRadius={br.lg}
        />
      ))}
    </View>
  );
}

/**
 * Skeleton variant for court cards
 */
export function SkeletonCourtCard() {
  return (
    <View style={styles.courtCard}>
      <View style={styles.courtCardIcon}>
        <Skeleton width={48} height={48} borderRadius={br.md} />
      </View>
      <View style={styles.courtCardContent}>
        <Skeleton width="60%" height={18} borderRadius={br.sm} />
        <Skeleton
          width="80%"
          height={14}
          borderRadius={br.xs}
          style={{ marginTop: 6 }}
        />
        <View style={styles.courtCardFooter}>
          <Skeleton width={80} height={20} borderRadius={br.sm} />
          <Skeleton width={24} height={24} borderRadius={br.full} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton variant for booking cards
 */
export function SkeletonBookingCard() {
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingCardHeader}>
        <Skeleton width={40} height={40} borderRadius={br.md} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="50%" height={16} borderRadius={br.sm} />
          <Skeleton
            width="70%"
            height={12}
            borderRadius={br.xs}
            style={{ marginTop: 4 }}
          />
        </View>
        <Skeleton width={60} height={24} borderRadius={br.badge} />
      </View>
      <View style={styles.bookingCardFooter}>
        <Skeleton width={100} height={14} borderRadius={br.xs} />
        <Skeleton width={80} height={14} borderRadius={br.xs} />
      </View>
    </View>
  );
}

/**
 * Wrapper to group multiple skeletons
 */
export function SkeletonGroup({ children }: SkeletonGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.neutral[200],
  },
  group: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: br.card,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  courtCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: br.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  courtCardIcon: {
    marginRight: 12,
  },
  courtCardContent: {
    flex: 1,
  },
  courtCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  bookingCard: {
    backgroundColor: colors.background.primary,
    borderRadius: br.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default Skeleton;
