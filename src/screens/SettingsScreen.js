import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Switch,
  List,
  Divider,
  ActivityIndicator,
  Text,
  TextInput,
  Dialog,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, offlineStorage } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    location: true,
    darkMode: false,
    autoSync: true,
    offlineMode: false,
  });
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'

  useEffect(() => {
    loadSettings();
    loadUserInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('appSettings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleSyncOfflineData = async () => {
    try {
      setSyncStatus('syncing');
      
      const offlineActions = await offlineStorage.getOfflineActions();
      
      if (offlineActions.length === 0) {
        Alert.alert('No Data to Sync', 'All data is already synchronized.');
        setSyncStatus('idle');
        return;
      }

      // Process offline actions
      let successCount = 0;
      let errorCount = 0;

      for (const action of offlineActions) {
        try {
          // Attempt to sync each action
          await authAPI.syncOfflineAction(action);
          successCount++;
        } catch (error) {
          console.error('Error syncing action:', error);
          errorCount++;
        }
      }

      // Clear successfully synced actions
      if (successCount > 0) {
        await offlineStorage.clearOfflineActions();
      }

      setSyncStatus('success');
      
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${successCount} actions.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error syncing offline data:', error);
      setSyncStatus('error');
      Alert.alert('Sync Error', 'Failed to sync offline data. Please try again.');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. You will need to re-download data when you next use the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear all cached data
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('assets') || 
                key.startsWith('dashboard') || 
                key.startsWith('nearby') ||
                key.startsWith('location')
              );
              
              await AsyncStorage.multiRemove(cacheKeys);
              
              Alert.alert('Cache Cleared', 'All cached data has been cleared successfully.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      
      // Collect all data for export
      const exportData = {
        settings,
        user,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      // In a real app, you would save this to a file or share it
      Alert.alert(
        'Export Data',
        `Data exported successfully.\n\nSettings: ${JSON.stringify(exportData, null, 2)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear all data
              await AsyncStorage.clear();
              
              // Navigate to login or show login screen
              Alert.alert('Logged Out', 'You have been successfully logged out.');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = ({ icon, title, description, value, onValueChange, type = 'switch' }) => (
    <List.Item
      title={title}
      description={description}
      left={(props) => (
        <List.Icon
          {...props}
          icon={icon}
        />
      )}
      right={() => (
        type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            color={theme.colors.primary}
          />
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        )
      )}
      onPress={type === 'button' ? onValueChange : undefined}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Profile */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Profile</Title>
          {user ? (
            <View style={styles.userInfo}>
              <MaterialCommunityIcons
                name="account-circle"
                size={48}
                color={theme.colors.primary}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user.email || 'user@example.com'}</Text>
                <Text style={styles.userRole}>{user.role || 'User'}</Text>
              </View>
            </View>
          ) : (
            <Paragraph>No user information available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          
          {renderSettingItem({
            icon: 'bell',
            title: 'Push Notifications',
            description: 'Receive notifications for asset updates',
            value: settings.notifications,
            onValueChange: (value) => handleSettingChange('notifications', value),
          })}
          
          <Divider />
          
          {renderSettingItem({
            icon: 'map-marker',
            title: 'Location Services',
            description: 'Allow app to access your location',
            value: settings.location,
            onValueChange: (value) => handleSettingChange('location', value),
          })}
          
          <Divider />
          
          {renderSettingItem({
            icon: 'theme-light-dark',
            title: 'Dark Mode',
            description: 'Use dark theme (coming soon)',
            value: settings.darkMode,
            onValueChange: (value) => handleSettingChange('darkMode', value),
          })}
          
          <Divider />
          
          {renderSettingItem({
            icon: 'sync',
            title: 'Auto Sync',
            description: 'Automatically sync data when online',
            value: settings.autoSync,
            onValueChange: (value) => handleSettingChange('autoSync', value),
          })}
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Data Management</Title>
          
          <List.Item
            title="Sync Offline Data"
            description={`${syncStatus === 'syncing' ? 'Syncing...' : 'Sync pending offline actions'}`}
            left={(props) => (
              <List.Icon
                {...props}
                icon={
                  syncStatus === 'syncing' ? 'sync' : 
                  syncStatus === 'success' ? 'check-circle' :
                  syncStatus === 'error' ? 'alert-circle' : 'sync'
                }
              />
            )}
            right={() => (
              syncStatus === 'syncing' ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleSyncOfflineData}
                  disabled={syncStatus !== 'idle'}
                  compact
                >
                  Sync
                </Button>
              )
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Clear Cache"
            description="Clear all cached data"
            left={(props) => (
              <List.Icon
                {...props}
                icon="delete-sweep"
              />
            )}
            right={() => (
              <Button
                mode="outlined"
                onPress={handleClearCache}
                compact
              >
                Clear
              </Button>
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Export Data"
            description="Export your data for backup"
            left={(props) => (
              <List.Icon
                {...props}
                icon="export"
              />
            )}
            right={() => (
              <Button
                mode="outlined"
                onPress={handleExportData}
                compact
              >
                Export
              </Button>
            )}
          />
        </Card.Content>
      </Card>

      {/* API Configuration */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>API Configuration</Title>
          
          <List.Item
            title="API Key"
            description="Configure API key for external access"
            left={(props) => (
              <List.Icon
                {...props}
                icon="key"
              />
            )}
            right={() => (
              <Button
                mode="outlined"
                onPress={() => setShowApiKeyDialog(true)}
                compact
              >
                Set
              </Button>
            )}
          />
          
          <Divider />
          
          <List.Item
            title="API Status"
            description="Check connection to web app"
            left={(props) => (
              <List.Icon
                {...props}
                icon="wifi"
              />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.colors.secondary}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>About</Title>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => (
              <List.Icon
                {...props}
                icon="information"
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Help & Support"
            description="Get help and contact support"
            left={(props) => (
              <List.Icon
                {...props}
                icon="help-circle"
              />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            )}
            onPress={() => Alert.alert('Help', 'Help and support features coming soon.')}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={(props) => (
              <List.Icon
                {...props}
                icon="shield-account"
              />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            )}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details coming soon.')}
          />
        </Card.Content>
      </Card>

      {/* Logout */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
            icon="logout"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* API Key Dialog */}
      <Portal>
        <Dialog visible={showApiKeyDialog} onDismiss={() => setShowApiKeyDialog(false)}>
          <Dialog.Title>Set API Key</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your API key"
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowApiKeyDialog(false)}>Cancel</Button>
            <Button onPress={() => {
              // Save API key
              AsyncStorage.setItem('apiKey', apiKey);
              setShowApiKeyDialog(false);
              Alert.alert('Success', 'API key saved successfully.');
            }}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    marginTop: 8,
  },
});
