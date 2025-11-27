import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Booking, BookingStatus, PaymentMethod, MobilePaymentMethod } from '../types';
import { formatDate, formatTime, formatPrice } from '../utils/dateHelpers';
import PaymentMethodPicker from './PaymentMethodPicker';

interface BookingDetailModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onCancel: (booking: Booking) => void;
  onPay: (booking: Booking, paymentMethod: PaymentMethod, useCredit?: boolean, mobileMethod?: MobilePaymentMethod) => Promise<void>;
  isCancelling: boolean;
  isPaying: boolean;
  creditBalance?: number;
}

function getStatusConfig(status: BookingStatus) {
  switch (status) {
    case 'paid':
      return { label: 'Payé', bgColor: '#D1FAE5', textColor: '#065F46' };
    case 'unpaid':
      return { label: 'Non payé', bgColor: '#FEF3C7', textColor: '#92400E' };
    case 'completed':
      return { label: 'Terminé', bgColor: '#E5E7EB', textColor: '#6B7280' };
    case 'cancelled':
      return { label: 'Annulé', bgColor: '#FEE2E2', textColor: '#991B1B' };
    case 'cancelled_by_override':
      return { label: 'Pris par payant', bgColor: '#FEE2E2', textColor: '#991B1B' };
    case 'no_show':
      return { label: 'Absent', bgColor: '#FEE2E2', textColor: '#991B1B' };
    case 'confirmed':
      return { label: 'Confirmé', bgColor: '#D1FAE5', textColor: '#065F46' };
    default:
      return { label: status, bgColor: '#E5E7EB', textColor: '#6B7280' };
  }
}

function getCourtTypeLabel(type: string | undefined) {
  switch (type) {
    case 'football':
      return 'Football 5v5';
    case 'padel':
      return 'Padel';
    default:
      return type || 'Terrain';
  }
}

export default function BookingDetailModal({
  visible,
  booking,
  onClose,
  onCancel,
  onPay,
  isCancelling,
  isPaying,
  creditBalance = 0,
}: BookingDetailModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedMobileMethod, setSelectedMobileMethod] = useState<MobilePaymentMethod | null>(null);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  // Reset state quand le modal s'ouvre ou quand la réservation change
  useEffect(() => {
    if (visible) {
      setShowPaymentPicker(false);
      setSelectedPaymentMethod(null);
      setSelectedMobileMethod(null);
    }
  }, [visible, booking?.id]);

  if (!booking) return null;

  const statusConfig = getStatusConfig(booking.status);
  const isUnpaid = booking.status === 'unpaid';
  const canCancel = ['paid', 'unpaid', 'confirmed'].includes(booking.status);

  // Déterminer si le crédit couvre tout
  const creditCoversAll = creditBalance >= booking.total_amount;
  const useCredit = creditBalance > 0;

  const handlePayPress = () => {
    // Toujours afficher le picker pour montrer le solde et confirmer
    setShowPaymentPicker(true);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handleMobileMethodSelect = (method: MobilePaymentMethod) => {
    setSelectedMobileMethod(method);
  };

  const handleConfirmPay = () => {
    if (creditCoversAll) {
      onPay(booking, 'credit', true, undefined);
    } else if (selectedPaymentMethod) {
      onPay(booking, selectedPaymentMethod, useCredit, selectedMobileMethod || undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalContent}>
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Header with icon and court name */}
                <View style={styles.header}>
                <View style={[
                  styles.iconContainer,
                  booking.court?.type === 'football' ? styles.footballIcon : styles.padelIcon
                ]}>
                  <MaterialCommunityIcons
                    name={booking.court?.type === 'football' ? 'soccer' : 'tennis'}
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.courtName}>{booking.court?.name}</Text>
                <Text style={styles.courtType}>{getCourtTypeLabel(booking.court?.type)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                {/* Date */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(booking.date, 'EEEE d MMMM yyyy')}
                    </Text>
                  </View>
                </View>

                {/* Time */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Horaire</Text>
                    <Text style={styles.detailValue}>
                      {booking.time_slot && formatTime(booking.time_slot.start_time)} - {booking.time_slot && formatTime(booking.time_slot.end_time)}
                    </Text>
                  </View>
                </View>

                {/* Price */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="cash-outline" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Prix</Text>
                    <Text style={styles.detailValuePrice}>
                      {formatPrice(booking.total_amount)}
                    </Text>
                  </View>
                </View>

                {/* Booking date */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Réservé le</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(booking.created_at, 'd MMMM yyyy à HH:mm')}
                    </Text>
                  </View>
                </View>

                {/* Location (if available) */}
                {booking.court?.description && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="location-outline" size={20} color="#6B7280" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Localisation</Text>
                      <Text style={styles.detailValue}>
                        {booking.court.description}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

                {/* Warning for unpaid */}
                {isUnpaid && !showPaymentPicker && (
                  <View style={styles.unpaidWarning}>
                    <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                    <Text style={styles.unpaidWarningText}>
                      Cette réservation peut être prise par quelqu'un qui paie. Payez maintenant pour la verrouiller.
                    </Text>
                  </View>
                )}

                {/* Payment method picker */}
                {showPaymentPicker && isUnpaid && (
                  <View style={styles.paymentSection}>
                    <Text style={styles.paymentSectionTitle}>Choisissez votre mode de paiement</Text>
                    <PaymentMethodPicker
                      selected={selectedPaymentMethod}
                      onSelect={handlePaymentMethodSelect}
                      excludeCash
                      creditBalance={creditBalance}
                      totalAmount={booking.total_amount}
                      selectedMobileMethod={selectedMobileMethod}
                      onMobileMethodSelect={handleMobileMethodSelect}
                    />
                  </View>
                )}
              </ScrollView>

              {/* Actions - hors du scroll */}
              <View style={styles.actions}>
                {/* Pay button for unpaid bookings */}
                {isUnpaid && (
                  <>
                    {!showPaymentPicker ? (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={handlePayPress}
                        disabled={isPaying}
                      >
                        {isPaying ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.payButtonText}>Payer maintenant</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.payButton, (!selectedPaymentMethod && !creditCoversAll) && styles.payButtonDisabled]}
                        onPress={handleConfirmPay}
                        disabled={isPaying || (!selectedPaymentMethod && !creditCoversAll)}
                      >
                        {isPaying ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.payButtonText}>Confirmer le paiement</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Cancel button */}
                {canCancel && (
                  <TouchableOpacity
                    style={[styles.cancelButton, isUnpaid && styles.cancelButtonSecondary]}
                    onPress={() => onCancel(booking)}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <ActivityIndicator color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                        <Text style={styles.cancelButtonText}>Annuler la réservation</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    padding: 24,
    paddingTop: 48,
    position: 'relative',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footballIcon: {
    backgroundColor: '#10B981',
  },
  padelIcon: {
    backgroundColor: '#3B82F6',
  },
  courtName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  courtType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 32,
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailValuePrice: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '700',
  },
  unpaidWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  unpaidWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 10,
    lineHeight: 18,
  },
  paymentSection: {
    marginBottom: 16,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actions: {
    gap: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  cancelButtonSecondary: {
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
