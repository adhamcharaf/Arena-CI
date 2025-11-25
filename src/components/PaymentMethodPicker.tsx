import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentMethod } from '../types';

interface PaymentMethodPickerProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  iconName: string;
  iconType: 'ionicons' | 'material';
  color: string;
  description: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    iconName: 'cellphone',
    iconType: 'material',
    color: '#FF6600',
    description: 'Paiement mobile Orange',
  },
  {
    id: 'wave',
    name: 'Wave',
    iconName: 'wave',
    iconType: 'material',
    color: '#1DA1F2',
    description: 'Paiement mobile Wave',
  },
  {
    id: 'cash',
    name: 'Espèces',
    iconName: 'cash',
    iconType: 'ionicons',
    color: '#10B981',
    description: 'Paiement sur place',
  },
];

const PaymentIcon = ({ option }: { option: PaymentOption }) => {
  if (option.iconType === 'ionicons') {
    return <Ionicons name={option.iconName as keyof typeof Ionicons.glyphMap} size={24} color={option.color} />;
  }
  return <MaterialCommunityIcons name={option.iconName as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={option.color} />;
};

export default function PaymentMethodPicker({
  selected,
  onSelect,
}: PaymentMethodPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mode de paiement</Text>

      <View style={styles.optionsContainer}>
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                isSelected && { borderColor: option.color },
              ]}
              onPress={() => onSelect(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <PaymentIcon option={option} />
                </View>
                <Text
                  style={[
                    styles.optionName,
                    isSelected && { color: option.color },
                  ]}
                >
                  {option.name}
                </Text>
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Avertissement mock */}
      <View style={styles.mockWarning}>
        <Ionicons name="information-circle" size={16} color="#92400E" style={styles.mockIcon} />
        <Text style={styles.mockText}>
          Paiement simulé pour les tests. Aucune transaction réelle.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  optionSelected: {
    backgroundColor: '#FFFFFF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 36,
  },
  mockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  mockIcon: {
    marginRight: 8,
  },
  mockText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
});
