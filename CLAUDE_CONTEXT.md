# CLAUDE_CONTEXT.md - Arena App

> **IMPORTANT - MISE A JOUR OBLIGATOIRE**
>
> Ce document DOIT etre mis a jour pour chaque nouvelle fonctionnalite VALIDEE et sans bug par le developpeur.
> Avant d'implementer une nouvelle fonctionnalite, Claude Code DOIT lire ce fichier pour comprendre :
> - Les regles metier existantes a ne pas casser
> - Les patterns et conventions a suivre
> - Les fonctionnalites deja implementees
>
> **Ne JAMAIS modifier le code existant sans avoir lu et compris ce document.**

---

## 1. VUE D'ENSEMBLE DU PROJET

### Description
Application mobile de reservation de terrains de sport (Football et Padel) en Cote d'Ivoire.

### Stack Technique
| Couche | Technologie |
|--------|-------------|
| **Frontend** | React Native 0.81.5 + Expo 54 |
| **Language** | TypeScript 5.9 |
| **State** | Zustand 5.0.8 avec persistence |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **Navigation** | React Navigation 7 |
| **UI** | Theme systeme centralise + Custom components |
| **Notifications** | Expo Notifications |

### Projet Supabase
- **Nom**: arena-ci
- **ID**: fzzsnjiaqnasysboqeap
- **Region**: eu-west-3

---

## 2. STRUCTURE DES FICHIERS

```
arena-app/
├── App.tsx                    # Point d'entree (fonts, theme, navigation)
├── src/
│   ├── config/
│   │   └── supabase.ts        # Client Supabase avec secure storage
│   ├── stores/
│   │   ├── authStore.ts       # Etat authentification (Zustand)
│   │   └── bookingStore.ts    # Etat reservations (Zustand)
│   ├── services/
│   │   ├── authService.ts     # Wrapper auth simplifie
│   │   ├── bookingService.ts  # Wrapper booking simplifie
│   │   └── notificationService.ts # Push notifications
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── VerifyCodeScreen.tsx
│   │   ├── CompleteProfileScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   ├── ConfirmationScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── PhoneInput.tsx
│   │   ├── CodeInput.tsx
│   │   ├── CourtCard.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── PaymentMethodPicker.tsx
│   │   ├── BookingDetailModal.tsx
│   │   └── Skeleton.tsx
│   ├── theme/
│   │   ├── index.ts           # Exports theme
│   │   ├── colors.ts          # Palette de couleurs
│   │   ├── typography.ts      # Fonts et styles texte
│   │   ├── spacing.ts         # Espacements et dimensions
│   │   ├── shadows.ts         # Ombres cross-platform
│   │   └── ThemeProvider.tsx  # Context provider
│   ├── types/
│   │   └── index.ts           # Tous les types TypeScript
│   ├── utils/
│   │   ├── dateHelpers.ts     # Formatage dates (locale FR)
│   │   ├── phoneValidator.ts  # Validation telephone CI
│   │   └── haptics.ts         # Feedback haptique
│   └── navigation/
│       └── AppNavigator.tsx   # Configuration navigation
└── CLAUDE_CONTEXT.md          # CE FICHIER
```

---

## 3. BASE DE DONNEES (Supabase PostgreSQL)

### Tables et Schemas

#### `profiles` (utilisateurs)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Lie a auth.users |
| phone | varchar (unique) | Numero +225 |
| first_name | varchar | Prenom (requis pour reserver) |
| last_name | varchar | Nom (requis pour reserver) |
| birth_date | date | Date naissance (optionnel) |
| email | varchar | Email (optionnel) |
| role | user_role | 'user' \| 'manager' \| 'admin' |
| phone_verified | boolean | Telephone verifie |
| push_token | text | Token push notification |
| created_at, updated_at | timestamptz | Timestamps |

#### `courts` (terrains)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| name | varchar | Nom du terrain |
| slug | varchar (unique) | URL-friendly |
| type | varchar | 'football' \| 'padel' |
| price | integer | Prix en FCFA |
| duration | integer | Duree slot (60 min par defaut) |
| is_active | boolean | Terrain disponible |

#### `time_slots` (creneaux horaires)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| start_time | time | Heure debut (ex: 08:00:00) |
| end_time | time | Heure fin (ex: 09:00:00) |
| slot_order | integer | Ordre d'affichage |

#### `bookings` (reservations)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| user_id | uuid (FK) | Reference profiles |
| court_id | uuid (FK) | Reference courts |
| time_slot_id | uuid (FK) | Reference time_slots |
| date | date | Date reservation |
| status | booking_status | Voir enum ci-dessous |
| payment_method | payment_method | Voir enum ci-dessous |
| payment_status | payment_status | 'pending' \| 'completed' \| 'failed' |
| total_amount | integer | Montant total FCFA |
| credit_used | numeric | Credit utilise |
| overridden_booking_id | uuid (FK) | Si override d'une reservation |

**Enum booking_status:**
- `pending` - En attente
- `confirmed` - Confirmee
- `completed` - Terminee
- `no_show` - Non presente
- `cancelled` - Annulee
- `unpaid` - Non payee (reservation sans paiement)
- `paid` - Payee et verrouillee
- `cancelled_by_override` - Annulee car un autre utilisateur a paye

**Enum payment_method:**
- `orange_money` - Paiement Orange Money
- `wave` - Paiement Wave
- `cash` - Paiement en especes
- `credit` - 100% credit app
- `credit_and_mobile` - Credit partiel + mobile money

#### `user_credits` (credits utilisateur)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| user_id | uuid (FK) | Reference profiles |
| booking_id | uuid (FK) | Reservation associee (si applicable) |
| amount | integer | Montant (+positif/-negatif) |
| reason | text | Raison (booking_payment, refund, etc.) |

**Calcul solde:** `SUM(amount) WHERE user_id = X`

#### `user_fines` (amendes)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| user_id | uuid (FK) | Reference profiles |
| booking_id | uuid (FK) | Reservation liee |
| amount | integer | Montant amende FCFA |
| reason | text | Raison (no_show, late_cancellation) |
| status | varchar | 'pending' \| 'paid' |
| paid_at | timestamptz | Date paiement |

#### `notifications` (notifications in-app)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| user_id | uuid (FK) | Destinataire |
| type | varchar | Type notification |
| title | text | Titre |
| message | text | Message |
| data | jsonb | Donnees additionnelles |
| read | boolean | Lu ou non |

#### `slot_locks` (verrous de creneaux)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| court_id | uuid (FK) | Terrain |
| time_slot_id | uuid (FK) | Creneau |
| date | date | Date |
| user_id | uuid (FK) | Utilisateur qui verrouille |
| expires_at | timestamptz | Expiration (2 minutes) |

**But:** Empecher les reservations concurrentes pendant le paiement.

#### `sms_verification_attempts` (tentatives SMS)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Auto-genere |
| phone | varchar | Numero telephone |
| created_at | timestamptz | Date tentative |

**But:** Rate limiting des SMS (3 par 30 min).

### Relations
```
profiles <-- bookings --> courts
              |
              v
          time_slots

profiles <-- user_credits --> bookings
profiles <-- user_fines --> bookings
profiles <-- notifications
profiles <-- slot_locks --> courts, time_slots
```

---

## 4. EDGE FUNCTIONS (API Backend)

### `get-available-slots`
**But:** Recuperer les creneaux disponibles pour un terrain et une date.

**Input:**
```json
{
  "court_id": "uuid",
  "date": "YYYY-MM-DD"
}
```

**Output:**
```json
{
  "slots": [
    {
      "slot_id": "uuid",
      "start_time": "08:00:00",
      "end_time": "09:00:00",
      "status": "free|unpaid|paid|past",
      "booking_id": "uuid|null",
      "can_override": true|false
    }
  ]
}
```

**Statuts slot:**
- `free` - Libre, peut etre reserve
- `unpaid` - Reserve mais non paye (peut etre override si can_override=true)
- `paid` - Reserve et paye (verrouille)
- `past` - Creneau passe

---

### `check-user-can-book`
**But:** Verifier si l'utilisateur peut reserver (pas d'amendes en attente).

**Input:** Aucun (utilise le token JWT)

**Output:**
```json
{
  "can_book": true|false,
  "pending_fines_total": 0,
  "fines": []
}
```

**Regle:** Si `pending_fines_total > 0`, l'utilisateur ne peut PAS reserver.

---

### `create-booking`
**But:** Creer une nouvelle reservation.

**Input:**
```json
{
  "court_id": "uuid",
  "time_slot_id": "uuid",
  "date": "YYYY-MM-DD",
  "is_paying": true|false,
  "payment_method": "orange_money|wave|cash|credit|credit_and_mobile",
  "use_credit": true|false,
  "mobile_method": "orange_money|wave"
}
```

**Output (succes):**
```json
{
  "success": true,
  "booking": { ... },
  "payment_breakdown": {
    "credit_amount": 0,
    "mobile_amount": 5000,
    "total_amount": 5000
  }
}
```

**Output (erreur propre reservation existante):**
```json
{
  "success": true,
  "own_unpaid_booking": true,
  "booking_id": "uuid"
}
```
→ L'utilisateur doit aller dans "Mes Reservations" pour payer.

**Output (erreur):**
```json
{
  "success": false,
  "error": "SLOT_ALREADY_BOOKED|PENDING_FINES|SLOT_LOCKED|...",
  "pending_fines": 2500
}
```

**Logique Override:**
Si un creneau est `unpaid` par un autre utilisateur ET que `is_paying=true`:
1. L'ancienne reservation passe en `cancelled_by_override`
2. Une notification est creee pour l'ancien utilisateur
3. Un push notification est envoye si push_token existe
4. La nouvelle reservation est creee avec `overridden_booking_id`

---

### `pay-booking`
**But:** Payer une reservation existante non payee.

**Input:**
```json
{
  "booking_id": "uuid",
  "payment_method": "orange_money|wave|cash|credit|credit_and_mobile",
  "use_credit": true|false,
  "mobile_method": "orange_money|wave"
}
```

**Output:**
```json
{
  "success": true,
  "booking": { ... },
  "payment_breakdown": { ... }
}
```

**Validations:**
- La reservation doit etre `unpaid`
- L'utilisateur doit etre le proprietaire
- Le creneau ne doit pas etre passe

---

### `cancel-booking`
**But:** Annuler une reservation.

**Input:**
```json
{
  "booking_id": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "message": "...",
  "refund_amount": 0,
  "fine_amount": 0
}
```

---

### `pay-fine`
**But:** Payer une amende en attente.

**Input:**
```json
{
  "fine_id": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "message": "..."
}
```

---

## 5. REGLES METIER VALIDEES

### Authentification
| Regle | Implementation |
|-------|----------------|
| Numeros +225 uniquement | `phoneValidator.ts` valide format ivoirien |
| OTP 6 chiffres | Supabase Auth avec SMS |
| Profil complet requis | `first_name` + `last_name` requis pour reserver |
| Session persistante | Token JWT stocke dans SecureStore |

### Reservations
| Regle | Implementation |
|-------|----------------|
| Un seul creneau paye par utilisateur par slot | Verifie dans `create-booking` |
| Reservation non payee = peut etre override | Si `is_paying=true` et slot `unpaid` |
| Verrouillage 2 min pendant paiement | Table `slot_locks` |
| 14 jours max a l'avance | `BookingScreen` limite le calendrier |
| Pas de reservation dans le passe | `pay-booking` verifie la date/heure |

### Paiements
| Regle | Implementation |
|-------|----------------|
| Credit couvre 100% si suffisant | `payment_method = 'credit'` |
| Credit partiel + mobile money | `payment_method = 'credit_and_mobile'` |
| Mobile money requis si credit insuffisant | Erreur si pas de `mobile_method` |
| Deduction credit atomique | INSERT negatif dans `user_credits` |

### Amendes
| Regle | Implementation |
|-------|----------------|
| Amendes bloquent nouvelles reservations | `check-user-can-book` retourne `can_book=false` |
| Payer toutes les amendes pour debloquer | UI affiche modal amendes |

### Notifications
| Regle | Implementation |
|-------|----------------|
| Override = notification a l'ancien user | Notification DB + Push Expo |
| Paiement = notification confirmation | Type `booking_paid` |

---

## 6. FONCTIONNALITES VALIDEES

### Authentification
- [x] Login par numero de telephone (+225)
- [x] Verification OTP SMS
- [x] Completion profil obligatoire
- [x] Deconnexion avec suppression push token
- [x] Persistance session (SecureStore)

### Navigation
- [x] Stack Auth (Login -> Verify -> CompleteProfile)
- [x] Bottom Tabs (Home, Bookings, Profile)
- [x] Stack Booking (Home -> Booking -> Confirmation)

### Ecran Home
- [x] Affichage liste terrains (Football, Padel)
- [x] Affichage solde credits (toujours visible, meme a 0)
- [x] Bouton profil avec initiales utilisateur
- [x] Card terrain avec icone, badge type, prix

### Ecran Booking
- [x] Calendrier avec locale francaise
- [x] Selection date (14 jours max)
- [x] Affichage creneaux avec statuts couleur
- [x] Legende statuts (libre, non paye, paye, passe)
- [x] Info override creneaux non payes
- [x] Selection creneau
- [x] Affichage solde credits et bouton profil dans header

### Ecran Confirmation
- [x] Recapitulatif reservation
- [x] Affichage solde credit
- [x] Selection methode paiement
- [x] Breakdown credit/mobile money
- [x] Modal amendes si bloque
- [x] Reservation avec paiement
- [x] Reservation sans paiement (cash)

### Ecran Bookings (Mes Reservations)
- [x] Liste toutes les reservations
- [x] Tri par date decroissante
- [x] Badge statut colore
- [x] Modal detail reservation
- [x] Payer reservation non payee
- [x] Annuler reservation
- [x] Affichage solde credits et bouton profil dans header
- [x] Filtrage "a venir" vs "passe" base sur date + heure du creneau
- [x] UX paiement: affichage solde credit + confirmation avant paiement
- [x] Options mobile money masquees si credit couvre 100%
- [x] Reset etat modal a chaque ouverture
- [x] Scroll modal corrige (Pressable absoluteFill)

### Ecran Profile
- [x] Affichage infos utilisateur
- [x] Bouton deconnexion

### Systeme Paiement
- [x] Orange Money
- [x] Wave
- [x] Cash
- [x] Credit 100%
- [x] Credit partiel + mobile

### Systeme Override
- [x] Detection slot unpaid
- [x] Badge "Remplacer" sur creneau
- [x] Override avec paiement
- [x] Notification ancien utilisateur

### Theme et UI
- [x] Couleurs centralisees
- [x] Fonts Plus Jakarta Sans + DM Sans
- [x] Spacing systeme
- [x] Shadows cross-platform
- [x] Skeletons loading
- [x] Haptics feedback

---

## 7. PATTERNS ET CONVENTIONS

### Zustand Stores
```typescript
// Toujours utiliser create<State>()((set, get) => ({ ... }))
// Actions async: set({ isLoading: true }) au debut
// Erreurs: set({ error: message, isLoading: false })
```

### Edge Function Calls
```typescript
// Utiliser callEdgeFunction<ResponseType>(name, body)
// Defini dans bookingStore.ts
```

### Theme Usage
```typescript
import { useTheme } from '@/theme';
const theme = useTheme();
// theme.colors.primary.main
// theme.typography.h1
// theme.spacing.lg
```

### Formatage Dates
```typescript
import { formatDate, formatDateForApi, formatPrice } from '@/utils/dateHelpers';
// formatDate(date) -> "27 novembre 2025"
// formatDateForApi(date) -> "2025-11-27"
// formatPrice(5000) -> "5 000 FCFA"
```

### Haptics
```typescript
import { haptics } from '@/utils/haptics';
await haptics.selection(); // Pour selection
await haptics.success();   // Pour succes
```

### Types
Tous les types sont dans `src/types/index.ts`. Importer depuis la.

---

## 8. POINTS CRITIQUES - NE PAS CASSER

### Flux Authentification
1. `LoginScreen` -> `sendVerificationCode(phone)`
2. `VerifyCodeScreen` -> `verifyCode(phone, code)`
3. Check `isProfileComplete(user)` -> CompleteProfile ou MainTabs

### Flux Reservation
1. `HomeScreen` -> `selectCourt(court)`
2. `BookingScreen` -> `selectDate(date)` -> auto `fetchAvailableSlots`
3. `TimeSlotPicker` -> `selectSlot(slot)`
4. `ConfirmationScreen` -> `checkUserCanBook()` -> si bloque, modal amendes
5. `createBooking(isPaying, useCredit, mobileMethod)`

### Logique Override
```typescript
// Dans createBooking Edge Function:
// 1. Si slot unpaid ET is_paying=true ET user different
// 2. Update old booking -> cancelled_by_override
// 3. Insert notification
// 4. Send push notification
// 5. Create new booking avec overridden_booking_id
```

### Calcul Credit
```typescript
// Dans Edge Functions:
const creditBalance = SUM(user_credits.amount WHERE user_id = ?)
if (creditBalance >= total_amount) -> payment_method = 'credit'
else if (creditBalance > 0) -> payment_method = 'credit_and_mobile'
// Deduction = INSERT user_credits avec amount NEGATIF
```

### Slot Locking
```typescript
// 1. Nettoyer locks expires
// 2. INSERT slot_lock avec expires_at = now() + 2 min
// 3. Si conflit unique -> verifier si meme user ou expire
// 4. Si bloque par autre -> erreur SLOT_LOCKED
// 5. Apres paiement -> DELETE slot_lock
```

---

## 9. COMMANDES UTILES

### Developpement
```bash
npx expo start           # Demarrer le serveur dev
npx expo start --clear   # Avec cache clear
npx tsc --noEmit        # Verifier types TypeScript
```

### Supabase
```bash
# Les Edge Functions sont gerees directement via Supabase Dashboard
# Projet: arena-ci (fzzsnjiaqnasysboqeap)
```

---

## CHANGELOG

| Date | Modification | Valide par |
|------|--------------|------------|
| 2025-11-27 | Documentation initiale creee | - |
| 2025-11-27 | Solde credits toujours visible + badge credit et profil sur Booking/Bookings | - |
| 2025-11-27 | Filtrage creneaux passes base sur date+heure (empeche annulation) | - |
| 2025-11-27 | UX paiement amelioree: confirmation avant credit, scroll modal corrige | - |

---

> **Rappel:** Mettre a jour ce fichier apres chaque fonctionnalite validee !
