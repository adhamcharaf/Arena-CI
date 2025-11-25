// Validation et formatage des numéros de téléphone ivoiriens

export type Operator = 'MTN' | 'Orange' | 'Moov' | 'unknown';

// Préfixes par opérateur en Côte d'Ivoire
const OPERATOR_PREFIXES: Record<string, Operator> = {
  '07': 'MTN',
  '05': 'MTN',
  '01': 'Orange', // Orange et Moov partagent le 01
};

/**
 * Valide un numéro de téléphone ivoirien
 * Format accepté: +225 0X XX XX XX XX (10 chiffres après +225)
 */
export function validatePhoneCI(phone: string): { valid: boolean; error?: string } {
  // Nettoyer le numéro
  const cleaned = phone.replace(/\s/g, '');

  // Vérifier le format de base
  if (!cleaned.startsWith('+225')) {
    return { valid: false, error: 'Le numéro doit commencer par +225' };
  }

  // Extraire les chiffres après +225
  const localNumber = cleaned.substring(4);

  // Vérifier la longueur (10 chiffres)
  if (localNumber.length !== 10) {
    return { valid: false, error: 'Le numéro doit contenir 10 chiffres après +225' };
  }

  // Vérifier que ce sont bien des chiffres
  if (!/^\d{10}$/.test(localNumber)) {
    return { valid: false, error: 'Le numéro ne doit contenir que des chiffres' };
  }

  // Vérifier le préfixe opérateur (doit commencer par 0)
  if (!localNumber.startsWith('0')) {
    return { valid: false, error: 'Le numéro doit commencer par 0 après +225' };
  }

  // Vérifier que le préfixe est valide (01, 05, 07)
  const prefix = localNumber.substring(0, 2);
  if (!['01', '05', '07'].includes(prefix)) {
    return { valid: false, error: 'Préfixe opérateur invalide. Utilisez 01, 05 ou 07' };
  }

  return { valid: true };
}

/**
 * Détecte l'opérateur à partir du numéro
 */
export function detectOperator(phone: string): Operator {
  const cleaned = phone.replace(/\s/g, '');

  if (!cleaned.startsWith('+225') || cleaned.length < 6) {
    return 'unknown';
  }

  const prefix = cleaned.substring(4, 6);
  return OPERATOR_PREFIXES[prefix] || 'unknown';
}

/**
 * Formate un numéro pour l'affichage
 * +225 07 XX XX XX XX
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');

  if (!cleaned.startsWith('+225') || cleaned.length !== 14) {
    return phone;
  }

  const local = cleaned.substring(4);
  return `+225 ${local.substring(0, 2)} ${local.substring(2, 4)} ${local.substring(4, 6)} ${local.substring(6, 8)} ${local.substring(8, 10)}`;
}

/**
 * Masque un numéro pour l'affichage sécurisé
 * +225 07 ** ** ** 23
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');

  if (!cleaned.startsWith('+225') || cleaned.length !== 14) {
    return phone;
  }

  const local = cleaned.substring(4);
  return `+225 ${local.substring(0, 2)} ** ** ** ${local.substring(8, 10)}`;
}

/**
 * Nettoie et normalise un numéro de téléphone
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\s/g, '');
}
