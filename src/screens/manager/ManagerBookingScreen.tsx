import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { useManagerStore, UserFine } from '../../stores/managerStore';
import { useBookingStore } from '../../stores/bookingStore';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import { formatDateForApi, formatPrice } from '../../utils/dateHelpers';
import { haptics } from '../../utils/haptics';
import { ManagerStackParamList } from '../../navigation/ManagerTabs';
import { Court, TimeSlot } from '../../types';

// Configure French locale for calendar
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

type NavigationProp = NativeStackNavigationProp<ManagerStackParamList>;
type RouteProps = RouteProp<ManagerStackParamList, 'ManagerBooking'>;

// Phone formatting helper
const formatPhoneForDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
};

const formatPhoneForApi = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `+225${digits}`;
};

export default function ManagerBookingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { courts, fetchCourts } = useBookingStore();
  const { createBookingForClient, isCreatingBooking, fetchDaySchedule } = useManagerStore();

  // Pre-filled from route params
  const prefilledCourtId = route.params?.courtId;
  const prefilledDate = route.params?.date;
  const prefilledTimeSlotId = route.params?.timeSlotId;

  // Form state
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(prefilledDate || formatDateForApi(new Date()));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Client form
  const [clientPhone, setClientPhone] = useState('');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [foundClientName, setFoundClientName] = useState<string>('');
  const [foundClientData, setFoundClientData] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    bookings_count: number;
    pending_fines_total: number;
    credits_balance: number;
  } | null>(null);

  // Fines warning state
  const [showFinesWarning, setShowFinesWarning] = useState(false);
  const [pendingFines, setPendingFines] = useState<UserFine[]>([]);
  const [pendingFinesTotal, setPendingFinesTotal] = useState(0);

  // Load courts on mount
  useEffect(() => {
    fetchCourts();
  }, []);

  // Set prefilled court
  useEffect(() => {
    if (prefilledCourtId && courts.length > 0) {
      const court = courts.find(c => c.id === prefilledCourtId);
      if (court) {
        setSelectedCourt(court);
      }
    }
  }, [prefilledCourtId, courts]);

  // Load available slots when court or date changes
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedCourt, selectedDate]);

  // Set prefilled slot
  useEffect(() => {
    if (prefilledTimeSlotId && availableSlots.length > 0) {
      const slot = availableSlots.find(s => s.id === prefilledTimeSlotId);
      if (slot) {
        setSelectedSlot(slot);
      }
    }
  }, [prefilledTimeSlotId, availableSlots]);

  const loadAvailableSlots = async () => {
    if (!selectedCourt) return;

    setLoadingSlots(true);
    try {
      // Use the existing Edge Function to get slots
      const { data: { session } } = await (await import('../../config/supabase')).supabase.auth.getSession();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-available-slots`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            court_id: selectedCourt.id,
            date: selectedDate,
          }),
        }
      );
      const data = await response.json();

      // Transform slots to map slot_id -> id (Edge Function returns slot_id, not id)
      const transformedSlots = (data.slots || []).map((slot: any) => ({
        id: slot.slot_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: slot.status,
        booking_id: slot.booking_id,
        can_override: slot.can_override,
      }));

      setAvailableSlots(transformedSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Search client by phone number
  const searchClientByPhone = async (phone: string) => {
    if (phone.length !== 10) return;

    setSearchingClient(true);
    try {
      const { data: { session } } = await (await import('../../config/supabase')).supabase.auth.getSession();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-search-client`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            phone: formatPhoneForApi(phone),
          }),
        }
      );
      const data = await response.json();

      if (data.found && data.client) {
        setClientFound(true);
        setFoundClientName(`${data.client.first_name || ''} ${data.client.last_name || ''}`.trim());
        setFoundClientData(data.client);
      } else {
        setClientFound(false);
        setFoundClientName('');
        setFoundClientData(null);
      }
    } catch (error) {
      console.error('Error searching client:', error);
      setClientFound(null);
      setFoundClientData(null);
    } finally {
      setSearchingClient(false);
    }
  };

  // Handle phone change with auto-search
  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setClientPhone(digits);

      // Reset client state when phone changes
      if (digits.length < 10) {
        setClientFound(null);
        setFoundClientName('');
        setFoundClientData(null);
        setClientFirstName('');
        setClientLastName('');
      }

      // Auto-search when 10 digits entered
      if (digits.length === 10) {
        searchClientByPhone(digits);
      }
    }
  };

  // Validate form
  const isFormValid = () => {
    if (!selectedCourt || !selectedDate || !selectedSlot) return false;
    if (clientPhone.length !== 10) return false;
    // If client not found, need name
    if (clientFound === false && (!clientFirstName.trim() || !clientLastName.trim())) return false;
    return true;
  };

  // Submit booking
  const handleSubmit = async (force = false) => {
    if (!isFormValid()) return;

    haptics.selection();

    const params: any = {
      court_id: selectedCourt!.id,
      time_slot_id: selectedSlot!.id,
      date: selectedDate,
      client_phone: formatPhoneForApi(clientPhone),
    };

    // Add name if client doesn't exist
    if (clientFound === false || clientFound === null) {
      if (clientFirstName.trim()) params.client_first_name = clientFirstName.trim();
      if (clientLastName.trim()) params.client_last_name = clientLastName.trim();
    }

    if (force) {
      params.force = true;
    }

    const result = await createBookingForClient(params);

    if (result.success) {
      if (result.warning === 'CLIENT_HAS_PENDING_FINES') {
        // Show fines warning
        setPendingFines(result.fines || []);
        setPendingFinesTotal(result.pending_fines_total || 0);
        setFoundClientName(
          `${result.client?.first_name || ''} ${result.client?.last_name || ''}`.trim()
        );
        setShowFinesWarning(true);
      } else {
        // Success!
        haptics.success();
        Alert.alert(
          'Reservation confirmee',
          result.client_created
            ? `Compte cree et reservation confirmee pour ${result.client?.first_name} ${result.client?.last_name}`
            : result.message || 'Reservation creee avec succes',
          [
            {
              text: 'OK',
              onPress: () => {
                fetchDaySchedule();
                navigation.goBack();
              },
            },
          ]
        );
      }
    } else {
      // Handle specific errors
      if (result.error_code === 'CLIENT_NOT_FOUND_NEEDS_INFO') {
        setClientFound(false);
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
      }
    }
  };

  // Handle force booking (after fines warning)
  const handleForceBooking = () => {
    setShowFinesWarning(false);
    handleSubmit(true);
  };

  // Min date is today
  const today = formatDateForApi(new Date());
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  const maxDateStr = formatDateForApi(maxDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle reservation</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Court Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terrain</Text>
            <View style={styles.courtsRow}>
              {courts.map((court) => {
                const isSelected = selectedCourt?.id === court.id;
                const typeColor = court.type === 'football' ? '#10B981' : '#3B82F6';

                return (
                  <TouchableOpacity
                    key={court.id}
                    style={[
                      styles.courtCard,
                      isSelected && [styles.courtCardSelected, { borderColor: typeColor }],
                    ]}
                    onPress={() => {
                      setSelectedCourt(court);
                      setSelectedSlot(null);
                      haptics.selection();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.courtIcon, { backgroundColor: typeColor }]}>
                      <Ionicons
                        name={court.type === 'football' ? 'football' : 'tennisball'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={[styles.courtName, isSelected && styles.courtNameSelected]}>
                      {court.name}
                    </Text>
                    <Text style={styles.courtPrice}>{formatPrice(court.price)}</Text>
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: typeColor }]}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                current={selectedDate}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setSelectedSlot(null);
                  haptics.selection();
                }}
                minDate={today}
                maxDate={maxDateStr}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: colors.primary.main,
                  },
                }}
                theme={{
                  backgroundColor: '#FFFFFF',
                  calendarBackground: '#FFFFFF',
                  selectedDayBackgroundColor: colors.primary.main,
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: colors.primary.main,
                  dayTextColor: colors.text.primary,
                  textDisabledColor: colors.text.disabled,
                  arrowColor: colors.primary.main,
                  monthTextColor: colors.text.primary,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '600',
                }}
                enableSwipeMonths
              />
            </View>
          </View>

          {/* Time Slot Selection */}
          {selectedCourt && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Creneau</Text>
              {loadingSlots ? (
                <ActivityIndicator size="small" color={colors.primary.main} style={styles.slotsLoading} />
              ) : availableSlots.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.slotsRow}
                >
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isFree = slot.status === 'free' || slot.can_override;
                    const isPast = slot.status === 'past';

                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.slotChip,
                          isSelected && styles.slotChipSelected,
                          !isFree && styles.slotChipDisabled,
                          isPast && styles.slotChipPast,
                        ]}
                        onPress={() => {
                          if (isFree && !isPast) {
                            setSelectedSlot(slot);
                            haptics.selection();
                          }
                        }}
                        disabled={!isFree || isPast}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.slotChipText,
                            isSelected && styles.slotChipTextSelected,
                            !isFree && styles.slotChipTextDisabled,
                          ]}
                        >
                          {slot.start_time.slice(0, 5)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.noSlotsText}>Aucun creneau disponible</Text>
              )}
            </View>
          )}

          {/* Client Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>

            {/* Phone Input */}
            <View style={styles.phoneInputContainer}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+225</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={formatPhoneForDisplay(clientPhone)}
                onChangeText={handlePhoneChange}
                placeholder="XX XX XX XX XX"
                placeholderTextColor={colors.text.disabled}
                keyboardType="phone-pad"
                maxLength={14} // With spaces
              />
              {clientFound !== null && (
                <View style={[
                  styles.phoneStatus,
                  { backgroundColor: clientFound ? colors.success.light : colors.warning.light }
                ]}>
                  <Ionicons
                    name={clientFound ? 'checkmark-circle' : 'person-add'}
                    size={16}
                    color={clientFound ? colors.success.main : colors.warning.main}
                  />
                </View>
              )}
            </View>

            {/* Loading indicator during search */}
            {searchingClient && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.searchingText}>Recherche du client...</Text>
              </View>
            )}

            {/* Client Identity Card - shown when client found */}
            {clientFound && foundClientData && !searchingClient && (
              <View style={styles.clientIdentityCard}>
                {/* Header with avatar and name */}
                <View style={styles.clientIdentityHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {(foundClientData.first_name?.charAt(0) || '?').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clientIdentityInfo}>
                    <View style={styles.clientNameRow}>
                      <Text style={styles.clientIdentityName}>
                        {foundClientData.first_name} {foundClientData.last_name}
                      </Text>
                      <View style={styles.clientVerifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success.main} />
                        <Text style={styles.clientVerifiedText}>Existant</Text>
                      </View>
                    </View>
                    <Text style={styles.clientIdentityPhone}>{foundClientData.phone}</Text>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.clientStatsRow}>
                  {/* Bookings Count */}
                  <View style={styles.clientStatItem}>
                    <Ionicons name="calendar" size={16} color={colors.primary.main} />
                    <Text style={styles.clientStatValue}>{foundClientData.bookings_count}</Text>
                    <Text style={styles.clientStatLabel}>reservations</Text>
                  </View>

                  {/* Credits */}
                  <View style={[
                    styles.clientStatItem,
                    foundClientData.credits_balance > 0 && styles.clientStatItemSuccess
                  ]}>
                    <Ionicons
                      name="wallet"
                      size={16}
                      color={foundClientData.credits_balance > 0 ? colors.success.main : colors.text.disabled}
                    />
                    <Text style={[
                      styles.clientStatValue,
                      foundClientData.credits_balance > 0 && styles.clientStatValueSuccess
                    ]}>
                      {formatPrice(foundClientData.credits_balance)}
                    </Text>
                    <Text style={styles.clientStatLabel}>credits</Text>
                  </View>

                  {/* Fines */}
                  <View style={[
                    styles.clientStatItem,
                    foundClientData.pending_fines_total > 0 && styles.clientStatItemDanger
                  ]}>
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color={foundClientData.pending_fines_total > 0 ? colors.error.main : colors.text.disabled}
                    />
                    <Text style={[
                      styles.clientStatValue,
                      foundClientData.pending_fines_total > 0 && styles.clientStatValueDanger
                    ]}>
                      {formatPrice(foundClientData.pending_fines_total)}
                    </Text>
                    <Text style={styles.clientStatLabel}>amendes</Text>
                  </View>
                </View>

                {/* Warning banner if has fines */}
                {foundClientData.pending_fines_total > 0 && (
                  <View style={styles.clientFinesWarning}>
                    <Ionicons name="warning" size={16} color={colors.error.dark} />
                    <Text style={styles.clientFinesWarningText}>
                      Client bloque sur l'app - Amendes a regulariser
                    </Text>
                  </View>
                )}

                {/* Credits info if has credits */}
                {foundClientData.credits_balance > 0 && (
                  <View style={styles.clientCreditsInfo}>
                    <Ionicons name="information-circle" size={16} color={colors.success.dark} />
                    <Text style={styles.clientCreditsInfoText}>
                      Le credit sera automatiquement utilise
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Name fields for new client */}
            {clientFound === false && (
              <View style={styles.newClientForm}>
                <Text style={styles.newClientLabel}>Nouveau client - Informations requises:</Text>
                <View style={styles.nameRow}>
                  <View style={styles.nameInputContainer}>
                    <Text style={styles.inputLabel}>Prenom</Text>
                    <TextInput
                      style={styles.nameInput}
                      value={clientFirstName}
                      onChangeText={setClientFirstName}
                      placeholder="Prenom"
                      placeholderTextColor={colors.text.disabled}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.nameInputContainer}>
                    <Text style={styles.inputLabel}>Nom</Text>
                    <TextInput
                      style={styles.nameInput}
                      value={clientLastName}
                      onChangeText={setClientLastName}
                      placeholder="Nom"
                      placeholderTextColor={colors.text.disabled}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Summary */}
          {selectedCourt && selectedSlot && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Recapitulatif</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Terrain</Text>
                <Text style={styles.summaryValue}>{selectedCourt.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Heure</Text>
                <Text style={styles.summaryValue}>
                  {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{formatPrice(selectedCourt.price)}</Text>
              </View>
            </View>
          )}

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
            onPress={() => handleSubmit()}
            disabled={!isFormValid() || isCreatingBooking}
            activeOpacity={0.8}
          >
            {isCreatingBooking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Confirmer - {selectedCourt ? formatPrice(selectedCourt.price) : '---'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Fines Warning Modal */}
        {showFinesWarning && (
          <View style={styles.finesOverlay}>
            <View style={styles.finesModal}>
              <View style={styles.finesHeader}>
                <Ionicons name="warning" size={32} color={colors.warning.main} />
                <Text style={styles.finesTitle}>Client avec amendes</Text>
              </View>
              <Text style={styles.finesClientName}>{foundClientName}</Text>
              <Text style={styles.finesTotal}>
                Amendes en attente: <Text style={styles.finesTotalAmount}>{formatPrice(pendingFinesTotal)}</Text>
              </Text>
              <Text style={styles.finesMessage}>
                Ce client ne pourra pas reserver via l'app tant qu'il n'aura pas regularise ses amendes.
                Informez-le avant de confirmer.
              </Text>
              <View style={styles.finesActions}>
                <TouchableOpacity
                  style={styles.finesCancelButton}
                  onPress={() => setShowFinesWarning(false)}
                >
                  <Text style={styles.finesCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.finesConfirmButton}
                  onPress={handleForceBooking}
                  disabled={isCreatingBooking}
                >
                  {isCreatingBooking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.finesConfirmText}>Confirmer quand meme</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courtsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  courtCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  courtCardSelected: {
    borderWidth: 2,
  },
  courtIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  courtName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  courtNameSelected: {
    color: colors.primary.main,
  },
  courtPrice: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  slotsLoading: {
    padding: spacing.xl,
  },
  slotsRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slotChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  slotChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  slotChipDisabled: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.light,
  },
  slotChipPast: {
    opacity: 0.5,
  },
  slotChipText: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
  },
  slotChipTextDisabled: {
    color: colors.text.disabled,
  },
  noSlotsText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  phonePrefixText: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...textStyles.body,
    color: colors.text.primary,
  },
  phoneStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  // Searching indicator
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  searchingText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  // Client Identity Card
  clientIdentityCard: {
    marginTop: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.success.main,
    ...shadows.md,
  },
  clientIdentityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  clientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clientIdentityInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  clientIdentityName: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  clientVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  clientVerifiedText: {
    ...textStyles.caption,
    color: colors.success.main,
    fontWeight: '600',
  },
  clientIdentityPhone: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  clientStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  clientStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  clientStatItemSuccess: {
    backgroundColor: colors.success.light,
  },
  clientStatItemDanger: {
    backgroundColor: colors.error.light,
  },
  clientStatValue: {
    ...textStyles.body,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  clientStatValueSuccess: {
    color: colors.success.main,
  },
  clientStatValueDanger: {
    color: colors.error.main,
  },
  clientStatLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  clientFinesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error.main,
  },
  clientFinesWarningText: {
    ...textStyles.bodySmall,
    color: colors.error.dark,
    flex: 1,
    fontWeight: '500',
  },
  clientCreditsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success.main,
  },
  clientCreditsInfoText: {
    ...textStyles.bodySmall,
    color: colors.success.dark,
    flex: 1,
  },
  newClientForm: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.lg,
  },
  newClientLabel: {
    ...textStyles.bodySmall,
    color: colors.warning.dark,
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameInputContainer: {
    flex: 1,
  },
  inputLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  summaryTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  summaryTotalLabel: {
    ...textStyles.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryTotalValue: {
    ...textStyles.h4,
    color: colors.primary.main,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  submitButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
  // Fines Warning Modal
  finesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  finesModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.xl,
  },
  finesHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  finesTitle: {
    ...textStyles.h4,
    color: colors.warning.dark,
    marginTop: spacing.sm,
  },
  finesClientName: {
    ...textStyles.body,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  finesTotal: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  finesTotalAmount: {
    fontWeight: '700',
    color: colors.error.main,
  },
  finesMessage: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  finesActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  finesCancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  finesCancelText: {
    ...textStyles.button,
    color: colors.text.secondary,
  },
  finesConfirmButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warning.main,
    alignItems: 'center',
  },
  finesConfirmText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
});
