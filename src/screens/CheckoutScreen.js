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

export default function CheckoutScreen({ navigation, route }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [action, setAction] = useState('checkout'); // 'checkout' or 'checkin'
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [notes, setNotes] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  // Check if asset was passed from navigation
  useEffect(() => {
    if (route.params?.asset) {
      setSelectedAsset(route.params.asset);
      setAction(route.params.asset.status === 'available' ? 'checkout' : 'checkin');
    }
  }, [route.params]);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery]);

  const loadAssets = async () => {
    try {
      // Try to load from API first
      try {
        const response = await assetAPI.getAssets();
        const assetsData = response.assets || [];
        setAssets(assetsData);
        setOfflineMode(false);
        
        // Store for offline use
        await offlineStorage.storeData('assets', assetsData);
      } catch (_error) {
        console.log('API unavailable, loading from offline storage');
        setOfflineMode(true);
        
        // Load from offline storage
        const offlineAssets = await offlineStorage.getData('assets');
        if (offlineAssets) setAssets(offlineAssets);
      }
    } catch (_error) {
      console.error('Error loading assets:', error);
    }
  };

  const filterAssets = useCallback(() => {=> {
    let filtered = assets;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(asset =>
        asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.asset_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by action type
    if (action === 'checkout') {
      filtered = filtered.filter(asset => asset.status === 'available');
    } else {
      filtered = filtered.filter(asset => asset.status === 'checked_out');
    }

    setFilteredAssets(filtered);
  }, [searchQuery, assets]);

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location access is needed to record where the asset is being checked in/out.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
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

      setLocation({
        latitude,
        longitude,
        address: locationString,
      });

      Alert.alert(
        'Location Captured',
        `Location: ${locationString}`,
        [{ text: 'OK' }]
      );
    } catch (_error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get current location. You can still proceed without location.',
        [{ text: 'OK' }]
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setAction(asset.status === 'available' ? 'checkout' : 'checkin');
  };

  const handleCheckInOut = async () => {
    if (!selectedAsset) {
      Alert.alert('Error', 'Please select an asset first.');
      return;
    }

    try {
      setLoading(true);

      const actionData = {
        assetId: selectedAsset.id,
        action: action,
        location: location?.address || 'Location not specified',
        notes: notes,
        timestamp: new Date().toISOString(),
      };

      // Try to perform action via API
      try {
        await assetAPI.checkInOut(selectedAsset.id, action, location?.address);
        
        Alert.alert(
          'Success',
          `Asset ${action === 'checkout' ? 'checked out' : 'checked in'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedAsset(null);
                setLocation(null);
                setNotes('');
                loadAssets(); // Refresh assets list
              },
            },
          ]
        );
      } catch (_error) {
        console.log('API unavailable, storing action for later sync');
        
        // Store action for offline sync
        await offlineStorage.storeOfflineAction(actionData);
        
        Alert.alert(
          'Action Queued',
          `Asset ${action === 'checkout' ? 'checkout' : 'checkin'} has been queued for sync when connection is restored.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedAsset(null);
                setLocation(null);
                setNotes('');
              },
            },
          ]
        );
      }
    } catch (_error) {
      console.error('Error performing check in/out:', error);
      Alert.alert(
        'Error',
        'Failed to perform action. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderAssetItem = ({ item }) => (
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
      onPress={() => handleAssetSelect(item)}
      style={[
        styles.assetItem,
        selectedAsset?.id === item.id && { backgroundColor: theme.colors.primaryContainer }
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Offline Mode Indicator */}
      {offlineMode && (
        <Card style={[styles.offlineCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Card.Content>
            <View style={styles.offlineHeader}>
              <MaterialCommunityIcons name="wifi-off" size={20} color={theme.colors.tertiary} />
              <Text style={[styles.offlineText, { color: theme.colors.tertiary }]}>
                Offline Mode - Actions will be queued
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Action Toggle */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Title>Select Action</Title>
          <View style={styles.actionToggle}>
            <Button
              mode={action === 'checkout' ? 'contained' : 'outlined'}
              onPress={() => setAction('checkout')}
              style={styles.actionButton}
            >
              Check Out
            </Button>
            <Button
              mode={action === 'checkin' ? 'contained' : 'outlined'}
              onPress={() => setAction('checkin')}
              style={styles.actionButton}
            >
              Check In
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Asset Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Select Asset</Title>
          <Searchbar
            placeholder={`Search assets to ${action === 'checkout' ? 'check out' : 'check in'}...`}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <ScrollView style={styles.assetsList}>
            {filteredAssets.map((asset, index) => (
              <View key={asset.id || index}>
                {renderAssetItem({ item: asset })}
                {index < filteredAssets.length - 1 && <Divider />}
              </View>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Selected Asset Details */}
      {selectedAsset && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Selected Asset</Title>
            <View style={styles.selectedAssetInfo}>
              <Text style={styles.assetName}>{selectedAsset.name || `Asset ${selectedAsset.id}`}</Text>
              <Text style={styles.assetId}>{selectedAsset.asset_id || selectedAsset.id}</Text>
              <Chip mode="outlined" style={styles.statusChip}>
                {selectedAsset.status || 'Unknown'}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Location and Notes */}
      {selectedAsset && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Additional Information</Title>
            
            {/* Location */}
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              {location ? (
                <View style={styles.locationInfo}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
                  <Text style={styles.locationText}>{location.address}</Text>
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={getCurrentLocation}
                  loading={gettingLocation}
                  icon="map-marker"
                  style={styles.locationButton}
                >
                  {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
                </Button>
              )}
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                mode="outlined"
                placeholder="Add any notes about this action..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Action Button */}
      {selectedAsset && (
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleCheckInOut}
              loading={loading}
              disabled={loading}
              style={styles.actionButton}
              icon={action === 'checkout' ? 'account-arrow-right' : 'account-arrow-left'}
            >
              {loading ? 'Processing...' : `${action === 'checkout' ? 'Check Out' : 'Check In'} Asset`}
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
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
  actionCard: {
    marginBottom: 16,
  },
  actionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
  },
  assetsList: {
    maxHeight: 200,
  },
  assetItem: {
    borderRadius: 8,
  },
  selectedAssetInfo: {
    marginTop: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assetId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  locationSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationButton: {
    marginTop: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesInput: {
    marginTop: 4,
  },
});
