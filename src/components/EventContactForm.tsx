import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';
import haptics from '../utils/haptics';
import { supabase } from '../config/supabase';

type EventType = 'tournament' | 'birthday' | 'wedding' | 'corporate' | 'other';

interface EventOption {
  id: EventType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const EVENT_OPTIONS: EventOption[] = [
  { id: 'tournament', label: 'Tournoi', icon: 'trophy', color: '#F59E0B' },
  { id: 'birthday', label: 'Anniversaire', icon: 'party-popper', color: '#EC4899' },
  { id: 'wedding', label: 'Mariage', icon: 'heart', color: '#EF4444' },
  { id: 'corporate', label: 'Entreprise', icon: 'domain', color: '#3B82F6' },
  { id: 'other', label: 'Autre', icon: 'dots-horizontal', color: '#6B7280' },
];

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function EventContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Animations
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const formatPhone = (text: string) => {
    // Garder seulement les chiffres
    const cleaned = text.replace(/\D/g, '');
    // Formater: XX XX XX XX XX
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' ';
      formatted += cleaned[i];
    }
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhone(text));
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setErrorMessage('Veuillez entrer votre nom');
      return false;
    }
    if (phone.replace(/\s/g, '').length < 10) {
      setErrorMessage('Veuillez entrer un numéro valide');
      return false;
    }
    if (!selectedEvent) {
      setErrorMessage('Veuillez sélectionner un type d\'événement');
      return false;
    }
    if (!message.trim()) {
      setErrorMessage('Veuillez décrire votre événement');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setErrorMessage('');

    if (!validateForm()) {
      haptics.error();
      return;
    }

    haptics.light();
    setFormState('loading');

    try {
      const { data, error } = await supabase.functions.invoke('send-event-inquiry', {
        body: {
          name: name.trim(),
          phone: `+225 ${phone}`,
          event_type: EVENT_OPTIONS.find(e => e.id === selectedEvent)?.label || selectedEvent,
          message: message.trim(),
        },
      });

      if (error) throw error;

      // Animation de succès
      setFormState('success');
      haptics.success();

      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset form après 3 secondes
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error: any) {
      console.error('Error sending inquiry:', error);
      setFormState('error');
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      haptics.error();
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setSelectedEvent(null);
    setMessage('');
    setFormState('idle');
    successScale.setValue(0);
    successOpacity.setValue(0);
  };

  // Affichage du succès
  if (formState === 'success') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#ECFDF5', '#D1FAE5']}
          style={styles.successContainer}
        >
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              },
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
            </View>
            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successText}>
              Notre équipe vous contactera très bientôt pour organiser votre événement.
            </Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header décoratif */}
      <LinearGradient
        colors={[colors.primary.main, '#EA580C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerPattern}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternDot,
                { left: `${15 + i * 15}%`, top: i % 2 === 0 ? '20%' : '60%' },
              ]}
            />
          ))}
        </View>
        <MaterialCommunityIcons name="party-popper" size={32} color="rgba(255,255,255,0.9)" />
        <Text style={styles.headerTitle}>Organisez votre événement</Text>
        <Text style={styles.headerSubtitle}>Tournois, anniversaires, mariages...</Text>
      </LinearGradient>

      {/* Formulaire */}
      <View style={styles.formContainer}>
        {/* Sélection du type d'événement */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type d'événement</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventTypesContainer}
          >
            {EVENT_OPTIONS.map((event) => {
              const isSelected = selectedEvent === event.id;
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventTypeButton,
                    isSelected && { borderColor: event.color, backgroundColor: event.color + '10' },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setSelectedEvent(event.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.eventTypeIcon,
                      { backgroundColor: isSelected ? event.color : colors.neutral[100] },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={event.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.text.secondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.eventTypeLabel,
                      isSelected && { color: event.color, fontWeight: '700' },
                    ]}
                  >
                    {event.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Nom */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Votre nom</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Entrez votre nom complet"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Téléphone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.inputContainer}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+225</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="07 00 00 00 00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="phone-pad"
              maxLength={14}
            />
          </View>
        </View>

        {/* Message */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Décrivez votre événement</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Nombre de personnes, date souhaitée, besoins spécifiques..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Message d'erreur */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.error.main} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Bouton envoyer */}
        <TouchableOpacity
          style={[styles.submitButton, formState === 'loading' && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={formState === 'loading'}
          activeOpacity={0.8}
        >
          {formState === 'loading' ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Envoyer ma demande</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  // Header
  header: {
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  patternDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: textStyles.h3.fontFamily,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
  },
  // Form
  formContainer: {
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    ...textStyles.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  // Event types
  eventTypesContainer: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  eventTypeButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.background.primary,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  eventTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: textStyles.body.fontFamily,
    color: colors.text.primary,
  },
  phonePrefix: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
    height: '100%',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  phoneInput: {
    paddingLeft: spacing.md,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error.main,
  },
  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.button,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Success
  successContainer: {
    padding: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    borderRadius: borderRadius.card,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: textStyles.h2.fontFamily,
    fontWeight: '700',
    color: colors.success.dark,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: 15,
    color: colors.success.dark,
    textAlign: 'center',
    lineHeight: 22,
  },
});
