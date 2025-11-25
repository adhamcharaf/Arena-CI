import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Court } from '../types';
import { formatPrice } from '../utils/dateHelpers';

interface CourtCardProps {
  court: Court;
  onPress: () => void;
}

const COURT_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  football: 'soccer',
  padel: 'tennis',
};

export default function CourtCard({ court, onPress }: CourtCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image placeholder */}
      <View style={styles.imageContainer}>
        <View style={[styles.placeholder, court.type === 'football' ? styles.footballBg : styles.padelBg]}>
          <MaterialCommunityIcons name={COURT_ICONS[court.type]} size={48} color="#FFFFFF" />
        </View>

        {/* Badge type */}
        <View style={[styles.typeBadge, court.type === 'football' ? styles.footballBadge : styles.padelBadge]}>
          <Text style={styles.typeText}>
            {court.type === 'football' ? 'Football' : 'Padel'}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <Text style={styles.name}>{court.name}</Text>

        {court.description && (
          <Text style={styles.description} numberOfLines={2}>
            {court.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(court.price)}</Text>
            <Text style={styles.duration}>/ {court.duration} min</Text>
          </View>

          <View style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Réserver</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footballBg: {
    backgroundColor: '#065F46',
  },
  padelBg: {
    backgroundColor: '#1E40AF',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footballBadge: {
    backgroundColor: '#10B981',
  },
  padelBadge: {
    backgroundColor: '#3B82F6',
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F97316',
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
