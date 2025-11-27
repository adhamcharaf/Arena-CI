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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput from '../components/PhoneInput';
import { useAuthStore } from '../stores/authStore';
import { validatePhoneCI } from '../utils/phoneValidator';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';
import haptics from '../utils/haptics';

// Numéro de contact pour les réservations
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
      haptics.error();
      return;
    }

    haptics.light();
    const result = await sendVerificationCode(phone);

    if (result.success) {
      haptics.success();
      navigation.navigate('VerifyCode', { phone });
    } else {
      haptics.error();
    }
  };

  const handleCallSupport = () => {
    haptics.light();
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
          {/* Header with Arena Logo */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/Arena-Icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
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
                <ActivityIndicator color={colors.neutral[0]} />
              ) : (
                <Text style={styles.submitButtonText}>Recevoir le code SMS</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Contact support */}
          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>Un problème pour réserver ?</Text>
            <TouchableOpacity
              onPress={handleCallSupport}
              activeOpacity={0.7}
              style={styles.supportLinkContainer}
            >
              <Ionicons
                name="call"
                size={16}
                color={colors.primary.main}
                style={styles.supportIcon}
              />
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
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logo: {
    width: 260,
    height: 100,
  },
  description: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['4xl'],
    lineHeight: 24,
  },
  form: {
    marginBottom: spacing['3xl'],
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.button,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[300],
    shadowOpacity: 0,
  },
  submitButtonText: {
    ...textStyles.button,
    fontSize: 18,
  },
  supportContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  supportText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  supportLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIcon: {
    marginRight: spacing.xs + 2,
  },
  supportLink: {
    ...textStyles.label,
    color: colors.primary.main,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});
