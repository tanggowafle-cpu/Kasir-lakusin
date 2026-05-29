---
name: Lakusin Mobile App Setup
description: Full POS Expo app for Indonesian warung owners — key dependency versions, auth setup, and gotchas.
---

# Lakusin — Setup Notes

## Working Dependency Versions (Expo SDK 54)

- `@clerk/expo@^3.3.0` — v2.x breaks on Expo web with "loadClerkUiScript is not a function" after expo-auth-session is installed; v3.x fixes this.
- `expo-auth-session@~7.0.11` — required by @clerk/expo for SSO; must be installed.
- `expo-secure-store@~15.0.8`
- `expo-crypto@~15.0.8`
- `expo-web-browser@~15.0.10`
- `expo-file-system@~19.0.22`
- `expo-print@~15.0.8`
- `expo-sharing@~14.0.8`

**Why:** @clerk/expo v2.x + expo-auth-session causes Clerk's IsomorphicClerk to attempt loadClerkUiScript (CDN loading) on Expo web which fails. v3.x uses @clerk/react@6.x which handles this correctly.

## minimumReleaseAge bypass

When @clerk/expo or its deps (@clerk/react, @clerk/shared, @clerk/types) are too new to install (pnpm minimumReleaseAge=1440), add them temporarily to `minimumReleaseAgeExclude` in pnpm-workspace.yaml, install, then remove the entries.

## App Architecture

- Expo Router v6, React 19, TypeScript
- Auth: @clerk/expo with custom-built login/register/forgot-password screens (Indonesian)
- Colors: dark blue #1B4F8A, light blue #2D7DD2
- Storage: AsyncStorage for store data (products, transactions, expenses, debts, settings) keyed by userId
- Trial system: 14-day trial tracked in AsyncStorage `@lakusin/profile/{clerkId}`
- PDF/share: expo-print + expo-sharing + expo-file-system

## Screens

- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`
- `setup-profil` — first-run profile setup after registration
- `(tabs)/beranda`, `produk`, `kasir`, `laporan`, `pengaturan`
- `checkout`, `struk`, `tambah-produk`, `edit-produk`
- `hutang`, `pengeluaran`, `riwayat-stok`, `analisa`, `detail-transaksi`
