# Faith Tracker

A mobile-first religious tracking web app built with React, Tailwind CSS, and Firebase.

## Features

- **Google Authentication** — Secure login with session persistence
- **Nafl Tracker** — Log voluntary prayers with date and intention
- **Quran Progress** — Track Juz progress with quarter increments
- **Sajda Counter** — Simple increment/decrement counter
- **Qaza Prayer Tracker** — Track missed prayers by type with dates and reasons
- **Charity Tracker** — Track amounts to give
- **Offline Support** — Full offline-first with Firestore persistence
- **Dark/Light Theme** — System-aware with manual toggle
- **Data Export** — Download all data as JSON
- **PWA Ready** — Installable on mobile devices

## Setup

1. Clone and install:

```bash
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Fill in your Firebase config values in `.env`

4. Start development:

```bash
npm run dev
```

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** sign-in under Authentication → Sign-in method
3. Create a Firestore database
4. Deploy the security rules from `firestore.rules`
5. Copy your web app config to `.env`

## Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deploys.
Set all `VITE_FIREBASE_*` environment variables plus `GEOAPIFY_API_KEY` in your Vercel project settings.

## Tech Stack

- React 19 + Vite 6
- Tailwind CSS 3
- Firebase Auth + Firestore
- react-hot-toast
- vite-plugin-pwa
