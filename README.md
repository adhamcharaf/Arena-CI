# Arena App - Réservation de Terrains Sportifs

Application mobile React Native pour la réservation de terrains sportifs (football, padel) à Grand-Bassam, Côte d'Ivoire.

## Fonctionnalités

- **Authentification SMS** via Twilio Verify (format +225)
- **Réservation de terrains** (football et padel)
- **Calendrier interactif** avec créneaux disponibles en temps réel
- **Paiement simulé** (Orange Money, Wave, Espèces)
- **Profil utilisateur** avec historique des réservations

## Stack Technique

- **Frontend**: React Native + Expo (managed workflow)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Twilio Verify SMS
- **State Management**: Zustand avec persistance
- **Stockage sécurisé**: expo-secure-store

## Prérequis

- Node.js >= 18
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Un compte [Supabase](https://supabase.com)
- Un compte [Twilio](https://twilio.com) avec Verify activé

## Installation

### 1. Cloner et installer les dépendances

```bash
cd arena-app
npm install
```

### 2. Configuration des variables d'environnement

Copier le fichier `.env.example` vers `.env` et remplir les valeurs :

```bash
cp .env.example .env
```

Variables requises :
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

### 3. Configuration Supabase

#### Secrets des Edge Functions

Dans le dashboard Supabase > Project Settings > Edge Functions, ajouter :

- `TWILIO_ACCOUNT_SID` - Votre Account SID Twilio
- `TWILIO_AUTH_TOKEN` - Votre Auth Token Twilio
- `TWILIO_VERIFY_SERVICE_SID` - Le SID du service Verify

#### Tables créées automatiquement

- `profiles` - Utilisateurs
- `courts` - Terrains (2 par défaut: Football + Padel)
- `time_slots` - Créneaux horaires (06h-00h)
- `bookings` - Réservations
- `sms_verification_attempts` - Rate limiting SMS

### 4. Lancer l'application

```bash
# Démarrer le serveur de développement
npx expo start

# Ou directement sur un émulateur
npx expo run:android
npx expo run:ios
```

## Structure du Projet

```
arena-app/
├── App.tsx                     # Point d'entrée
├── src/
│   ├── config/
│   │   └── supabase.ts         # Client Supabase
│   ├── stores/
│   │   ├── authStore.ts        # État authentification
│   │   └── bookingStore.ts     # État réservations
│   ├── services/
│   │   ├── authService.ts      # Service auth
│   │   └── bookingService.ts   # Service réservations
│   ├── screens/
│   │   ├── LoginScreen.tsx     # Écran connexion
│   │   ├── VerifyCodeScreen.tsx# Vérification SMS
│   │   ├── HomeScreen.tsx      # Liste terrains
│   │   ├── BookingScreen.tsx   # Calendrier + créneaux
│   │   ├── ConfirmationScreen.tsx # Récap + paiement
│   │   └── ProfileScreen.tsx   # Profil utilisateur
│   ├── components/
│   │   ├── PhoneInput.tsx      # Input téléphone CI
│   │   ├── CodeInput.tsx       # Input code OTP
│   │   ├── CourtCard.tsx       # Carte terrain
│   │   ├── TimeSlotPicker.tsx  # Sélecteur créneaux
│   │   └── PaymentMethodPicker.tsx # Sélecteur paiement
│   ├── utils/
│   │   ├── phoneValidator.ts   # Validation +225
│   │   └── dateHelpers.ts      # Helpers dates/prix
│   ├── types/
│   │   └── index.ts            # Types TypeScript
│   └── navigation/
│       └── AppNavigator.tsx    # Configuration navigation
```

## Edge Functions Supabase

### send-verification-code

Envoie un code SMS via Twilio Verify.

```bash
curl -X POST 'https://votre-projet.supabase.co/functions/v1/send-verification-code' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"phone": "+225 07 00 00 00 00"}'
```

### verify-code

Vérifie le code et crée/connecte l'utilisateur.

```bash
curl -X POST 'https://votre-projet.supabase.co/functions/v1/verify-code' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"phone": "+225 07 00 00 00 00", "code": "123456"}'
```

## Format Téléphone Côte d'Ivoire

L'application accepte uniquement les numéros ivoiriens au format :

- `+225 07 XX XX XX XX` (MTN)
- `+225 05 XX XX XX XX` (MTN)
- `+225 01 XX XX XX XX` (Orange/Moov)

## Sécurité

- **Rate limiting**: 3 SMS max par numéro toutes les 30 minutes
- **JWT signé**: Session de 1 an avec token signé par Supabase
- **RLS**: Row Level Security activé sur toutes les tables
- **Stockage sécurisé**: Tokens stockés via expo-secure-store

## Paiement (Mock)

Le paiement est simulé pour le MVP. Les options disponibles sont :
- Orange Money
- Wave
- Espèces (paiement sur place)

## Roadmap

### Phase 1 (MVP) ✅
- Authentification SMS
- Réservation de base
- Mock paiement

### Phase 2 (À venir)
- Intégration paiement réel (Orange Money API, Wave API)
- Notifications push
- Annulation avec pénalités
- Panel admin

## Équipe

Développé pour **Arena Grand-Bassam**, Côte d'Ivoire.

## Licence

Propriétaire - Tous droits réservés.
