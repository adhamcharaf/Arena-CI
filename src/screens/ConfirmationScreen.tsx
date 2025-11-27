import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import { useBookingStore } from '../stores/bookingStore';
import { formatDate, formatPrice, formatTime } from '../utils/dateHelpers';
import { MobilePaymentMethod } from '../types';

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
    checkUserCanBook,
    payFine,
    canBook,
    pendingFines,
    pendingFinesTotal,
    isLoading,
    userCreditsBalance,
    fetchUserCredits,
  } = useBookingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
  const [isPayingFine, setIsPayingFine] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [selectedMobileMethod, setSelectedMobileMethod] = useState<MobilePaymentMethod | null>(null);

  // Vérifier si les données sont manquantes et rediriger
  useEffect(() => {
    if (!selectedCourt || !selectedDate || !selectedSlot) {
      setShouldRedirect(true);
    }
  }, [selectedCourt, selectedDate, selectedSlot]);

  // Rediriger si nécessaire (dans un effet séparé pour éviter l'erreur React)
  useEffect(() => {
    if (shouldRedirect) {
      navigation.goBack();
    }
  }, [shouldRedirect, navigation]);

  // Vérifier si l'utilisateur peut réserver et récupérer le solde crédit
  useEffect(() => {
    const initData = async () => {
      await checkUserCanBook();
      await fetchUserCredits();
    };
    initData();
  }, []);

  // Afficher le modal d'amende si nécessaire
  useEffect(() => {
    if (!canBook && pendingFinesTotal > 0) {
      setShowFineModal(true);
    }
  }, [canBook, pendingFinesTotal]);

  // Afficher rien pendant la redirection
  if (shouldRedirect || !selectedCourt || !selectedDate || !selectedSlot) {
    return null;
  }

  // Déterminer si c'est un override (créneau unpaid)
  const isOverride = selectedSlot.status === 'unpaid' && selectedSlot.can_override;

  const handlePayFine = async () => {
    if (pendingFines.length === 0) return;

    setIsPayingFine(true);

    // Payer toutes les amendes
    for (const fine of pendingFines) {
      const result = await payFine(fine.id);
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Erreur lors du paiement de l\'amende');
        setIsPayingFine(false);
        return;
      }
    }

    setIsPayingFine(false);
    setShowFineModal(false);
    Alert.alert('Succès', 'Amende payée avec succès. Vous pouvez maintenant réserver.');
  };

  const handleConfirmPress = () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Attention', 'Veuillez choisir un mode de paiement');
      return;
    }

    // Si c'est un override, on doit payer obligatoirement
    if (isOverride) {
      handleBooking(true);
      return;
    }

    // Si paiement mobile (Orange Money / Wave) → paiement direct
    if (selectedPaymentMethod === 'orange_money' || selectedPaymentMethod === 'wave') {
      handleBooking(true);
      return;
    }

    // Si paiement par espèces → proposer le choix (payer ou réserver sans payer)
    if (selectedPaymentMethod === 'cash') {
      setShowPaymentChoiceModal(true);
      return;
    }

    // Autres cas (credit, credit_and_mobile) → paiement direct
    handleBooking(true);
  };

  const handleBooking = async (isPaying: boolean) => {
    setShowPaymentChoiceModal(false);
    setIsSubmitting(true);

    // Déterminer si on utilise le crédit
    const useCredit = isPaying && userCreditsBalance > 0;

    const result = await createBooking(isPaying, useCredit, selectedMobileMethod || undefined);

    setIsSubmitting(false);

    // Cas spécial: l'utilisateur essaie de payer sa propre réservation non payée
    if (result.own_unpaid_booking) {
      Alert.alert(
        'Réservation existante',
        'Vous avez déjà une réservation non payée pour ce créneau. Rendez-vous dans vos réservations pour la payer.',
        [
          {
            text: 'Voir mes réservations',
            onPress: () => {
              resetSelection();
              navigation.getParent()?.navigate('BookingsTab');
            },
          },
        ]
      );
      return;
    }

    if (result.success) {
      const paymentMessage = isPaying
        ? 'Votre réservation est confirmée et verrouillée.'
        : 'Votre réservation est confirmée mais peut être prise par quelqu\'un qui paie.';

      Alert.alert(
        'Réservation confirmée ! ',
        `${selectedCourt.type === 'football' ? 'Terrain de football' : 'Court de padel'} réservé pour le ${formatDate(selectedDate, 'd MMMM')} à ${formatTime(selectedSlot.start_time)}.\n\n${paymentMessage}`,
        [
          {
            text: 'Voir mes réservations',
            onPress: () => {
              resetSelection();
              navigation.getParent()?.navigate('BookingsTab');
            },
          },
          {
            text: 'OK',
            onPress: () => {
              resetSelection();
              navigation.popToTop();
            },
          },
        ]
      );
    } else {
      // Gérer les erreurs spécifiques de verrouillage de créneau
      if (result.error_code === 'SLOT_LOCKED') {
        Alert.alert(
          'Créneau en cours de réservation',
          'Ce créneau est en cours de réservation par un autre utilisateur. Réessayez dans quelques instants.',
          [{ text: 'OK' }]
        );
      } else if (result.error_code === 'SLOT_ALREADY_BOOKED') {
        Alert.alert(
          'Créneau indisponible',
          'Ce créneau est déjà réservé par un autre utilisateur.',
          [
            {
              text: 'Choisir un autre créneau',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
      }
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
        {/* Banner si override */}
        {isOverride && (
          <View style={styles.overrideBanner}>
            <Ionicons name="flash" size={20} color="#F59E0B" />
            <Text style={styles.overrideBannerText}>
              Ce créneau est réservé sans paiement. En payant, vous prenez la place.
            </Text>
          </View>
        )}

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
            creditBalance={userCreditsBalance}
            totalAmount={selectedCourt.price}
            selectedMobileMethod={selectedMobileMethod}
            onMobileMethodSelect={setSelectedMobileMethod}
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#6B7280" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {isOverride
              ? 'Le paiement est obligatoire pour prendre ce créneau. L\'ancien utilisateur sera notifié.'
              : 'Sans paiement immédiat, quelqu\'un peut prendre votre créneau en payant. Annulation gratuite jusqu\'à 12h avant.'
            }
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
          onPress={handleConfirmPress}
          disabled={!selectedPaymentMethod || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                {isOverride ? 'Payer et prendre le créneau' : 'Confirmer la réservation'}
              </Text>
              <Text style={styles.confirmButtonPrice}>{formatPrice(selectedCourt.price)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Amendes */}
      <Modal
        visible={showFineModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Amende en attente</Text>
            <Text style={styles.modalText}>
              Vous avez une amende de {formatPrice(pendingFinesTotal)} à régler avant de pouvoir réserver.
            </Text>
            {pendingFines.map((fine) => (
              <View key={fine.id} style={styles.fineItem}>
                <Text style={styles.fineReason}>{fine.reason}</Text>
                <Text style={styles.fineAmount}>{formatPrice(fine.amount)}</Text>
              </View>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowFineModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPayButton}
                onPress={handlePayFine}
                disabled={isPayingFine}
              >
                {isPayingFine ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalPayButtonText}>Payer l'amende</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Choix de paiement */}
      <Modal
        visible={showPaymentChoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentChoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentChoiceModal}>
            <Text style={styles.paymentChoiceTitle}>Payer maintenant ?</Text>
            <Text style={styles.paymentChoiceText}>
              En payant maintenant, votre créneau est garanti et ne peut pas être pris par quelqu'un d'autre.
            </Text>

            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => handleBooking(true)}
            >
              <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              <View style={styles.payNowButtonContent}>
                <Text style={styles.payNowButtonText}>Payer maintenant</Text>
                <Text style={styles.payNowButtonSubtext}>Créneau verrouillé</Text>
              </View>
              <Text style={styles.payNowButtonPrice}>{formatPrice(selectedCourt.price)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.payLaterButton}
              onPress={() => handleBooking(false)}
            >
              <Ionicons name="time-outline" size={24} color="#6B7280" />
              <View style={styles.payLaterButtonContent}>
                <Text style={styles.payLaterButtonText}>Réserver sans payer</Text>
                <Text style={styles.payLaterButtonSubtext}>Peut être pris par un payant</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelChoiceButton}
              onPress={() => setShowPaymentChoiceModal(false)}
            >
              <Text style={styles.cancelChoiceButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  overrideBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  overrideBannerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  fineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  fineReason: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
  fineAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  modalPayButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Payment choice modal
  paymentChoiceModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  paymentChoiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentChoiceText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  payNowButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  payNowButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  payNowButtonSubtext: {
    color: '#A7F3D0',
    fontSize: 12,
    marginTop: 2,
  },
  payNowButtonPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  payLaterButton: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  payLaterButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  payLaterButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  payLaterButtonSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  cancelChoiceButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelChoiceButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
