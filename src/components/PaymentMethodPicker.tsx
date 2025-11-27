import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentMethod, MobilePaymentMethod } from '../types';
import { formatPrice } from '../utils/dateHelpers';

interface PaymentMethodPickerProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  excludeCash?: boolean;
  // Nouveaux props pour le crédit
  creditBalance?: number;
  totalAmount?: number;
  onMobileMethodSelect?: (method: MobilePaymentMethod) => void;
  selectedMobileMethod?: MobilePaymentMethod | null;
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
  excludeCash = false,
  creditBalance = 0,
  totalAmount = 0,
  onMobileMethodSelect,
  selectedMobileMethod,
}: PaymentMethodPickerProps) {
  const hasCredit = creditBalance > 0;
  const creditCoversAll = hasCredit && creditBalance >= totalAmount;
  const needsComplement = hasCredit && !creditCoversAll;
  const complementAmount = needsComplement ? totalAmount - creditBalance : 0;

  // Filter options based on context
  const options = excludeCash
    ? PAYMENT_OPTIONS.filter(opt => opt.id !== 'cash')
    : PAYMENT_OPTIONS;

  return (
    <View style={styles.container}>
      {/* Bandeau crédit si solde > 0 */}
      {hasCredit && (
        <View style={styles.creditBanner}>
          <View style={styles.creditHeader}>
            <Ionicons name="wallet" size={20} color="#10B981" />
            <Text style={styles.creditTitle}>Crédit disponible</Text>
          </View>
          <Text style={styles.creditAmount}>{formatPrice(creditBalance)}</Text>
          {creditCoversAll ? (
            <Text style={styles.creditInfo}>
              Couvre la totalité du paiement
            </Text>
          ) : (
            <Text style={styles.creditInfo}>
              Sera utilisé automatiquement. Reste à payer : {formatPrice(complementAmount)}
            </Text>
          )}
        </View>
      )}

      {/* Afficher les options mobile money seulement si crédit insuffisant */}
      {!creditCoversAll && (
        <>
          <Text style={styles.label}>Mode de paiement</Text>
          <View style={styles.optionsContainer}>
            {options.map((option) => {
              const isSelected = selected === option.id;
              // Afficher le montant complément pour les options mobile si crédit partiel
              const showComplement = needsComplement && (option.id === 'orange_money' || option.id === 'wave');

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    isSelected && { borderColor: option.color },
                  ]}
                  onPress={() => {
                    onSelect(option.id);
                    // Si c'est une méthode mobile, notifier aussi le parent
                    if ((option.id === 'orange_money' || option.id === 'wave') && onMobileMethodSelect) {
                      onMobileMethodSelect(option.id as MobilePaymentMethod);
                    }
                  }}
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
                    {showComplement && (
                      <Text style={styles.complementAmount}>{formatPrice(complementAmount)}</Text>
                    )}
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
        </>
      )}

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
  // Styles pour le bandeau crédit
  creditBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  creditAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  creditInfo: {
    fontSize: 13,
    color: '#047857',
  },
  // Styles pour crédit couvrant tout
  creditOnlySection: {
    marginBottom: 8,
  },
  creditOnlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
  },
  creditOnlyButtonSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  creditOnlyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  creditOnlyTextSelected: {
    color: '#065F46',
  },
  // Styles pour complément
  complementAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
    marginLeft: 'auto',
    marginRight: 8,
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
