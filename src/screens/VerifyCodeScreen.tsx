import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import CodeInput from '../components/CodeInput';
import { useAuthStore } from '../stores/authStore';
import { maskPhone } from '../utils/phoneValidator';
import { RootStackParamList } from '../navigation/AppNavigator';

type VerifyCodeScreenProps = NativeStackScreenProps<RootStackParamList, 'VerifyCode'>;

export default function VerifyCodeScreen({ navigation, route }: VerifyCodeScreenProps) {
  const { phone } = route.params;
  const { verifyCode, sendVerificationCode, isLoading, error, clearError } = useAuthStore();

  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer pour renvoyer le code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleCodeComplete = async (code: string) => {
    clearError();
    const result = await verifyCode(phone, code);

    // Si succès, la navigation sera gérée par le AppNavigator
    // car isAuthenticated passera à true
  };

  const handleResendCode = async () => {
    if (!canResend || isLoading) return;

    clearError();
    setCanResend(false);
    setResendTimer(30);

    await sendVerificationCode(phone);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>

          {/* Titre */}
          <View style={styles.header}>
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.subtitle}>
              Entrez le code envoyé au{'\n'}
              <Text style={styles.phoneNumber}>{maskPhone(phone)}</Text>
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            <CodeInput
              onComplete={handleCodeComplete}
              error={error || undefined}
              disabled={isLoading}
            />
          </View>

          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={styles.loadingText}>Vérification en cours...</Text>
            </View>
          )}

          {/* Renvoyer le code */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
                <Text style={styles.resendButton}>
                  Renvoyer le code
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Renvoyer dans {resendTimer}s
              </Text>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="bulb" size={20} color="#F97316" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Le code est valide pendant 10 minutes. Vérifiez vos SMS si vous ne le recevez pas.
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  phoneNumber: {
    color: '#F97316',
    fontWeight: '700',
  },
  codeContainer: {
    marginBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendButton: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '700',
  },
  resendTimer: {
    fontSize: 14,
    color: '#9CA3AF',
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
});
