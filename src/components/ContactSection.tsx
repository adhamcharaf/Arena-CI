import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';
import haptics from '../utils/haptics';

const CONTACT_INFO = {
  phone: '+225 07 00 10 10 09',
  email: 'info@arena.ci',
  address: 'Bassam, quartier Cafop, Robert Léon',
  mapsQuery: 'Arena+Bassam+Côte+d\'Ivoire',
};

interface ContactItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  color: string;
}

function ContactItem({ icon, label, value, onPress, color }: ContactItemProps) {
  return (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

export default function ContactSection() {
  const handlePhonePress = async () => {
    haptics.light();
    const phoneUrl = `tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone');
    }
  };

  const handleEmailPress = async () => {
    haptics.light();
    const emailUrl = `mailto:${CONTACT_INFO.email}`;
    const canOpen = await Linking.canOpenURL(emailUrl);
    if (canOpen) {
      Linking.openURL(emailUrl);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
    }
  };

  const handleLocationPress = async () => {
    haptics.light();
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${CONTACT_INFO.mapsQuery}`;
    const canOpen = await Linking.canOpenURL(mapsUrl);
    if (canOpen) {
      Linking.openURL(mapsUrl);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps');
    }
  };

  return (
    <View style={styles.container}>
      <ContactItem
        icon="call"
        label="Téléphone"
        value={CONTACT_INFO.phone}
        onPress={handlePhonePress}
        color={colors.success.main}
      />
      <ContactItem
        icon="mail"
        label="Email"
        value={CONTACT_INFO.email}
        onPress={handleEmailPress}
        color={colors.primary.main}
      />
      <ContactItem
        icon="location"
        label="Localisation"
        value={CONTACT_INFO.address}
        onPress={handleLocationPress}
        color={colors.sport.padel.main}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.card,
    ...shadows.card,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  contactValue: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
