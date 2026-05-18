# GlucoAI — AI-Powered Diabetes Management

A production-ready React Native Expo app with AI food scanning, insulin calculation, glucose tracking, and an AI diabetes chat assistant.

---

## Stack

- **React Native Expo** (SDK 51)
- **TypeScript** + Expo Router
- **NativeWind** (Tailwind CSS for RN)
- **Supabase** (auth + database)
- **OpenAI GPT-4o** (food vision + AI chat)
- **Zustand** (state management)
- **React Native Reanimated** (animations)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
```

### 3. Set up Supabase database

1. Go to [supabase.com](https://supabase.com) → your project → SQL Editor
2. Run the entire contents of `supabase/schema.sql`
3. Enable Email Auth in Authentication → Providers

### 4. Install Google Fonts (optional but recommended)

```bash
npx expo install @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono
```

### 5. Start the app

```bash
npx expo start
```

Use Expo Go, an iOS Simulator, or Android Emulator.

---

## Project Structure

```
app/
├── _layout.tsx          # Root layout + auth listener
├── index.tsx            # Route guard
├── onboarding.tsx       # Onboarding slides
├── scanner.tsx          # AI food scanner (modal)
├── scan-result.tsx      # Nutrition + insulin result
├── emergency.tsx        # Emergency panel (modal)
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
└── (tabs)/
    ├── _layout.tsx      # Tab bar with floating scan btn
    ├── home.tsx
    ├── history.tsx
    ├── chat.tsx
    └── profile.tsx

components/
├── GlassCard.tsx        # Glassmorphism card
├── GlowButton.tsx       # Animated gradient button
├── GlucoseGauge.tsx     # Circular glucose indicator
├── InputField.tsx       # Animated text input
├── NutritionBar.tsx     # Animated nutrition bar
└── SkeletonLoader.tsx   # Shimmer skeleton

store/
├── authStore.ts         # Auth + profile state
├── glucoseStore.ts      # Glucose readings
├── mealStore.ts         # Meal scans + pending scan
└── chatStore.ts         # AI chat messages

services/
├── supabase.ts          # Supabase client + all DB calls
└── openai.ts            # Food analysis + AI chat

constants/
├── colors.ts            # Full color palette
├── typography.ts        # Font scales
└── spacing.ts           # Spacing + shadow tokens

utils/
├── insulin.ts           # Insulin dose calculator
└── format.ts            # Date/number formatters
```

---

## Key Features

### AI Food Scanner
- Live camera with animated scanning border
- Captures food photo → GPT-4o Vision analysis
- Returns: calories, carbs, sugar, protein, fats, glycemic index

### Insulin Calculator
```
Dose = (Carbs ÷ CarbRatio) + ((CurrentGlucose − TargetGlucose) ÷ CorrectionFactor)
```

### AI Chat (Dark Neon Mode)
- GPT-4o diabetes specialist persona
- Chat history persisted to Supabase
- Typing animation, suggested prompts

### Emergency Panel
- Contextual guidance based on glucose level
- One-tap call to 911 or emergency contact
- Direct link to AI chat for guidance

---

## Supabase Tables

| Table | Description |
|-------|-------------|
| `users` | Profile, insulin settings, emergency contact |
| `meal_scans` | AI-analyzed meals with nutrition data |
| `glucose_logs` | Manual glucose readings |
| `chat_history` | AI chat messages |

---

## Design System

- **Primary**: `#00D4A8` (Mint Green)
- **Secondary**: `#0891B2` (Teal)
- **Background**: `#0A0E1A` (Deep Navy)
- **AI Chat**: `#060912` (Near-black) + `#00FF88` neon accents
- **Glass cards**: `rgba(20,27,45,0.8)` + blur
- **Fonts**: Inter (regular → ExtraBold)

---

## Medical Disclaimer

GlucoAI is an informational tool only. It does not provide medical advice. All insulin dose calculations are estimates — always consult your healthcare provider for personalized treatment decisions.
