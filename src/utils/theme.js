import { MD3LightTheme } from 'react-native-paper'

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    primaryContainer: '#dbeafe',
    secondary: '#10b981',
    secondaryContainer: '#d1fae5',
    tertiary: '#f59e0b',
    tertiaryContainer: '#fef3c7',
    error: '#ef4444',
    errorContainer: '#fee2e2',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#f5f5f5',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onError: '#ffffff',
    onSurface: '#1f2937',
    onSurfaceVariant: '#6b7280',
    outline: '#d1d5db',
    outlineVariant: '#e5e7eb',
  },
  fonts: {
    ...MD3LightTheme.fonts,
  },
}
