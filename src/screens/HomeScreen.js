import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  List,
  Divider,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { assetAPI, analyticsAPI, offlineStorage } from '../services/api';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 0,
    checkedOut: 0,
    available: 0,
    maintenance: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to load from API first
      try {
        const [statsData, activityData] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          assetAPI.getAssets({ limit: 5, sort: 'updated_at' }),
        ]);
        
        setStats(statsData);
        setRecentActivity(activityData.assets || []);
        setOfflineMode(false);
        
        // Store data for offline use
        await offlineStorage.storeData('dashboardStats', statsData);
        await offlineStorage.storeData('recentActivity', activityData.assets || []);
      } catch (error) {
        console.log('API unavailable, loading from offline storage');
        setOfflineMode(true);
        
        // Load from offline storage
        const offlineStats = await offlineStorage.getData('dashboardStats');
        const offlineActivity = await offlineStorage.getData('recentActivity');
        
        if (offlineStats) setStats(offlineStats);
        if (offlineActivity) setRecentActivity(offlineActivity);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const QuickActionButton = ({ icon, title, onPress, color }) => (
    <Button
      mode="contained"
      icon={icon}
      onPress={onPress}
      style={[styles.quickActionButton, { backgroundColor: color }]}
      labelStyle={styles.quickActionLabel}
    >
      {title}
    </Button>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Total Assets</Title>
            <Text style={styles.statsNumber}>{stats.totalAssets}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Available</Title>
            <Text style={[styles.statsNumber, { color: theme.colors.secondary }]}>
              {stats.available}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Checked Out</Title>
            <Text style={[styles.statsNumber, { color: theme.colors.tertiary }]}>
              {stats.checkedOut}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Maintenance</Title>
            <Text style={[styles.statsNumber, { color: theme.colors.error }]}>
              {stats.maintenance}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              icon="qrcode-scan"
              title="Scan QR"
              onPress={() => navigation.navigate('Scanner')}
              color={theme.colors.primary}
            />
            <QuickActionButton
              icon="package-variant"
              title="View Assets"
              onPress={() => navigation.navigate('Assets')}
              color={theme.colors.secondary}
            />
            <QuickActionButton
              icon="clipboard-check"
              title="Check In/Out"
              onPress={() => navigation.navigate('Checkout')}
              color={theme.colors.tertiary}
            />
            <QuickActionButton
              icon="map-marker"
              title="Location"
              onPress={() => navigation.navigate('Location')}
              color={theme.colors.error}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activity</Title>
          {recentActivity.length > 0 ? (
            recentActivity.map((asset, index) => (
              <View key={asset.id || index}>
                <List.Item
                  title={asset.name || `Asset ${asset.id}`}
                  description={asset.status || 'Unknown status'}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        asset.status === 'available'
                          ? 'check-circle'
                          : asset.status === 'checked_out'
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
                      {asset.status || 'Unknown'}
                    </Chip>
                  )}
                  onPress={() => navigation.navigate('Assets')}
                />
                {index < recentActivity.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Paragraph style={styles.noActivityText}>
              No recent activity
            </Paragraph>
          )}
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    width: '48%',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickActionButton: {
    width: '48%',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
  },
  noActivityText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
});
