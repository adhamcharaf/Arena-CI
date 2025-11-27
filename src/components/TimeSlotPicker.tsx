import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AvailableSlot, SlotStatus } from '../types';
import { formatTime } from '../utils/dateHelpers';
import { colors, spacing, borderRadius, textStyles } from '../theme';
import haptics from '../utils/haptics';

interface TimeSlotPickerProps {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
}

// Get slot status configuration
function getSlotStatusConfig(status: SlotStatus, canOverride: boolean) {
  switch (status) {
    case 'free':
      return {
        backgroundColor: colors.status.free.light,
        borderColor: colors.status.free.main,
        textColor: '#166534',
        badgeColor: null,
        badgeText: null,
        isSelectable: true,
      };
    case 'unpaid':
      return {
        backgroundColor: colors.status.unpaid.light,
        borderColor: colors.status.unpaid.main,
        textColor: '#9A3412',
        badgeColor: colors.status.unpaid.main,
        badgeText: 'Non payé',
        isSelectable: canOverride,
      };
    case 'paid':
      return {
        backgroundColor: colors.status.paid.light,
        borderColor: colors.status.paid.main,
        textColor: '#991B1B',
        badgeColor: colors.status.paid.main,
        badgeText: 'Réservé',
        isSelectable: false,
      };
    case 'past':
      return {
        backgroundColor: colors.status.past.light,
        borderColor: colors.neutral[300],
        textColor: colors.text.tertiary,
        badgeColor: null,
        badgeText: null,
        isSelectable: false,
      };
    default:
      return {
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.default,
        textColor: colors.text.primary,
        badgeColor: null,
        badgeText: null,
        isSelectable: true,
      };
  }
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
}: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun créneau disponible</Text>
      </View>
    );
  }

  const handleSlotPress = (slot: AvailableSlot) => {
    haptics.selection();
    onSelectSlot(slot);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Créneaux disponibles</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {slots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const config = getSlotStatusConfig(slot.status, slot.can_override);
          const isDisabled = !config.isSelectable;

          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotButton,
                {
                  backgroundColor: isSelected ? colors.primary.main : config.backgroundColor,
                  borderColor: isSelected ? colors.primary.main : config.borderColor,
                },
                isDisabled && styles.slotDisabled,
              ]}
              onPress={() => handleSlotPress(slot)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.slotTime,
                  { color: isSelected ? colors.neutral[0] : config.textColor },
                  isDisabled && styles.slotTimeDisabled,
                ]}
              >
                {formatTime(slot.start_time)}
              </Text>
              <Text
                style={[
                  styles.slotEndTime,
                  { color: isSelected ? colors.primary.light : config.textColor },
                  isDisabled && styles.slotEndTimeDisabled,
                ]}
              >
                {formatTime(slot.end_time)}
              </Text>
              {config.badgeText && (
                <View style={[styles.statusBadge, { backgroundColor: config.badgeColor }]}>
                  <Text style={styles.statusBadgeText}>{config.badgeText}</Text>
                </View>
              )}
              {slot.status === 'unpaid' && slot.can_override && (
                <View style={styles.overrideBadge}>
                  <Text style={styles.overrideBadgeText}>Payez!</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.status.free.main }]} />
          <Text style={styles.legendText}>Libre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.status.unpaid.main }]} />
          <Text style={styles.legendText}>Non payé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.status.paid.main }]} />
          <Text style={styles.legendText}>Payé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendSelected]} />
          <Text style={styles.legendText}>Sélectionné</Text>
        </View>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Les créneaux orange sont réservés sans paiement. Vous pouvez les prendre en payant immédiatement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  label: {
    ...textStyles.label,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
    gap: spacing.sm + 2,
  },
  slotButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
    position: 'relative',
  },
  slotDisabled: {
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 16,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '700',
  },
  slotTimeDisabled: {
    color: colors.text.tertiary,
  },
  slotEndTime: {
    fontSize: 12,
    fontFamily: textStyles.caption.fontFamily,
    marginTop: 2,
    opacity: 0.8,
  },
  slotEndTimeDisabled: {
    color: colors.neutral[300],
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  statusBadgeText: {
    color: colors.neutral[0],
    fontSize: 7,
    fontFamily: textStyles.overline.fontFamily,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  overrideBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.success.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  overrideBadgeText: {
    color: colors.neutral[0],
    fontSize: 8,
    fontFamily: textStyles.overline.fontFamily,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendSelected: {
    backgroundColor: colors.primary.main,
    borderWidth: 2,
    borderColor: colors.neutral[0],
  },
  legendText: {
    fontSize: 11,
    fontFamily: textStyles.caption.fontFamily,
    color: colors.text.secondary,
  },
  infoBox: {
    marginTop: spacing.md,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  infoText: {
    fontSize: 12,
    fontFamily: textStyles.caption.fontFamily,
    color: '#9A3412',
    lineHeight: 16,
  },
});
