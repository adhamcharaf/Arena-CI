import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';

import { useManagerStore, ScheduleSlot, CourtSchedule } from '../../stores/managerStore';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import { formatDate, formatDateForApi } from '../../utils/dateHelpers';
import { haptics } from '../../utils/haptics';
import { ManagerStackParamList } from '../../navigation/ManagerTabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = 56;
const DAY_ITEM_MARGIN = 6;

type NavigationProp = NativeStackNavigationProp<ManagerStackParamList>;

// Status colors
const STATUS_COLORS = {
  free: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  paid: { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' },
  unpaid: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  past: { bg: '#F5F5F5', text: '#9E9E9E', border: '#E0E0E0' },
};

// Slot component
const SlotCard = ({
  slot,
  courtId,
  courtName,
  date,
  onPress,
}: {
  slot: ScheduleSlot;
  courtId: string;
  courtName: string;
  date: string;
  onPress: () => void;
}) => {
  const statusColor = STATUS_COLORS[slot.status];
  const isPast = slot.status === 'past';
  const hasBooking = slot.booking !== null;

  return (
    <TouchableOpacity
      style={[
        styles.slotCard,
        { backgroundColor: statusColor.bg, borderColor: statusColor.border },
        isPast && !hasBooking && styles.slotCardPast,
      ]}
      onPress={onPress}
      disabled={isPast && !hasBooking}
      activeOpacity={0.7}
    >
      <Text style={[styles.slotTime, { color: statusColor.text }]}>
        {slot.start_time.slice(0, 5)}
      </Text>

      {hasBooking ? (
        <View style={styles.slotBookingInfo}>
          <Text
            style={[styles.slotClientName, { color: statusColor.text }]}
            numberOfLines={1}
          >
            {slot.booking!.client_name}
          </Text>
          {slot.booking!.created_by_staff && (
            <View style={styles.staffBadge}>
              <Text style={styles.staffBadgeText}>M</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={[styles.slotFreeText, { color: statusColor.text }]}>
          {isPast ? '---' : 'Libre'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Court column component
const CourtColumn = ({
  court,
  date,
  onSlotPress,
}: {
  court: CourtSchedule;
  date: string;
  onSlotPress: (slot: ScheduleSlot, court: CourtSchedule) => void;
}) => {
  const typeColor = court.type === 'football' ? '#10B981' : '#3B82F6';

  return (
    <View style={styles.courtColumn}>
      {/* Court Header */}
      <View style={[styles.courtHeader, { borderBottomColor: typeColor }]}>
        <View style={[styles.courtTypeBadge, { backgroundColor: typeColor }]}>
          <Ionicons
            name={court.type === 'football' ? 'football' : 'tennisball'}
            size={12}
            color="#FFFFFF"
          />
        </View>
        <Text style={styles.courtName} numberOfLines={1}>
          {court.name}
        </Text>
      </View>

      {/* Slots */}
      <View style={styles.slotsContainer}>
        {court.slots.map((slot) => (
          <SlotCard
            key={slot.time_slot_id}
            slot={slot}
            courtId={court.id}
            courtName={court.name}
            date={date}
            onPress={() => onSlotPress(slot, court)}
          />
        ))}
      </View>
    </View>
  );
};

// French day names (short)
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

// Generate array of dates for the week strip
const generateDateRange = (centerDate: Date, daysAround: number = 14): Date[] => {
  const dates: Date[] = [];
  for (let i = -daysAround; i <= daysAround; i++) {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Day item for the horizontal strip
const DayItem = ({
  date,
  isSelected,
  isToday,
  onPress,
}: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
}) => {
  const dayName = DAYS_SHORT[date.getDay()];
  const dayNum = date.getDate();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.dayItem,
          isSelected && styles.dayItemSelected,
          isToday && !isSelected && styles.dayItemToday,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text
          style={[
            styles.dayName,
            isSelected && styles.dayNameSelected,
            isToday && !isSelected && styles.dayNameToday,
          ]}
        >
          {dayName}
        </Text>
        <Text
          style={[
            styles.dayNum,
            isSelected && styles.dayNumSelected,
            isToday && !isSelected && styles.dayNumToday,
          ]}
        >
          {dayNum}
        </Text>
        {isToday && (
          <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// New Calendar Navigation component
const CalendarNavigation = ({
  selectedDate,
  onDateSelect,
  onOpenCalendar,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onOpenCalendar: () => void;
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const today = new Date();
  const todayStr = formatDateForApi(today);
  const selectedStr = formatDateForApi(selectedDate);

  // Generate dates around selected date
  const dates = generateDateRange(today, 14);

  // Find index of selected date for auto-scroll
  const selectedIndex = dates.findIndex(d => formatDateForApi(d) === selectedStr);

  // Auto-scroll to selected date
  useEffect(() => {
    if (scrollViewRef.current && selectedIndex >= 0) {
      const scrollX = Math.max(0, selectedIndex * (DAY_ITEM_WIDTH + DAY_ITEM_MARGIN * 2) - SCREEN_WIDTH / 2 + DAY_ITEM_WIDTH / 2);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [selectedStr, selectedIndex]);

  // Month/Year display
  const monthYear = `${MONTHS_FR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  return (
    <View style={styles.calendarNavContainer}>
      {/* Month header with calendar button */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          style={styles.monthSelector}
          onPress={onOpenCalendar}
          activeOpacity={0.7}
        >
          <Text style={styles.monthText}>{monthYear}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.primary.main} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => {
            haptics.selection();
            onDateSelect(new Date());
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="today" size={18} color={colors.primary.main} />
          <Text style={styles.todayButtonText}>Aujourd'hui</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scrollable days */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollContent}
        decelerationRate="fast"
        snapToInterval={DAY_ITEM_WIDTH + DAY_ITEM_MARGIN * 2}
      >
        {dates.map((date) => {
          const dateStr = formatDateForApi(date);
          return (
            <DayItem
              key={dateStr}
              date={date}
              isSelected={dateStr === selectedStr}
              isToday={dateStr === todayStr}
              onPress={() => {
                haptics.selection();
                onDateSelect(date);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

// Calendar Modal
const CalendarModal = ({
  visible,
  selectedDate,
  onClose,
  onDateSelect,
}: {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
}) => {
  const selectedStr = formatDateForApi(selectedDate);
  const todayStr = formatDateForApi(new Date());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.calendarModalOverlay} onPress={onClose}>
        <Pressable style={styles.calendarModalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.calendarModalHeader}>
            <Text style={styles.calendarModalTitle}>Choisir une date</Text>
            <TouchableOpacity onPress={onClose} style={styles.calendarModalClose}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Calendar
            current={selectedStr}
            onDayPress={(day) => {
              haptics.selection();
              const newDate = new Date(day.dateString);
              onDateSelect(newDate);
              onClose();
            }}
            markedDates={{
              [selectedStr]: {
                selected: true,
                selectedColor: colors.primary.main,
              },
              [todayStr]: {
                marked: true,
                dotColor: colors.primary.main,
              },
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              selectedDayBackgroundColor: colors.primary.main,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary.main,
              todayBackgroundColor: 'transparent',
              dayTextColor: colors.text.primary,
              textDisabledColor: colors.text.disabled,
              arrowColor: colors.primary.main,
              monthTextColor: colors.text.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            enableSwipeMonths
            firstDay={1}
          />

          {/* Quick actions */}
          <View style={styles.calendarQuickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                haptics.selection();
                onDateSelect(new Date());
                onClose();
              }}
            >
              <Ionicons name="today" size={16} color={colors.primary.main} />
              <Text style={styles.quickActionText}>Aujourd'hui</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                haptics.selection();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onDateSelect(tomorrow);
                onClose();
              }}
            >
              <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
              <Text style={styles.quickActionText}>Demain</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                haptics.selection();
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                onDateSelect(nextWeek);
                onClose();
              }}
            >
              <Ionicons name="calendar" size={16} color={colors.primary.main} />
              <Text style={styles.quickActionText}>+7 jours</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Booking detail modal
const BookingDetailModal = ({
  visible,
  slot,
  court,
  date,
  onClose,
  onCancel,
  onMarkNoShow,
  isLoading,
  isMarkingNoShow,
}: {
  visible: boolean;
  slot: ScheduleSlot | null;
  court: CourtSchedule | null;
  date: string;
  onClose: () => void;
  onCancel: () => void;
  onMarkNoShow: () => void;
  isLoading: boolean;
  isMarkingNoShow: boolean;
}) => {
  if (!slot || !court) return null;

  const hasBooking = slot.booking !== null;
  const statusColor = STATUS_COLORS[slot.status];

  // Check if slot is in the past (can mark as no-show)
  const isSlotPast = () => {
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = slot.end_time.split(':').map(Number);
    const slotEndDate = new Date(year, month - 1, day, hours, minutes);
    return now > slotEndDate;
  };

  // Can mark as no-show if: has booking, slot is past, booking status is paid or confirmed
  const canMarkNoShow = hasBooking &&
    isSlotPast() &&
    (slot.booking?.status === 'paid' || slot.booking?.status === 'confirmed');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {hasBooking ? 'Detail reservation' : 'Creneau libre'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.modalInfo}>
            <View style={styles.modalInfoRow}>
              <Ionicons name="location" size={20} color={colors.text.secondary} />
              <Text style={styles.modalInfoText}>{court.name}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Ionicons name="calendar" size={20} color={colors.text.secondary} />
              <Text style={styles.modalInfoText}>{date}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Ionicons name="time" size={20} color={colors.text.secondary} />
              <Text style={styles.modalInfoText}>
                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
              </Text>
            </View>
          </View>

          {hasBooking && (
            <>
              {/* Client info */}
              <View style={styles.modalClientSection}>
                <Text style={styles.modalSectionTitle}>Client</Text>
                <View style={styles.modalClientCard}>
                  <View style={styles.modalClientAvatar}>
                    <Text style={styles.modalClientAvatarText}>
                      {slot.booking!.client_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalClientInfo}>
                    <Text style={styles.modalClientName}>
                      {slot.booking!.client_name}
                    </Text>
                    <Text style={styles.modalClientPhone}>
                      {slot.booking!.client_phone}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.modalStatusBadge,
                      { backgroundColor: statusColor.bg },
                    ]}
                  >
                    <Text style={[styles.modalStatusText, { color: statusColor.text }]}>
                      {slot.status === 'paid' ? 'Paye' : 'Non paye'}
                    </Text>
                  </View>
                </View>

                {slot.booking!.created_by_staff && (
                  <View style={styles.staffCreatedNote}>
                    <Ionicons name="person" size={14} color={colors.primary.main} />
                    <Text style={styles.staffCreatedText}>
                      Reserve par le manager
                    </Text>
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View style={styles.modalActions}>
                {/* Mark No-Show button - only for past slots */}
                {canMarkNoShow && (
                  <TouchableOpacity
                    style={styles.noShowButton}
                    onPress={onMarkNoShow}
                    disabled={isMarkingNoShow || isLoading}
                    activeOpacity={0.8}
                  >
                    {isMarkingNoShow ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="person-remove" size={20} color="#FFFFFF" />
                        <Text style={styles.noShowButtonText}>Marquer absent</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Cancel button - only for future slots */}
                {!canMarkNoShow && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                    disabled={isLoading || isMarkingNoShow}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.cancelButtonText}>Annuler la reservation</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function ManagerHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const {
    daySchedule,
    selectedDate,
    isLoading,
    error,
    setSelectedDate,
    fetchDaySchedule,
    cancelClientBooking,
    markNoShow,
  } = useManagerStore();

  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<CourtSchedule | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);

  // Load schedule on mount
  useEffect(() => {
    fetchDaySchedule();
  }, []);

  // Refresh on pull
  const onRefresh = useCallback(() => {
    fetchDaySchedule();
  }, [fetchDaySchedule]);

  // Date selection handler
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    fetchDaySchedule(date);
  }, [setSelectedDate, fetchDaySchedule]);

  // Slot press handler
  const handleSlotPress = (slot: ScheduleSlot, court: CourtSchedule) => {
    haptics.selection();

    if (slot.booking) {
      // Show detail modal
      setSelectedSlot(slot);
      setSelectedCourt(court);
      setModalVisible(true);
    } else {
      // Navigate to create booking
      navigation.navigate('ManagerBooking', {
        courtId: court.id,
        date: daySchedule?.date,
        timeSlotId: slot.time_slot_id,
      });
    }
  };

  // Cancel booking
  const handleCancelBooking = () => {
    if (!selectedSlot?.booking) return;

    Alert.alert(
      'Confirmer l\'annulation',
      `Voulez-vous vraiment annuler la reservation de ${selectedSlot.booking.client_name} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            const result = await cancelClientBooking(selectedSlot.booking!.id);
            setIsCancelling(false);

            if (result.success) {
              haptics.success();
              setModalVisible(false);
              setSelectedSlot(null);
              setSelectedCourt(null);
            }
          },
        },
      ]
    );
  };

  // Mark as no-show
  const handleMarkNoShow = () => {
    if (!selectedSlot?.booking) return;

    Alert.alert(
      'Confirmer l\'absence',
      `Voulez-vous marquer ${selectedSlot.booking.client_name} comme absent ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, marquer absent',
          style: 'destructive',
          onPress: async () => {
            setIsMarkingNoShow(true);
            const result = await markNoShow(selectedSlot.booking!.id);
            setIsMarkingNoShow(false);

            if (result.success) {
              haptics.success();
              setModalVisible(false);
              setSelectedSlot(null);
              setSelectedCourt(null);
              fetchDaySchedule();
            }
          },
        },
      ]
    );
  };

  // Create new booking
  const handleCreateBooking = () => {
    haptics.selection();
    navigation.navigate('ManagerBooking', undefined);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Planning</Text>
          <Text style={styles.headerSubtitle}>
            Bonjour, {user?.first_name || 'Manager'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateBooking}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Calendar Navigation */}
      <CalendarNavigation
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onOpenCalendar={() => setCalendarModalVisible(true)}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.free.bg, borderColor: STATUS_COLORS.free.border }]} />
          <Text style={styles.legendText}>Libre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.paid.bg, borderColor: STATUS_COLORS.paid.border }]} />
          <Text style={styles.legendText}>Paye</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.unpaid.bg, borderColor: STATUS_COLORS.unpaid.border }]} />
          <Text style={styles.legendText}>Non paye</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.past.bg, borderColor: STATUS_COLORS.past.border }]} />
          <Text style={styles.legendText}>Passe</Text>
        </View>
      </View>

      {/* Schedule Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !daySchedule ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Chargement du planning...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error.main} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchDaySchedule()}
            >
              <Text style={styles.retryButtonText}>Reessayer</Text>
            </TouchableOpacity>
          </View>
        ) : daySchedule?.courts && daySchedule.courts.length > 0 ? (
          <View style={styles.courtsGrid}>
            {daySchedule.courts.map((court) => (
              <CourtColumn
                key={court.id}
                court={court}
                date={daySchedule.date}
                onSlotPress={handleSlotPress}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>Aucun terrain configure</Text>
          </View>
        )}
      </ScrollView>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        visible={modalVisible}
        slot={selectedSlot}
        court={selectedCourt}
        date={daySchedule?.date || ''}
        onClose={() => setModalVisible(false)}
        onCancel={handleCancelBooking}
        onMarkNoShow={handleMarkNoShow}
        isLoading={isCancelling}
        isMarkingNoShow={isMarkingNoShow}
      />

      {/* Calendar Modal */}
      <CalendarModal
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarModalVisible(false)}
        onDateSelect={handleDateSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  // New Calendar Navigation Styles
  calendarNavContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
  },
  monthText: {
    ...textStyles.body,
    fontWeight: '700',
    color: colors.primary.main,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  todayButtonText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: colors.primary.main,
  },
  daysScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: DAY_ITEM_MARGIN * 2,
  },
  dayItem: {
    width: DAY_ITEM_WIDTH,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: DAY_ITEM_MARGIN,
  },
  dayItemSelected: {
    backgroundColor: colors.primary.main,
    ...shadows.md,
  },
  dayItemToday: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  dayName: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayNameToday: {
    color: colors.primary.main,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  dayNumToday: {
    color: colors.primary.main,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary.main,
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  calendarModalTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  calendarModalClose: {
    padding: spacing.xs,
  },
  calendarQuickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickActionText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: colors.primary.main,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  courtsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  courtColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  courtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 3,
  },
  courtTypeBadge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courtName: {
    ...textStyles.label,
    color: colors.text.primary,
    flex: 1,
  },
  slotsContainer: {
    padding: spacing.xs,
    gap: spacing.xs,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  slotCardPast: {
    opacity: 0.5,
  },
  slotTime: {
    ...textStyles.caption,
    fontWeight: '700',
    minWidth: 40,
  },
  slotBookingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  slotClientName: {
    ...textStyles.caption,
    fontWeight: '500',
    textAlign: 'right',
  },
  staffBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slotFreeText: {
    ...textStyles.caption,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  errorText: {
    ...textStyles.body,
    color: colors.error.main,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.disabled,
    marginTop: spacing.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalInfo: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalInfoText: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  modalClientSection: {
    padding: spacing.lg,
  },
  modalSectionTitle: {
    ...textStyles.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  modalClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  modalClientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClientAvatarText: {
    ...textStyles.h4,
    color: '#FFFFFF',
  },
  modalClientInfo: {
    flex: 1,
  },
  modalClientName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalClientPhone: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  modalStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  modalStatusText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  staffCreatedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
  },
  staffCreatedText: {
    ...textStyles.caption,
    color: colors.primary.main,
  },
  modalActions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.error.main,
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
  noShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.warning.main,
    borderRadius: borderRadius.lg,
  },
  noShowButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
});
