import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Keyboard,
  Pressable,
} from 'react-native';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function CodeInput({
  length = 6,
  onComplete,
  error,
  disabled = false,
}: CodeInputProps) {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Focus l'input au montage
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleChange = (text: string) => {
    // Ne garder que les chiffres, max 6
    const digits = text.replace(/[^0-9]/g, '').slice(0, length);
    setCode(digits);

    // Vérifier si le code est complet
    if (digits.length === length) {
      Keyboard.dismiss();
      onComplete(digits);
    }
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  // Convertir le code en tableau pour l'affichage
  const codeArray = code.split('');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Code de vérification</Text>

      {/* Input caché qui capture tout le texte */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        editable={!disabled}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
      />

      {/* Boxes visuelles */}
      <Pressable style={styles.codeContainer} onPress={handlePress}>
        {Array(length).fill(0).map((_, index) => (
          <View
            key={index}
            style={[
              styles.codeBox,
              codeArray[index] ? styles.codeBoxFilled : null,
              error ? styles.codeBoxError : null,
              focused && index === codeArray.length ? styles.codeBoxFocused : null,
            ]}
          >
            <Text style={styles.codeDigit}>
              {codeArray[index] || ''}
            </Text>
          </View>
        ))}
      </Pressable>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Text style={styles.helpText}>
        Entrez le code à 6 chiffres reçu par SMS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  codeBoxFocused: {
    borderColor: '#F97316',
    borderWidth: 2,
  },
  codeBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  codeDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  helpText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
