import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import * as Location from 'expo-location';
import { assetAPI, offlineStorage } from '../services/api';

export default function LocationScreen({ navigation }) {
  const theme = useTheme();
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nearbyAssets, setNearbyAssets] = useState([]);
  const [geofencingEnabled, setGeofencingEnabled] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  useEffect(() => {
    if (location) {
      loadNearbyAssets();
      loadLocationHistory();
    }
  }, [location]);

  const checkLocationPermission = useCallback(async () => { () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (_error) {
      console.error('Error checking location permission:', error);
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Location access is needed to show nearby assets and enable geofencing features.',
          [{ text: 'OK' }]
        );
      }
    } catch (_error) {
      console.error('Error requesting location permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const address = reverseGeocode[0];
      const locationString = address
        ? `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim()
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const locationData = {
        latitude,
        longitude,
        address: locationString,
        timestamp: new Date().toISOString(),
        accuracy: currentLocation.coords.accuracy,
      };

      setLocation(locationData);
      
      // Store location for offline use
      await offlineStorage.storeData('lastLocation', locationData);
    } catch (_error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get current location. Please check your GPS settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyAssets = useCallback(async () => {) => {
    try {
      // Try to load from API first
      try {
        const response = await assetAPI.getAssets({
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 1000, // 1km radius
        });
        
        setNearbyAssets(response.assets || []);
        setOfflineMode(false);
        
        // Store for offline use
        await offlineStorage.storeData('nearbyAssets', response.assets || []);
      } catch (_error) {
        console.log('API unavailable, loading from offline storage');
        setOfflineMode(true);
        
        // Load from offline storage
        const offlineAssets = await offlineStorage.getData('nearbyAssets');
        if (offlineAssets) setNearbyAssets(offlineAssets);
      }
    } catch (_error) {
      console.error('Error loading nearby assets:', error);
    }
  }, [location]);

  const loadLocationHistory = async () => {
    try {
      // Try to load from API first
      try {
        const response = await assetAPI.getAssets({
          location_history: true,
          limit: 10,
        });
        
        setLocationHistory(response.location_history || []);
        setOfflineMode(false);
        
        // Store for offline use
        await offlineStorage.storeData('locationHistory', response.location_history || []);
      } catch (_error) {
        console.log('API unavailable, loading from offline storage');
        setOfflineMode(true);
        
        // Load from offline storage
        const offlineHistory = await offlineStorage.getData('locationHistory');
        if (offlineHistory) setLocationHistory(offlineHistory);
      }
    } catch (_error) {
      console.error('Error loading location history:', error);
    }
  };

  const toggleGeofencing = () => {
    if (!geofencingEnabled) {
      Alert.alert(
        'Enable Geofencing',
        'Geofencing will notify you when assets enter or leave designated areas. This feature requires background location access.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setGeofencingEnabled(true);
              // Here you would implement actual geofencing logic
              Alert.alert('Geofencing Enabled', 'You will now receive notifications when assets move in or out of designated areas.');
            },
          },
        ]
      );
    } else {
      setGeofencingEnabled(false);
      Alert.alert('Geofencing Disabled', 'You will no longer receive geofencing notifications.');
    }
  };

  const renderNearbyAsset = ({ item }) => (
    <List.Item
      title={item.name || `Asset ${item.id}`}
      description={`${item.asset_id || item.id} • ${item.category || 'No category'}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon={
            item.status === 'available'
              ? 'check-circle'
              : item.status === 'checked_out'
              ? 'account-arrow-right'
              : 'wrench'
          }
        />
      )}
      right={() => (
        <Chip
          mode="outlined"
          textStyle={{ fontSize: 12 }}
        >
          {item.status || 'Unknown'}
        </Chip>
      )}
      onPress={() => navigation.navigate('Assets')}
    />
  );

  const renderLocationHistoryItem = ({ item }) => (
    <List.Item
      title={item.asset_name || `Asset ${item.asset_id}`}
      description={`${item.location} • ${new Date(item.timestamp).toLocaleDateString()}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon="map-marker"
        />
      )}
      right={() => (
        <Text style={styles.historyTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      )}
    />
  );

  return (
    <ScrollView style={styles.container}>
      {/* Offline Mode Indicator */}
      {offlineMode && (
        <Card style={[styles.offlineCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Card.Content>
            <View style={styles.offlineHeader}>
              <MaterialCommunityIcons name="wifi-off" size={20} color={theme.colors.tertiary} />
              <Text style={[styles.offlineText, { color: theme.colors.tertiary }]}>
                Offline Mode - Location data may be outdated
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Location Permission Status */}
      {locationPermission !== 'granted' && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.permissionHeader}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={48}
                color={theme.colors.error}
              />
              <Title style={styles.permissionTitle}>Location Access Required</Title>
              <Paragraph style={styles.permissionText}>
                Enable location access to see nearby assets, track locations, and use geofencing features.
              </Paragraph>
              <Button
                mode="contained"
                onPress={requestLocationPermission}
                loading={loading}
                style={styles.permissionButton}
              >
                Enable Location Access
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Current Location */}
      {location && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Current Location</Title>
            <View style={styles.locationInfo}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationAddress}>{location.address}</Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationAccuracy}>
                  Accuracy: ±{location.accuracy.toFixed(1)}m
                </Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={getCurrentLocation}
              loading={loading}
              icon="map-marker-refresh"
              style={styles.refreshButton}
            >
              Refresh Location
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Geofencing Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Geofencing</Title>
          <Paragraph style={styles.geofencingText}>
            Get notified when assets enter or leave designated areas.
          </Paragraph>
          <View style={styles.geofencingToggle}>
            <Text>Enable Geofencing</Text>
            <Switch
              value={geofencingEnabled}
              onValueChange={toggleGeofencing}
              color={theme.colors.primary}
            />
          </View>
          {geofencingEnabled && (
            <View style={styles.geofencingInfo}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.geofencingInfoText}>
                Geofencing is active. You&apos;ll receive notifications for asset movements.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Nearby Assets */}
      {location && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Nearby Assets</Title>
            <Paragraph style={styles.nearbyText}>
              Assets within 1km of your current location
            </Paragraph>
            {nearbyAssets.length > 0 ? (
              nearbyAssets.map((asset, index) => (
                <View key={asset.id || index}>
                  {renderNearbyAsset({ item: asset })}
                  {index < nearbyAssets.length - 1 && <Divider />}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.emptyStateText}>No assets found nearby</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Location History */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Location Updates</Title>
          <Paragraph style={styles.historyText}>
            Recent asset location changes
          </Paragraph>
          {locationHistory.length > 0 ? (
            locationHistory.map((item, index) => (
              <View key={index}>
                {renderLocationHistoryItem({ item })}
                {index < locationHistory.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="history"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.emptyStateText}>No recent location updates</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Future Features */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Coming Soon</Title>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="map"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.featureText}>Interactive Map View</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="routes"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.featureText}>Asset Movement Tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="bell-ring"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.featureText}>Smart Location Alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.featureText}>Location Analytics</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  offlineCard: {
    marginBottom: 16,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
  },
  permissionHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  permissionTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  permissionButton: {
    alignSelf: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#999',
  },
  refreshButton: {
    alignSelf: 'center',
  },
  geofencingText: {
    marginBottom: 16,
    color: '#666',
  },
  geofencingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  geofencingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryContainer,
    padding: 12,
    borderRadius: 8,
  },
  geofencingInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    flex: 1,
  },
  nearbyText: {
    marginBottom: 16,
    color: '#666',
  },
  historyText: {
    marginBottom: 16,
    color: '#666',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
  },
});
