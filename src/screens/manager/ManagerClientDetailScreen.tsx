import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useManagerStore, BookingWithRelations } from '../../stores/managerStore';
import { supabase } from '../../config/supabase';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import { formatPrice } from '../../utils/dateHelpers';
import { haptics } from '../../utils/haptics';
import { ManagerStackParamList } from '../../navigation/ManagerTabs';

type NavigationProp = NativeStackNavigationProp<ManagerStackParamList>;
type RouteProps = RouteProp<ManagerStackParamList, 'ManagerClientDetail'>;

// Status config
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: 'Paye', bg: '#E8F5E9', text: '#2E7D32' },
  confirmed: { label: 'Confirme', bg: '#E8F5E9', text: '#2E7D32' },
  unpaid: { label: 'Non paye', bg: '#FFF3E0', text: '#E65100' },
  pending: { label: 'En attente', bg: '#FFF3E0', text: '#E65100' },
  cancelled: { label: 'Annule', bg: '#FFEBEE', text: '#C62828' },
  cancelled_by_override: { label: 'Override', bg: '#FFEBEE', text: '#C62828' },
  no_show: { label: 'Absent', bg: '#FFEBEE', text: '#C62828' },
  completed: { label: 'Termine', bg: '#F5F5F5', text: '#757575' },
};

// Booking history item
const BookingHistoryItem = ({ booking }: { booking: BookingWithRelations }) => {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const courtType = booking.court?.type;
  const typeColor = courtType === 'football' ? '#10B981' : '#3B82F6';

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <View style={[styles.historyCourtBadge, { backgroundColor: typeColor }]}>
          <Ionicons
            name={courtType === 'football' ? 'football' : 'tennisball'}
            size={12}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyDate}>{booking.date}</Text>
          <Text style={styles.historyTime}>
            {booking.time_slot?.start_time.slice(0, 5)} - {booking.time_slot?.end_time.slice(0, 5)}
          </Text>
        </View>
      </View>
      <View style={[styles.historyStatus, { backgroundColor: status.bg }]}>
        <Text style={[styles.historyStatusText, { color: status.text }]}>{status.label}</Text>
      </View>
    </View>
  );
};

export default function ManagerClientDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { selectedClient, setSelectedClient } = useManagerStore();

  const [clientBookings, setClientBookings] = useState<BookingWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = route.params.clientId;

  // Load client bookings
  useEffect(() => {
    loadClientBookings();
  }, [clientId]);

  const loadClientBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*),
          time_slot:time_slots(*)
        `)
        .eq('user_id', clientId)
        .order('date', { ascending: false })
        .limit(20);

      if (!error && data) {
        setClientBookings(data as any);
      }
    } catch (error) {
      console.error('Error loading client bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create booking for this client
  const handleCreateBooking = () => {
    haptics.selection();
    navigation.navigate('ManagerBooking', { clientId });
  };

  if (!selectedClient) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() || 'Client';
  const hasFines = selectedClient.pending_fines_total > 0;
  const hasCredits = selectedClient.credits_balance > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fiche client</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profilePhone}>{selectedClient.phone}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{selectedClient.bookings_count}</Text>
              <Text style={styles.statLabel}>Reservations</Text>
            </View>
            <View style={[styles.statBox, hasCredits && styles.statBoxSuccess]}>
              <Text style={[styles.statValue, hasCredits && styles.statValueSuccess]}>
                {formatPrice(selectedClient.credits_balance)}
              </Text>
              <Text style={styles.statLabel}>Credits</Text>
            </View>
            <View style={[styles.statBox, hasFines && styles.statBoxError]}>
              <Text style={[styles.statValue, hasFines && styles.statValueError]}>
                {formatPrice(selectedClient.pending_fines_total)}
              </Text>
              <Text style={styles.statLabel}>Amendes</Text>
            </View>
          </View>

          {/* Warning if fines */}
          {hasFines && (
            <View style={styles.finesWarning}>
              <Ionicons name="warning" size={20} color={colors.error.main} />
              <Text style={styles.finesWarningText}>
                Ce client a des amendes en attente. Il ne peut pas reserver via l'app.
              </Text>
            </View>
          )}

          {/* Create booking button */}
          <TouchableOpacity
            style={styles.createBookingButton}
            onPress={handleCreateBooking}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.createBookingText}>Nouvelle reservation</Text>
          </TouchableOpacity>
        </View>

        {/* Booking History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique des reservations</Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary.main} style={styles.loading} />
          ) : clientBookings.length > 0 ? (
            <View style={styles.historyList}>
              {clientBookings.map((booking) => (
                <BookingHistoryItem key={booking.id} booking={booking} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="calendar-outline" size={40} color={colors.text.disabled} />
              <Text style={styles.emptyHistoryText}>Aucune reservation</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerBackButton: {
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
    paddingBottom: spacing['4xl'],
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileAvatarText: {
    ...textStyles.h1,
    color: '#FFFFFF',
  },
  profileName: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profilePhone: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statBoxSuccess: {
    backgroundColor: colors.success.light,
  },
  statBoxError: {
    backgroundColor: colors.error.light,
  },
  statValue: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statValueSuccess: {
    color: colors.success.main,
  },
  statValueError: {
    color: colors.error.main,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  finesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
  },
  finesWarningText: {
    flex: 1,
    ...textStyles.bodySmall,
    color: colors.error.dark,
  },
  createBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  createBookingText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  loading: {
    padding: spacing.xl,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyCourtBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {},
  historyDate: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  historyTime: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  historyStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  historyStatusText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyHistoryText: {
    ...textStyles.body,
    color: colors.text.disabled,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...textStyles.body,
    color: colors.error.main,
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
});
