import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useBookingStore } from '../stores/bookingStore';
import { formatDate, formatTime, formatPrice } from '../utils/dateHelpers';

export default function BookingsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { userBookings, fetchUserBookings, isLoading } = useBookingStore();

  useEffect(() => {
    if (user?.id) {
      fetchUserBookings(user.id);
    }
  }, [user?.id]);

  const upcomingBookings = userBookings.filter(
    b => b.status === 'confirmed' && new Date(b.date) >= new Date()
  );

  const pastBookings = userBookings.filter(
    b => b.status !== 'confirmed' || new Date(b.date) < new Date()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes réservations</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => navigation.navigate('HomeTab')}
              >
                <Text style={styles.bookNowText}>Réserver maintenant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
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
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Confirmé</Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingTime}>
                    {booking.time_slot && formatTime(booking.time_slot.start_time)} - {booking.time_slot && formatTime(booking.time_slot.end_time)}
                  </Text>
                  <Text style={styles.bookingPrice}>
                    {formatPrice(booking.total_amount)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Historique */}
        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Historique ({pastBookings.length})
            </Text>

            {pastBookings.map((booking) => (
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
                  <View style={[
                    styles.statusBadge,
                    booking.status === 'cancelled' && styles.statusCancelled,
                    booking.status === 'completed' && styles.statusCompleted,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.status !== 'confirmed' && styles.statusTextLight,
                    ]}>
                      {booking.status === 'cancelled' ? 'Annulé' :
                       booking.status === 'completed' ? 'Terminé' : 'Passé'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  bookNowButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bookNowText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusCompleted: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  statusTextLight: {
    color: '#6B7280',
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
});
