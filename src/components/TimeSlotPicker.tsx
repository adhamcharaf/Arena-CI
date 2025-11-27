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

interface TimeSlotPickerProps {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
}

// Fonction pour obtenir les styles selon le statut du créneau
function getSlotStatusConfig(status: SlotStatus, canOverride: boolean) {
  switch (status) {
    case 'free':
      return {
        backgroundColor: '#F0FDF4',
        borderColor: '#22C55E',
        textColor: '#166534',
        badgeColor: null,
        badgeText: null,
        isSelectable: true,
      };
    case 'unpaid':
      return {
        backgroundColor: '#FFF7ED',
        borderColor: '#F97316',
        textColor: '#9A3412',
        badgeColor: '#F97316',
        badgeText: 'Non payé',
        isSelectable: canOverride,
      };
    case 'paid':
      return {
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444',
        textColor: '#991B1B',
        badgeColor: '#EF4444',
        badgeText: 'Réservé',
        isSelectable: false,
      };
    case 'past':
      return {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
        textColor: '#9CA3AF',
        badgeColor: null,
        badgeText: null,
        isSelectable: false,
      };
    default:
      return {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
        textColor: '#1F2937',
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
                  backgroundColor: isSelected ? '#F97316' : config.backgroundColor,
                  borderColor: isSelected ? '#F97316' : config.borderColor,
                },
                isDisabled && styles.slotDisabled,
              ]}
              onPress={() => onSelectSlot(slot)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.slotTime,
                  { color: isSelected ? '#FFFFFF' : config.textColor },
                  isDisabled && styles.slotTimeDisabled,
                ]}
              >
                {formatTime(slot.start_time)}
              </Text>
              <Text
                style={[
                  styles.slotEndTime,
                  { color: isSelected ? '#FED7AA' : config.textColor },
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

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendFree]} />
          <Text style={styles.legendText}>Libre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendUnpaid]} />
          <Text style={styles.legendText}>Non payé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendPaid]} />
          <Text style={styles.legendText}>Payé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendSelected]} />
          <Text style={styles.legendText}>Sélectionné</Text>
        </View>
      </View>

      {/* Info sur les créneaux non payés */}
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
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  slotButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  slotDisabled: {
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '700',
  },
  slotTimeDisabled: {
    color: '#9CA3AF',
  },
  slotEndTime: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  slotEndTimeDisabled: {
    color: '#D1D5DB',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  overrideBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overrideBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
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
    marginRight: 4,
  },
  legendFree: {
    backgroundColor: '#22C55E',
  },
  legendUnpaid: {
    backgroundColor: '#F97316',
  },
  legendPaid: {
    backgroundColor: '#EF4444',
  },
  legendSelected: {
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  infoText: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 16,
  },
});
