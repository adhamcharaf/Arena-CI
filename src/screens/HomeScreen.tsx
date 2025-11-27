import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { getInitials } from '../types';
import { formatPrice } from '../utils/dateHelpers';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuthStore();
  const { courts, fetchCourts, selectCourt, isLoading, userCreditsBalance, fetchUserCredits } = useBookingStore();

  useEffect(() => {
    fetchCourts();
    fetchUserCredits();
  }, []);

  const handleRefresh = () => {
    fetchCourts();
    fetchUserCredits();
  };

  const footballCourt = courts.find(c => c.type === 'football');
  const padelCourt = courts.find(c => c.type === 'padel');

  const handleFootballPress = () => {
    if (footballCourt) {
      selectCourt(footballCourt);
      navigation.navigate('Booking');
    }
  };

  const handlePadelPress = () => {
    if (padelCourt) {
      selectCourt(padelCourt);
      navigation.navigate('Booking');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>
              Bonjour{user?.first_name ? `, ${user.first_name}` : ''}
            </Text>
            <MaterialCommunityIcons name="hand-wave" size={16} color="#F97316" style={styles.waveIcon} />
          </View>
          <Text style={styles.headerTitle}>Bienvenue</Text>
        </View>

        {/* Credit badge + Profile button */}
        <View style={styles.headerRight}>
          {userCreditsBalance > 0 && (
            <View style={styles.creditBadge}>
              <Ionicons name="wallet-outline" size={14} color="#10B981" />
              <Text style={styles.creditBadgeText}>{formatPrice(userCreditsBalance)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.getParent()?.navigate('ProfileTab')}
          >
            <Text style={styles.profileButtonText}>
              {getInitials(user)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
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
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconContainer}>
            <MaterialCommunityIcons name="stadium-variant" size={48} color="#F97316" />
          </View>
          <Text style={styles.heroTitle}>ARENA GRAND-BASSAM</Text>
          <Text style={styles.heroSubtitle}>Votre complexe sportif</Text>

          <View style={styles.heroFeatures}>
            <View style={styles.heroFeature}>
              <Ionicons name="time-outline" size={16} color="#10B981" />
              <Text style={styles.heroFeatureText}>Ouvert 24h/24</Text>
            </View>
            <View style={styles.heroFeatureDot} />
            <View style={styles.heroFeature}>
              <Ionicons name="calendar-outline" size={16} color="#10B981" />
              <Text style={styles.heroFeatureText}>7j/7</Text>
            </View>
          </View>

          <View style={styles.heroLocation}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.heroLocationText}>Grand-Bassam, Côte d'Ivoire</Text>
          </View>
        </View>

        {/* Quick Booking Section */}
        <View style={styles.quickBookingSection}>
          <Text style={styles.sectionTitle}>Réservez maintenant</Text>

          <View style={styles.sportPillsContainer}>
            {/* Football Pill */}
            <TouchableOpacity
              style={[styles.sportPill, styles.footballPill]}
              onPress={handleFootballPress}
              activeOpacity={0.8}
            >
              <View style={styles.sportPillIcon}>
                <MaterialCommunityIcons name="soccer" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.sportPillName}>Football</Text>
              <Text style={styles.sportPillPrice}>
                {footballCourt ? formatPrice(footballCourt.price) : '...'}
              </Text>
              <View style={styles.sportPillArrow}>
                <Ionicons name="arrow-forward" size={16} color="#065F46" />
              </View>
            </TouchableOpacity>

            {/* Padel Pill */}
            <TouchableOpacity
              style={[styles.sportPill, styles.padelPill]}
              onPress={handlePadelPress}
              activeOpacity={0.8}
            >
              <View style={[styles.sportPillIcon, styles.padelPillIcon]}>
                <MaterialCommunityIcons name="tennis" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.sportPillName}>Padel</Text>
              <Text style={styles.sportPillPrice}>
                {padelCourt ? formatPrice(padelCourt.price) : '...'}
              </Text>
              <View style={styles.sportPillArrow}>
                <Ionicons name="arrow-forward" size={16} color="#1E40AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Link to Reservations */}
        <TouchableOpacity
          style={styles.reservationsLink}
          onPress={() => navigation.getParent()?.navigate('BookingsTab')}
        >
          <Ionicons name="calendar" size={20} color="#F97316" />
          <Text style={styles.reservationsLinkText}>Voir mes réservations</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Nos installations</Text>

          <View style={styles.infoCard}>
            <View style={[styles.infoIconBg, { backgroundColor: '#D1FAE5' }]}>
              <MaterialCommunityIcons name="soccer-field" size={24} color="#065F46" />
            </View>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Terrain de Football</Text>
              <Text style={styles.infoCardText}>Gazon synthétique de qualité professionnelle</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoIconBg, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="tennis" size={24} color="#1E40AF" />
            </View>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Court de Padel</Text>
              <Text style={styles.infoCardText}>Court aux normes internationales</Text>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  waveIcon: {
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  creditBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Hero Banner
  heroBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  heroFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroFeatureText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  heroFeatureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 12,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLocationText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  // Quick Booking Section
  quickBookingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sportPillsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sportPill: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  footballPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  padelPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sportPillIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  padelPillIcon: {
    backgroundColor: '#3B82F6',
  },
  sportPillName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sportPillPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 8,
  },
  sportPillArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Reservations Link
  reservationsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reservationsLinkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Info Section
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  infoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
