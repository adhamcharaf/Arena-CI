import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
} from 'react-native';
import { validatePhoneCI } from '../utils/phoneValidator';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  error?: string;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChangeText,
  onSubmit,
  error,
  disabled = false,
}: PhoneInputProps) {
  const [localValue, setLocalValue] = useState(value.replace('+225 ', ''));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fullNumber = '+225 ' + localValue;

    // Valider le numéro
    if (localValue.length >= 10) {
      const validation = validatePhoneCI(fullNumber);
      setValidationError(validation.valid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  }, [localValue]);

  const handleChange = (text: string) => {
    // Ne garder que les chiffres et espaces
    const cleaned = text.replace(/[^\d\s]/g, '');

    // Formater automatiquement (XX XX XX XX XX)
    const digits = cleaned.replace(/\s/g, '');
    let formatted = '';

    for (let i = 0; i < digits.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) {
        formatted += ' ';
      }
      formatted += digits[i];
    }

    setLocalValue(formatted);
    onChangeText('+225 ' + formatted);
  };

  const displayError = error || validationError;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Numéro de téléphone</Text>

      <View style={[styles.inputContainer, displayError ? styles.inputError : null]}>
        {/* Préfixe +225 fixe */}
        <View style={styles.prefixContainer}>
          <Text style={styles.flag}>🇨🇮</Text>
          <Text style={styles.prefix}>+225</Text>
        </View>

        {/* Input */}
        <TextInput
          style={styles.input}
          value={localValue}
          onChangeText={handleChange}
          placeholder="07 XX XX XX XX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={14} // XX XX XX XX XX
          editable={!disabled}
          onSubmitEditing={onSubmit}
          returnKeyType="done"
        />
      </View>

      {/* Message d'erreur */}
      {displayError && (
        <Text style={styles.errorText}>{displayError}</Text>
      )}

      {/* Aide */}
      <Text style={styles.helpText}>
        Entrez votre numéro ivoirien
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    marginRight: 12,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 6,
  },
  helpText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
  },
});
