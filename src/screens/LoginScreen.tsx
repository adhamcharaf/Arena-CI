import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import PhoneInput from '../components/PhoneInput';
import { useAuthStore } from '../stores/authStore';
import { validatePhoneCI } from '../utils/phoneValidator';

// Numéro de contact pour les réservations (à remplacer par le vrai numéro)
const CONTACT_PHONE = '+22507000000';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [phone, setPhone] = useState('+225 ');
  const { sendVerificationCode, isLoading, error, clearError } = useAuthStore();

  const handleSendCode = async () => {
    clearError();

    // Valider le numéro
    const validation = validatePhoneCI(phone);
    if (!validation.valid) {
      return;
    }

    const result = await sendVerificationCode(phone);

    if (result.success) {
      navigation.navigate('VerifyCode', { phone });
    }
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  const isValidPhone = validatePhoneCI(phone).valid;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="stadium-variant" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Arena</Text>
            <Text style={styles.subtitle}>Grand-Bassam</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Réservez votre terrain de football ou padel en quelques secondes
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              onSubmit={handleSendCode}
              error={error || undefined}
              disabled={isLoading}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValidPhone || isLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSendCode}
              disabled={!isValidPhone || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Recevoir le code SMS</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Contact support */}
          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>Un problème pour réserver ?</Text>
            <TouchableOpacity onPress={handleCallSupport} activeOpacity={0.7} style={styles.supportLinkContainer}>
              <Ionicons name="call" size={16} color="#F97316" style={styles.supportIcon} />
              <Text style={styles.supportLink}>Appelez-nous directement</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En continuant, vous acceptez nos{' '}
              <Text style={styles.footerLink}>conditions d'utilisation</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 18,
    color: '#F97316',
    fontWeight: '600',
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  supportContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  supportLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIcon: {
    marginRight: 6,
  },
  supportLink: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footerLink: {
    color: '#F97316',
    fontWeight: '600',
  },
});
