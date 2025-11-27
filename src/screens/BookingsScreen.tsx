import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useBookingStore } from '../stores/bookingStore';
import { formatDate, formatTime, formatPrice } from '../utils/dateHelpers';
import { colors, spacing, borderRadius, textStyles } from '../theme';
import haptics from '../utils/haptics';
import CourtCard from '../components/CourtCard';
import BookingDetailModal from '../components/BookingDetailModal';
import { Court, Booking, BookingStatus, PaymentMethod, MobilePaymentMethod, getInitials } from '../types';

type BookingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// Fonction pour obtenir le label et les styles du statut
function getStatusConfig(status: BookingStatus) {
  switch (status) {
    case 'paid':
      return { label: 'Payé', bgColor: '#D1FAE5', textColor: '#065F46' };
    case 'unpaid':
      return { label: 'Non payé', bgColor: '#FEF3C7', textColor: '#92400E' };
    case 'completed':
      return { label: 'Terminé', bgColor: '#E5E7EB', textColor: '#6B7280' };
    case 'cancelled':
      return { label: 'Annulé', bgColor: '#FEE2E2', textColor: '#991B1B' };
    case 'cancelled_by_override':
      return { label: 'Pris par payant', bgColor: '#FEE2E2', textColor: '#991B1B' };
    case 'no_show':
      return { label: 'Absent', bgColor: '#FEE2E2', textColor: '#991B1B' };
    case 'confirmed':
      return { label: 'Confirmé', bgColor: '#D1FAE5', textColor: '#065F46' };
    default:
      return { label: status, bgColor: '#E5E7EB', textColor: '#6B7280' };
  }
}

export default function BookingsScreen({ navigation }: BookingsScreenProps) {
  const { user } = useAuthStore();
  const {
    userBookings,
    fetchUserBookings,
    courts,
    fetchCourts,
    selectCourt,
    cancelBooking,
    payExistingBooking,
    checkUserCanBook,
    pendingFines,
    pendingFinesTotal,
    isLoading,
    userCreditsBalance,
    fetchUserCredits,
  } = useBookingStore();

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchCourts();
    if (user?.id) {
      fetchUserBookings(user.id);
      checkUserCanBook();
      fetchUserCredits();
    }
  }, [user?.id]);

  const handleCourtPress = (court: Court) => {
    selectCourt(court);
    navigation.navigate('Booking');
  };

  const handleRefresh = () => {
    fetchCourts();
    if (user?.id) {
      fetchUserBookings(user.id);
      checkUserCanBook();
    }
  };

  const handleProfilePress = () => {
    haptics.light();
    navigation.getParent()?.navigate('ProfileTab');
  };

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedBooking(null);
  };

  const handlePayBooking = async (booking: Booking, paymentMethod: PaymentMethod, useCredit?: boolean, mobileMethod?: MobilePaymentMethod) => {
    setIsPaying(true);
    const result = await payExistingBooking(booking.id, paymentMethod, useCredit, mobileMethod);
    setIsPaying(false);

    if (result.success) {
      Alert.alert(
        'Paiement confirmé',
        result.message || 'Votre réservation est maintenant verrouillée.',
        [{ text: 'OK', onPress: handleCloseModal }]
      );
      // Refresh bookings list and credits
      if (user?.id) {
        fetchUserBookings(user.id);
        fetchUserCredits();
      }
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors du paiement');
    }
  };

  const handleCancelFromModal = (booking: Booking) => {
    handleCloseModal();
    handleCancelBooking(booking);
  };

  const handleCancelBooking = (booking: Booking) => {
    const isPaid = booking.status === 'paid';
    const bookingDate = new Date(`${booking.date}T${booking.time_slot?.start_time || '00:00:00'}`);
    const hoursUntil = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const isLate = hoursUntil <= 12;

    let message = 'Voulez-vous vraiment annuler cette réservation ?';

    if (isLate) {
      if (isPaid) {
        message += `\n\nAnnulation tardive : vous serez crédité de 50% (${formatPrice(Math.floor(booking.total_amount / 2))}).`;
      } else {
        message += `\n\nAnnulation tardive : une amende de 50% (${formatPrice(Math.floor(booking.total_amount / 2))}) sera appliquée.`;
      }
    } else {
      if (isPaid) {
        message += `\n\nVous serez crédité de 100% (${formatPrice(booking.total_amount)}).`;
      }
    }

    Alert.alert(
      'Annuler la réservation',
      message,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            const result = await cancelBooking(booking.id);
            setCancellingId(null);

            if (result.success) {
              Alert.alert('Réservation annulée', result.message);
            } else {
              Alert.alert('Erreur', result.error || 'Erreur lors de l\'annulation');
            }
          },
        },
      ]
    );
  };

  // Filtrer les réservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = userBookings.filter(
    b => ['paid', 'unpaid', 'confirmed'].includes(b.status) && new Date(b.date) >= today
  );

  const pastBookings = userBookings.filter(
    b => !['paid', 'unpaid', 'confirmed'].includes(b.status) || new Date(b.date) < today
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes réservations</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#F97316']}
            tintColor="#F97316"
          />
        }
      >
        {/* Alerte amendes */}
        {pendingFinesTotal > 0 && (
          <View style={styles.fineAlert}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <View style={styles.fineAlertContent}>
              <Text style={styles.fineAlertTitle}>Amende en attente</Text>
              <Text style={styles.fineAlertText}>
                Vous devez régler {formatPrice(pendingFinesTotal)} avant de pouvoir réserver.
              </Text>
            </View>
          </View>
        )}

        {/* Section Réserver un terrain */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réserver un terrain</Text>
          {courts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              onPress={() => handleCourtPress(court)}
            />
          ))}
        </View>

        {/* Réservations à venir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            A venir ({upcomingBookings.length})
          </Text>

          {isLoading && userBookings.length === 0 ? (
            <ActivityIndicator color="#F97316" style={styles.loader} />
          ) : upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune réservation à venir</Text>
              <Text style={styles.emptySubtext}>Choisissez un terrain ci-dessus pour réserver</Text>
            </View>
          ) : (
            upcomingBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              const isCancelling = cancellingId === booking.id;

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => handleBookingPress(booking)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bookingHeader}>
                    <View style={[styles.bookingIconContainer, booking.court?.type === 'football' ? styles.footballIcon : styles.padelIcon]}>
                      <MaterialCommunityIcons
                        name={booking.court?.type === 'football' ? 'soccer' : 'tennis'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle}>{booking.court?.name}</Text>
                      <Text style={styles.bookingDate}>
                        {formatDate(booking.date, 'EEEE d MMMM')}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                      <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Warning si non payé */}
                  {booking.status === 'unpaid' && (
                    <View style={styles.unpaidWarning}>
                      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                      <Text style={styles.unpaidWarningText}>
                        Peut être pris par quelqu'un qui paie
                      </Text>
                    </View>
                  )}

                  <View style={styles.bookingDetails}>
                    <Text style={styles.bookingTime}>
                      {booking.time_slot && formatTime(booking.time_slot.start_time)} - {booking.time_slot && formatTime(booking.time_slot.end_time)}
                    </Text>
                    <Text style={styles.bookingPrice}>
                      {formatPrice(booking.total_amount)}
                    </Text>
                  </View>

                  {/* Indicateur de clic */}
                  <View style={styles.tapHint}>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Historique */}
        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Historique ({pastBookings.length})
            </Text>

            {pastBookings.slice(0, 10).map((booking) => {
              const statusConfig = getStatusConfig(booking.status);

              return (
                <View key={booking.id} style={[styles.bookingCard, styles.bookingCardPast]}>
                  <View style={styles.bookingHeader}>
                    <View style={[styles.bookingIconContainer, booking.court?.type === 'football' ? styles.footballIcon : styles.padelIcon]}>
                      <MaterialCommunityIcons
                        name={booking.court?.type === 'football' ? 'soccer' : 'tennis'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle}>{booking.court?.name}</Text>
                      <Text style={styles.bookingDate}>
                        {formatDate(booking.date, 'd MMMM yyyy')}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                      <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Message si overridé */}
                  {booking.status === 'cancelled_by_override' && (
                    <View style={styles.overrideMessage}>
                      <Text style={styles.overrideMessageText}>
                        Votre réservation a été prise par quelqu'un qui a payé.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de détails */}
      <BookingDetailModal
        visible={isModalVisible}
        booking={selectedBooking}
        onClose={handleCloseModal}
        onCancel={handleCancelFromModal}
        onPay={handlePayBooking}
        isCancelling={cancellingId === selectedBooking?.id}
        isPaying={isPaying}
        creditBalance={userCreditsBalance}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 14,
    fontFamily: textStyles.button.fontFamily,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fineAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  fineAlertContent: {
    flex: 1,
    marginLeft: 12,
  },
  fineAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  fineAlertText: {
    fontSize: 14,
    color: '#B91C1C',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  loader: {
    paddingVertical: 40,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingCardPast: {
    opacity: 0.7,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  footballIcon: {
    backgroundColor: '#10B981',
  },
  padelIcon: {
    backgroundColor: '#3B82F6',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  bookingDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unpaidWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  unpaidWarningText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tapHint: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -8,
  },
  overrideMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  overrideMessageText: {
    fontSize: 12,
    color: '#991B1B',
  },
});
