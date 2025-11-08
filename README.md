# StylerX - Personal Style & Color Analysis App

A React Native app built with Expo that helps users discover their personal color season, try on outfits virtually, and manage their wardrobe.

## Features

- 🎨 **Personal Color Analysis** - AI-powered color season detection from photos
- 👔 **Virtual Try-On** - See how outfits look on you before buying
- 👕 **Wardrobe Management** - Save and organize your favorite items
- 📱 **Outfit Swiping** - Discover new styles with Tinder-like swiping
- 👤 **User Profiles** - Track your color analysis results and preferences

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (installed globally or via npx)
- **iOS Simulator** (for Mac) or **Android Studio** (for Android development)
- **Expo Go app** (optional, for testing on physical devices)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm start
```

or

```bash
npx expo start
```

### 3. Run on Your Device/Simulator

After starting the server, you'll see options to:

- Press `i` to open in **iOS Simulator**
- Press `a` to open in **Android Emulator**
- Scan QR code with **Expo Go** app on your phone
- Press `w` to open in **web browser**

## Available Scripts

```bash
# Start development server
npm start

# Start with tunnel (for testing on physical devices)
npm run start:tunnel

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Lint code
npm run lint
```

## Project Structure

```
expo_project/
├── app/                    # Main app screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   ├── onboarding/       # Onboarding flow
│   └── ...
├── components/            # Reusable components
├── contexts/              # React contexts (Auth, etc.)
├── utils/                 # Utility functions
└── assets/               # Images and static assets
```

## API Configuration

The app connects to a backend API. The base URL is configured in individual screen files:

```typescript
const API_BASE_URL = "https://stylist-ai-be.onrender.com";
```

## Key Technologies

- **Expo** ~54.0.22
- **React Native** 0.81.5
- **React** 19.1.0
- **Expo Router** (file-based routing)
- **TypeScript**
- **Expo Camera** (for photo capture)
- **Expo Image Picker** (for gallery access)

## Permissions

The app requires the following permissions:
- **Camera** - For taking photos for color analysis
- **Photo Library** - For selecting and saving images

These are automatically requested when needed.

## Troubleshooting

### iOS Build Issues
```bash
cd ios
pod install
cd ..
npm run ios
```

### Clear Cache
```bash
npx expo start --clear
```

### Reset Project
```bash
npm run reset-project
```

## Development Notes

- Uses **Expo Router** for navigation (file-based routing)
- Authentication is handled via `AuthContext`
- Color analysis results are saved to user profile
- Virtual try-on uses sequential image processing

## License

Private project
