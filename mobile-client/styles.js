import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#E53935', // Tealicieux Primary Brand Color
  accent: '#FFD700',   // Gold/Yellow
  white: '#FFFFFF',
  lightGray: '#F4F5F7',
  gray: '#EAEAEA',
  darkGray: '#999999',
  text: '#333333',
  background: '#F4F5F7',
};

export const SIZES = {
  padding: 24,
  h1: 30,
  h2: 24,
  h3: 20,
  body: 16,
};

export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.text },
  h2: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.text },
  h3: { fontSize: SIZES.h3, fontWeight: '600', color: COLORS.text },
  body: { fontSize: SIZES.body, color: COLORS.text },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Add other global styles if needed
});