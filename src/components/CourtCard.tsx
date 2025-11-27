import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Court } from '../types';
import { formatPrice } from '../utils/dateHelpers';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';
import haptics from '../utils/haptics';

interface CourtCardProps {
  court: Court;
  onPress: () => void;
}

const COURT_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  football: 'soccer',
  padel: 'tennis',
};

export default function CourtCard({ court, onPress }: CourtCardProps) {
  const isFootball = court.type === 'football';
  const sportColors = isFootball ? colors.sport.football : colors.sport.padel;

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Image placeholder with sport icon */}
      <View style={styles.imageContainer}>
        <View style={[styles.placeholder, { backgroundColor: sportColors.dark }]}>
          <MaterialCommunityIcons
            name={COURT_ICONS[court.type]}
            size={48}
            color={colors.neutral[0]}
          />
        </View>

        {/* Sport type badge */}
        <View style={[styles.typeBadge, { backgroundColor: sportColors.main }]}>
          <Text style={styles.typeText}>
            {isFootball ? 'Football' : 'Padel'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{court.name}</Text>

        {court.description && (
          <Text style={styles.description} numberOfLines={2}>
            {court.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(court.price)}</Text>
            <Text style={styles.duration}>/ {court.duration} min</Text>
          </View>

          <View style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Réserver</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  typeText: {
    color: colors.neutral[0],
    fontSize: 12,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    ...textStyles.h4,
    marginBottom: spacing.xs,
  },
  description: {
    ...textStyles.bodySmall,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontFamily: textStyles.h3.fontFamily,
    fontWeight: '800',
    color: colors.primary.main,
  },
  duration: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  bookButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.button - 2,
  },
  bookButtonText: {
    color: colors.neutral[0],
    fontSize: 14,
    fontFamily: textStyles.button.fontFamily,
    fontWeight: '700',
  },
});
