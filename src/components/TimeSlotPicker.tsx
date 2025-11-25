import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AvailableSlot } from '../types';
import { formatTime } from '../utils/dateHelpers';

interface TimeSlotPickerProps {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
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
          const isDisabled = !slot.is_available;

          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotButton,
                isSelected && styles.slotSelected,
                isDisabled && styles.slotDisabled,
              ]}
              onPress={() => onSelectSlot(slot)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.slotTime,
                  isSelected && styles.slotTimeSelected,
                  isDisabled && styles.slotTimeDisabled,
                ]}
              >
                {formatTime(slot.start_time)}
              </Text>
              <Text
                style={[
                  styles.slotEndTime,
                  isSelected && styles.slotEndTimeSelected,
                  isDisabled && styles.slotEndTimeDisabled,
                ]}
              >
                {formatTime(slot.end_time)}
              </Text>
              {isDisabled && (
                <View style={styles.bookedBadge}>
                  <Text style={styles.bookedText}>Réservé</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendAvailable]} />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendBooked]} />
          <Text style={styles.legendText}>Réservé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendSelected]} />
          <Text style={styles.legendText}>Sélectionné</Text>
        </View>
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  slotSelected: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  slotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  slotTimeSelected: {
    color: '#FFFFFF',
  },
  slotTimeDisabled: {
    color: '#9CA3AF',
  },
  slotEndTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  slotEndTimeSelected: {
    color: '#FED7AA',
  },
  slotEndTimeDisabled: {
    color: '#D1D5DB',
  },
  bookedBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookedText: {
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
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendAvailable: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  legendBooked: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  legendSelected: {
    backgroundColor: '#F97316',
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
