import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { getInitials } from '../types';
import { formatDate, formatDateForApi, formatPrice, getNextDays } from '../utils/dateHelpers';
import { colors, spacing, borderRadius, textStyles } from '../theme';
import haptics from '../utils/haptics';

// Configuration locale française pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: 'Aujourd\'hui'
};
LocaleConfig.defaultLocale = 'fr';

type BookingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function BookingScreen({ navigation }: BookingScreenProps) {
  const {
    selectedCourt,
    selectedDate,
    availableSlots,
    selectedSlot,
    selectDate,
    selectSlot,
    isLoading,
    error,
    userCreditsBalance,
  } = useBookingStore();
  const { user } = useAuthStore();

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Vérifier qu'un terrain est sélectionné
  useEffect(() => {
    if (!selectedCourt) {
      navigation.goBack();
    }
  }, [selectedCourt]);

  if (!selectedCourt) {
    return null;
  }

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDateStr(day.dateString);
    selectDate(new Date(day.dateString));
  };

  const handleContinue = () => {
    if (selectedSlot) {
      navigation.navigate('Confirmation');
    }
  };

  const handleProfilePress = () => {
    haptics.light();
    navigation.getParent()?.navigate('ProfileTab');
  };

  // Dates min et max (aujourd'hui + 14 jours)
  const today = formatDateForApi(new Date());
  const maxDate = formatDateForApi(getNextDays(14)[13]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{selectedCourt.name}</Text>
          <Text style={styles.headerSubtitle}>{formatPrice(selectedCourt.price)} / {selectedCourt.duration} min</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.creditBadge}>
            <Ionicons name="wallet-outline" size={14} color={colors.success.main} />
            <Text style={styles.creditBadgeText}>{formatPrice(userCreditsBalance)}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Text style={styles.profileButtonText}>{getInitials(user)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendrier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisissez une date</Text>

          <View style={styles.calendarContainer}>
            <Calendar
              current={today}
              minDate={today}
              maxDate={maxDate}
              onDayPress={handleDateSelect}
              markedDates={{
                ...(selectedDateStr && {
                  [selectedDateStr]: {
                    selected: true,
                    selectedColor: '#F97316',
                  },
                }),
              }}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#6B7280',
                selectedDayBackgroundColor: '#F97316',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#F97316',
                dayTextColor: '#1F2937',
                textDisabledColor: '#D1D5DB',
                dotColor: '#F97316',
                arrowColor: '#F97316',
                monthTextColor: '#1F2937',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>
        </View>

        {/* Créneaux horaires */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Créneaux du {formatDate(selectedDate, 'EEEE d MMMM')}
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#F97316" />
                <Text style={styles.loadingText}>Chargement des créneaux...</Text>
              </View>
            ) : (
              <TimeSlotPicker
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={selectSlot}
              />
            )}
          </View>
        )}

        {/* Erreur */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer - Bouton Continuer */}
      {selectedSlot && (
        <View style={styles.footer}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Récapitulatif</Text>
            <Text style={styles.summaryText}>
              {formatDate(selectedDate!, 'd MMM')} • {selectedSlot.start_time.substring(0, 5)} - {selectedSlot.end_time.substring(0, 5)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#1F2937',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  creditBadgeText: {
    fontSize: 12,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '600',
    color: colors.success.main,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 13,
    fontFamily: textStyles.button.fontFamily,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryContainer: {
    flex: 1,
    marginRight: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  continueButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
