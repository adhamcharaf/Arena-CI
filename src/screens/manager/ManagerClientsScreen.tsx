import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useManagerStore, ClientWithStats } from '../../stores/managerStore';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import { formatPrice } from '../../utils/dateHelpers';
import { haptics } from '../../utils/haptics';
import { ManagerStackParamList } from '../../navigation/ManagerTabs';

type NavigationProp = NativeStackNavigationProp<ManagerStackParamList>;

// Client card component
const ClientCard = ({
  client,
  onPress,
}: {
  client: ClientWithStats;
  onPress: () => void;
}) => {
  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client';
  const hasFines = client.pending_fines_total > 0;
  const hasCredits = client.credits_balance > 0;

  return (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.clientMain}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{fullName}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
      </View>

      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.statText}>
            {client.bookings_count} reservation{client.bookings_count > 1 ? 's' : ''}
          </Text>
        </View>

        {hasCredits && (
          <View style={[styles.statItem, styles.statCredits]}>
            <Ionicons name="wallet-outline" size={16} color={colors.success.main} />
            <Text style={[styles.statText, { color: colors.success.main }]}>
              {formatPrice(client.credits_balance)}
            </Text>
          </View>
        )}

        {hasFines && (
          <View style={[styles.statItem, styles.statFines]}>
            <Ionicons name="warning" size={16} color={colors.error.main} />
            <Text style={[styles.statText, { color: colors.error.main }]}>
              {formatPrice(client.pending_fines_total)} d'amendes
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ManagerClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    clients,
    isLoading,
    clientSearchQuery,
    fetchClients,
    setSelectedClient,
  } = useManagerStore();

  const [searchText, setSearchText] = useState('');

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== clientSearchQuery) {
        fetchClients(searchText || undefined);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Refresh
  const onRefresh = useCallback(() => {
    fetchClients(searchText || undefined);
  }, [searchText]);

  // Handle client press
  const handleClientPress = (client: ClientWithStats) => {
    setSelectedClient(client);
    navigation.navigate('ManagerClientDetail', { clientId: client.id });
    haptics.selection();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <Text style={styles.headerSubtitle}>
          {clients.length} client{clients.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Rechercher par nom ou telephone..."
            placeholderTextColor={colors.text.disabled}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Clients List */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
          />
        }
        renderItem={({ item }) => (
          <ClientCard client={item} onPress={() => handleClientPress(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>
                {searchText ? 'Aucun client trouve' : 'Aucun client'}
              </Text>
            </View>
          ) : null
        }
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
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  clientMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    ...textStyles.h4,
    color: '#FFFFFF',
  },
  clientInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  clientName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  clientPhone: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  clientStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statCredits: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.sm,
  },
  statFines: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.sm,
  },
  statText: {
    ...textStyles.caption,
    color: colors.text.secondary,
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
});
