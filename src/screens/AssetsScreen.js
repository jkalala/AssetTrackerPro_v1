import React, { useState, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { assetAPI, offlineStorage } from '../services/api';

export default function AssetsScreen({ navigation }) {
  const theme = useTheme();
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, selectedCategory, sortBy]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // Try to load from API first
      try {
        const response = await assetAPI.getAssets();
        const assetsData = response.assets || [];
        setAssets(assetsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(assetsData.map(asset => asset.category).filter(Boolean))];
        setCategories(uniqueCategories);
        
        setOfflineMode(false);
        
        // Store for offline use
        await offlineStorage.storeData('assets', assetsData);
        await offlineStorage.storeData('categories', uniqueCategories);
      } catch (_error) {
        console.log('API unavailable, loading from offline storage');
        setOfflineMode(true);
        
        // Load from offline storage
        const offlineAssets = await offlineStorage.getData('assets');
        const offlineCategories = await offlineStorage.getData('categories');
        
        if (offlineAssets) setAssets(offlineAssets);
        if (offlineCategories) setCategories(offlineCategories);
      }
    } catch (_error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  };

  const filterAssets = useCallback(() => {=> {
    let filtered = [...assets];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(asset =>
        asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.asset_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    // Sort assets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'date':
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        default:
          return 0;
      }
    });

    setFilteredAssets(filtered);
  }, [searchQuery, selectedCategory, assets]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return theme.colors.secondary;
      case 'checked_out':
        return theme.colors.tertiary;
      case 'maintenance':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const _getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return 'check-circle';
      case 'checked_out':
        return 'account-arrow-right';
      case 'maintenance':
        return 'wrench';
      default:
        return 'help-circle';
    }
  };

  const renderAssetItem = ({ item }) => (
    <Card style={styles.assetCard} onPress={() => handleAssetPress(item)}>
      <Card.Content>
        <View style={styles.assetHeader}>
          <View style={styles.assetInfo}>
            <Title style={styles.assetTitle}>{item.name || `Asset ${item.id}`}</Title>
            <Paragraph style={styles.assetId}>{item.asset_id || item.id}</Paragraph>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.status || 'Unknown'}
          </Chip>
        </View>
        
        {item.description && (
          <Paragraph style={styles.assetDescription} numberOfLines={2}>
            {item.description}
          </Paragraph>
        )}
        
        <View style={styles.assetDetails}>
          {item.category && (
            <Chip mode="outlined" style={styles.categoryChip}>
              {item.category}
            </Chip>
          )}
          {item.location && (
            <Chip mode="outlined" style={styles.locationChip}>
              <MaterialCommunityIcons name="map-marker" size={16} />
              {item.location}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const handleAssetPress = (asset) => {
    // Navigate to asset details or show quick actions
    Alert.alert(
      asset.name || `Asset ${asset.id}`,
      `Status: ${asset.status}\nCategory: ${asset.category || 'N/A'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check In/Out', onPress: () => navigation.navigate('Checkout', { asset }) },
        { text: 'View Details', onPress: () => navigation.navigate('Assets') },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="package-variant"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyStateTitle}>No Assets Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedCategory !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Assets will appear here once added to the system'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline Mode Indicator */}
      {offlineMode && (
        <Card style={[styles.offlineCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Card.Content>
            <View style={styles.offlineHeader}>
              <MaterialCommunityIcons name="wifi-off" size={20} color={theme.colors.tertiary} />
              <Text style={[styles.offlineText, { color: theme.colors.tertiary }]}>
                Offline Mode - Data may be outdated
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Search and Filters */}
      <Card style={styles.searchCard}>
        <Card.Content>
          <Searchbar
            placeholder="Search assets..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <View style={styles.filtersContainer}>
            <View style={styles.categoryFilters}>
              <Chip
                mode={selectedCategory === 'all' ? 'flat' : 'outlined'}
                onPress={() => setSelectedCategory('all')}
                style={styles.categoryChip}
              >
                All
              </Chip>
              {categories.map(category => (
                <Chip
                  key={category}
                  mode={selectedCategory === category ? 'flat' : 'outlined'}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.categoryChip}
                >
                  {category}
                </Chip>
              ))}
            </View>
            
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <IconButton
                  icon="sort"
                  onPress={() => setSortMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => { setSortBy('name'); setSortMenuVisible(false); }}
                title="Sort by Name"
              />
              <Menu.Item
                onPress={() => { setSortBy('status'); setSortMenuVisible(false); }}
                title="Sort by Status"
              />
              <Menu.Item
                onPress={() => { setSortBy('category'); setSortMenuVisible(false); }}
                title="Sort by Category"
              />
              <Menu.Item
                onPress={() => { setSortBy('date'); setSortMenuVisible(false); }}
                title="Sort by Date"
              />
            </Menu>
          </View>
        </Card.Content>
      </Card>

      {/* Assets List */}
      <FlatList
        _data ={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  offlineCard: {
    margin: 16,
    marginBottom: 8,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
  },
  searchCard: {
    margin: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  assetCard: {
    marginBottom: 12,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assetInfo: {
    flex: 1,
  },
  assetTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  assetId: {
    fontSize: 12,
    color: '#666',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  assetDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  assetDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  locationChip: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 32,
  },
});
