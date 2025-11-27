import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { getInitials } from '../types';
import { formatPrice } from '../utils/dateHelpers';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';
import haptics from '../utils/haptics';

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
      haptics.light();
      selectCourt(footballCourt);
      navigation.navigate('Booking');
    }
  };

  const handlePadelPress = () => {
    if (padelCourt) {
      haptics.light();
      selectCourt(padelCourt);
      navigation.navigate('Booking');
    }
  };

  const handleProfilePress = () => {
    haptics.light();
    navigation.getParent()?.navigate('ProfileTab');
  };

  const handleBookingsPress = () => {
    haptics.light();
    navigation.getParent()?.navigate('BookingsTab');
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
            <MaterialCommunityIcons
              name="hand-wave"
              size={16}
              color={colors.primary.main}
              style={styles.waveIcon}
            />
          </View>
          <Text style={styles.headerTitle}>Bienvenue</Text>
        </View>

        {/* Credit badge + Profile button */}
        <View style={styles.headerRight}>
          <View style={styles.creditBadge}>
            <Ionicons name="wallet-outline" size={14} color={colors.success.main} />
            <Text style={styles.creditBadgeText}>{formatPrice(userCreditsBalance)}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
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
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Hero Banner with Arena Logo */}
        <View style={styles.heroBanner}>
          <Image
            source={require('../../assets/Arena-Icon.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />

          <View style={styles.heroFeatures}>
            <View style={styles.heroFeature}>
              <Ionicons name="time-outline" size={16} color={colors.success.main} />
              <Text style={styles.heroFeatureText}>Ouvert 24h/24</Text>
            </View>
            <View style={styles.heroFeatureDot} />
            <View style={styles.heroFeature}>
              <Ionicons name="calendar-outline" size={16} color={colors.success.main} />
              <Text style={styles.heroFeatureText}>7j/7</Text>
            </View>
          </View>

          <View style={styles.heroLocation}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
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
                <MaterialCommunityIcons name="soccer" size={32} color={colors.neutral[0]} />
              </View>
              <Text style={styles.sportPillName}>Football</Text>
              <Text style={styles.sportPillPrice}>
                {footballCourt ? formatPrice(footballCourt.price) : '...'}
              </Text>
              <View style={styles.sportPillArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.sport.football.dark} />
              </View>
            </TouchableOpacity>

            {/* Padel Pill */}
            <TouchableOpacity
              style={[styles.sportPill, styles.padelPill]}
              onPress={handlePadelPress}
              activeOpacity={0.8}
            >
              <View style={[styles.sportPillIcon, styles.padelPillIcon]}>
                <MaterialCommunityIcons name="tennis" size={32} color={colors.neutral[0]} />
              </View>
              <Text style={styles.sportPillName}>Padel</Text>
              <Text style={styles.sportPillPrice}>
                {padelCourt ? formatPrice(padelCourt.price) : '...'}
              </Text>
              <View style={styles.sportPillArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.sport.padel.dark} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Link to Reservations */}
        <TouchableOpacity
          style={styles.reservationsLink}
          onPress={handleBookingsPress}
        >
          <Ionicons name="calendar" size={20} color={colors.primary.main} />
          <Text style={styles.reservationsLinkText}>Voir mes réservations</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Nos installations</Text>

          <View style={styles.infoCard}>
            <View style={[styles.infoIconBg, { backgroundColor: colors.sport.football.light }]}>
              <MaterialCommunityIcons
                name="soccer-field"
                size={24}
                color={colors.sport.football.dark}
              />
            </View>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Terrain de Football</Text>
              <Text style={styles.infoCardText}>Gazon synthétique de qualité professionnelle</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoIconBg, { backgroundColor: colors.sport.padel.light }]}>
              <MaterialCommunityIcons
                name="tennis"
                size={24}
                color={colors.sport.padel.dark}
              />
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
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  greeting: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  waveIcon: {
    marginLeft: spacing.xs,
  },
  headerTitle: {
    ...textStyles.h2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  creditBadgeText: {
    fontSize: 13,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '600',
    color: colors.success.main,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 16,
    fontFamily: textStyles.button.fontFamily,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  // Hero Banner
  heroBanner: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    ...shadows.card,
  },
  heroLogo: {
    width: 220,
    height: 80,
    marginBottom: spacing.lg,
  },
  heroFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroFeatureText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '600',
    color: colors.success.main,
  },
  heroFeatureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    marginHorizontal: spacing.md,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLocationText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontFamily: textStyles.caption.fontFamily,
    color: colors.text.secondary,
  },
  // Quick Booking Section
  quickBookingSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h4,
    marginBottom: spacing.lg,
  },
  sportPillsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sportPill: {
    flex: 1,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  footballPill: {
    backgroundColor: colors.sport.football.light,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  padelPill: {
    backgroundColor: colors.sport.padel.light,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sportPillIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sport.football.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  padelPillIcon: {
    backgroundColor: colors.sport.padel.main,
  },
  sportPillName: {
    ...textStyles.label,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  sportPillPrice: {
    fontSize: 15,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '600',
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  sportPillArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Reservations Link
  reservationsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  reservationsLinkText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: 15,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '600',
    color: colors.text.primary,
  },
  // Info Section
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm + 2,
  },
  infoIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontFamily: textStyles.label.fontFamily,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  infoCardText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
});
