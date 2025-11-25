import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import { useBookingStore } from '../stores/bookingStore';
import { formatDate, formatPrice, formatTime } from '../utils/dateHelpers';

type ConfirmationScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ConfirmationScreen({ navigation }: ConfirmationScreenProps) {
  const {
    selectedCourt,
    selectedDate,
    selectedSlot,
    selectedPaymentMethod,
    selectPaymentMethod,
    createBooking,
    resetSelection,
    isLoading,
  } = useBookingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifications
  if (!selectedCourt || !selectedDate || !selectedSlot) {
    navigation.goBack();
    return null;
  }

  const handleConfirm = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Attention', 'Veuillez choisir un mode de paiement');
      return;
    }

    setIsSubmitting(true);

    const result = await createBooking();

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Réservation confirmée ! 🎉',
        `Votre ${selectedCourt.type === 'football' ? 'terrain de football' : 'court de padel'} est réservé pour le ${formatDate(selectedDate, 'd MMMM')} à ${formatTime(selectedSlot.start_time)}.`,
        [
          {
            text: 'Voir mes réservations',
            onPress: () => {
              resetSelection();
              navigation.navigate('Profile');
            },
          },
          {
            text: 'OK',
            onPress: () => {
              resetSelection();
              navigation.navigate('Home');
            },
          },
        ]
      );
    } else {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmation</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Récapitulatif */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIconContainer, selectedCourt.type === 'football' ? styles.footballIcon : styles.padelIcon]}>
              <MaterialCommunityIcons
                name={selectedCourt.type === 'football' ? 'soccer' : 'tennis'}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.summaryHeaderContent}>
              <Text style={styles.summaryTitle}>{selectedCourt.name}</Text>
              <Text style={styles.summarySubtitle}>
                {selectedCourt.type === 'football' ? 'Football' : 'Padel'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" style={styles.summaryLabelIcon} />
              <Text style={styles.summaryLabel}>Date</Text>
            </View>
            <Text style={styles.summaryValue}>
              {formatDate(selectedDate, 'EEEE d MMMM yyyy')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="time-outline" size={16} color="#6B7280" style={styles.summaryLabelIcon} />
              <Text style={styles.summaryLabel}>Horaire</Text>
            </View>
            <Text style={styles.summaryValue}>
              {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="timer-outline" size={16} color="#6B7280" style={styles.summaryLabelIcon} />
              <Text style={styles.summaryLabel}>Durée</Text>
            </View>
            <Text style={styles.summaryValue}>{selectedCourt.duration} minutes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalValue}>{formatPrice(selectedCourt.price)}</Text>
          </View>
        </View>

        {/* Méthode de paiement */}
        <View style={styles.paymentSection}>
          <PaymentMethodPicker
            selected={selectedPaymentMethod}
            onSelect={selectPaymentMethod}
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#6B7280" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            La réservation sera confirmée immédiatement. Vous pouvez annuler gratuitement jusqu'à 12h avant.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedPaymentMethod || isSubmitting) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedPaymentMethod || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Confirmer la réservation</Text>
              <Text style={styles.confirmButtonPrice}>{formatPrice(selectedCourt.price)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  footballIcon: {
    backgroundColor: '#10B981',
  },
  padelIcon: {
    backgroundColor: '#3B82F6',
  },
  summaryHeaderContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabelIcon: {
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F97316',
  },
  paymentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  confirmButtonPrice: {
    color: '#FED7AA',
    fontSize: 16,
    fontWeight: '700',
  },
});
