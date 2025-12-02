import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import { formatPhoneDisplay } from '../../utils/phoneValidator';
import { getFullName, getInitials } from '../../types';
import { haptics } from '../../utils/haptics';

export default function ManagerProfileScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnecter',
          style: 'destructive',
          onPress: () => {
            haptics.selection();
            signOut();
          },
        },
      ]
    );
  };

  const roleLabel = user?.role === 'admin' ? 'Administrateur' : 'Manager';
  const roleColor = user?.role === 'admin' ? colors.error.main : colors.primary.main;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getInitials(user)}
            </Text>
          </View>

          <Text style={styles.profileName}>
            {getFullName(user)}
          </Text>

          <Text style={styles.profilePhone}>
            {user?.phone ? formatPhoneDisplay(user.phone) : ''}
          </Text>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
            <Ionicons
              name={user?.role === 'admin' ? 'shield-checkmark' : 'briefcase'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>

          {user?.phone_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success.dark} />
              <Text style={styles.verifiedText}>Numero verifie</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telephone</Text>
              <Text style={styles.infoValue}>
                {user?.phone ? formatPhoneDisplay(user.phone) : '-'}
              </Text>
            </View>
          </View>

          {user?.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={[styles.infoValue, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Aide et support</Text>
              <Text style={styles.actionSubtitle}>Guide d'utilisation du tableau de bord</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="information-circle-outline" size={22} color={colors.info.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>A propos</Text>
              <Text style={styles.actionSubtitle}>Version 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error.main} />
          <Text style={styles.signOutText}>Se deconnecter</Text>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.text.primary,
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
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileName: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profilePhone: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  roleBadgeText: {
    ...textStyles.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  verifiedText: {
    ...textStyles.caption,
    color: colors.success.dark,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  signOutText: {
    ...textStyles.button,
    color: colors.error.main,
  },
});
