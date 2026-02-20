# Delta — Expo Migration Guide

## What Changed (and Why)

| File | Change |
|------|--------|
| `package.json` | Replaced Vite/React DOM with Expo + React Native deps |
| `App.tsx` | Added `SafeAreaProvider`, `StatusBar`, passed `onSignOut` to Dashboard |
| `services/storageService.ts` | Replaced ALL `localStorage` calls with `AsyncStorage` |
| `services/deltaService.ts` | **Fixed broken Gemini model names** + AsyncStorage caching |
| `services/supabaseClient.ts` | Uses `EXPO_PUBLIC_` env vars + AsyncStorage for auth session |
| `app.json` | New Expo config (bundle IDs, splash, icons) |
| `babel.config.js` | Expo babel preset |
| `tsconfig.json` | Expo TypeScript config |
| `index.ts` | Expo Router entry point |
| `.env.example` | Env vars now use `EXPO_PUBLIC_` prefix |

---

## Step-by-Step Migration

### 1. Copy these files into your existing repo root:
- `app.json`
- `babel.config.js`
- `tsconfig.json` (replace existing)
- `index.ts` (replace existing `index.tsx`)
- `.env.example` → copy to `.env.local` and fill in your keys

### 2. Replace these files:
- `App.tsx` → use new version
- `services/storageService.ts` → use new version
- `services/deltaService.ts` → use new version
- `services/supabaseClient.ts` → use new version
- `package.json` → use new version

### 3. Update Dashboard.tsx
The `Dashboard` component now receives an `onSignOut` prop. Update the signature:

```tsx
// Before
interface DashboardProps { user: UserContext; }

// After
interface DashboardProps { user: UserContext; onSignOut: () => void; }
```

And update the sign out button inside Dashboard:
```tsx
// Before
onClick={() => storageService.signOut()}

// After  
onClick={() => storageService.signOut(onSignOut)}
```

### 4. Fix React Native incompatible patterns in your view components

Any component using these web-only APIs needs updating:

| Web (remove) | React Native (replace with) |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` |
| `<input>` | `<TextInput>` |
| `<img>` | `<Image>` |
| `navigator.clipboard.writeText()` | `Clipboard.setStringAsync()` from `expo-clipboard` |
| CSS classes (`className`) | `StyleSheet` or inline `style` prop |
| `localStorage` | Already handled in storageService ✅ |
| `window.location` | Already handled in storageService ✅ |

> **Note:** Your view components (HomeView, LearnView, etc.) still use web HTML/Tailwind.
> Since your Gemini AI Studio template was web-only, you have two options:
> - **Quick path:** Use `expo-router` with web target only first, test on web, then port views to RN
> - **Full path:** Convert each view to React Native components (recommended before App Store submission)

### 5. Install dependencies
```bash
npm install
npx expo install
```

### 6. Run
```bash
# Web (test first — your existing views work here)
npx expo start --web

# iOS Simulator
npx expo start --ios

# Android
npx expo start --android
```

### 7. Before App Store submission
- Add real icon assets to `./assets/` (icon.png 1024x1024, splash-icon.png)
- Register Apple Developer Account + create App ID `com.weaiteit.delta`
- Register Google Play Developer Account + create app `com.weaiteit.delta`
- Build with EAS: `npx eas build --platform all`

---

## Key Bugs Fixed

1. **Gemini model names were wrong** — `gemini-3-flash-preview` doesn't exist. Fixed to `gemini-2.0-flash` and `gemini-2.0-flash-lite`
2. **localStorage crashes in React Native** — replaced with AsyncStorage throughout
3. **`window.location.reload()` crashes in RN** — replaced with callback pattern
4. **Supabase auth session** — now uses AsyncStorage instead of browser cookies
5. **API keys in source code** — moved to `EXPO_PUBLIC_` env vars (remember to add `.env.local` to `.gitignore`!)

---

## Cost Optimisation Tips
- News is cached daily in AsyncStorage — API only called once per day ✅
- Use `gemini-2.0-flash-lite` for lessons (cheapest, fast enough) ✅  
- Use `gemini-2.0-flash` only for direct calls ✅
- Fallback mock data ensures app works even when APIs are down ✅
