import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import CourtCard from '../components/CourtCard';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { getInitials } from '../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuthStore();
  const { courts, fetchCourts, selectCourt, isLoading, error } = useBookingStore();

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleCourtPress = (court: typeof courts[0]) => {
    selectCourt(court);
    navigation.navigate('Booking');
  };

  const handleRefresh = () => {
    fetchCourts();
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
          <Text style={styles.headerTitle}>Réservez votre terrain</Text>
        </View>

        {/* Profile button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.getParent()?.navigate('ProfileTab')}
        >
          <Text style={styles.profileButtonText}>
            {getInitials(user)}
          </Text>
        </TouchableOpacity>
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
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconContainer}>
            <MaterialCommunityIcons name="stadium-variant" size={28} color="#F97316" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Arena Grand-Bassam</Text>
            <Text style={styles.infoText}>Ouvert 24h/24 • Football & Padel</Text>
          </View>
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle}>Terrains disponibles</Text>

        {/* Loading state */}
        {isLoading && courts.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Chargement des terrains...</Text>
          </View>
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={24} color="#DC2626" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Courts list */}
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            onPress={() => handleCourtPress(court)}
          />
        ))}

        {/* Empty state */}
        {!isLoading && courts.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="stadium-variant" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              Aucun terrain disponible pour le moment
            </Text>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  infoIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
