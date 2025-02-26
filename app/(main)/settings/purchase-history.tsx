import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator, Surface, IconButton, Button, Snackbar } from 'react-native-paper';
import { usePurchasesStore } from '../../../src/stores/purchasesStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
// import * as Clipboard from 'expo-clipboard';

export default function PurchaseHistoryScreen() {
  const router = useRouter();
  const { purchases, loading, error, fetchPurchases } = usePurchasesStore();
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleBack = () => {
    router.push('/settings');
  };

  const handleCopyCode = async (giftCode: string) => {
    await Clipboard.setStringAsync(giftCode);
    setShowSnackbar(true);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#ff4444" />
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // Calculate total coins spent
  const totalCoins = purchases.reduce((acc, purchase) => acc + purchase.cost, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={handleBack}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Purchase History</Text>
          </View>
          <Text style={styles.headerSubtitle}>Track your rewards redemption</Text>
        </View>

        <Surface style={styles.totalCard}>
          <MaterialCommunityIcons name="star-circle" size={24} color="#6200ee" />
          <Text style={styles.totalValue}>{totalCoins}</Text>
          <Text style={styles.totalLabel}>Total Coins Spent</Text>
        </Surface>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {purchases.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="shopping-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No purchases yet</Text>
              <Text style={styles.emptySubtext}>Visit the store to redeem your coins</Text>
            </Card.Content>
          </Card>
        ) : (
          purchases.map((purchase) => (
            <Card key={purchase.id} style={styles.purchaseCard}>
              <Card.Content>
                <View style={styles.purchaseHeader}>
                  <View style={styles.purchaseInfo}>
                    <Text style={styles.purchaseName}>{purchase.item_name}</Text>
                    <Text style={styles.purchaseDate}>
                      {new Date(purchase.purchased_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.costContainer}>
                    <MaterialCommunityIcons name="star-circle" size={20} color="#FFD700" />
                    <Text style={styles.costText}>{purchase.cost}</Text>
                  </View>
                </View>

                {purchase.gift_code && (
                  <View style={styles.giftCodeContainer}>
                    <Text style={styles.giftCodeLabel}>Gift Code:</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.giftCodeText}>{purchase.gift_code}</Text>
                      <IconButton
                        icon="content-copy"
                        size={20}
                        onPress={() => handleCopyCode(purchase.gift_code!)}
                      />
                    </View>
                  </View>
                )}

                {purchase.shipping_details && (
                  <View style={styles.shippingDetails}>
                    <MaterialCommunityIcons name="truck-delivery" size={20} color="#666" />
                    <View style={styles.shippingInfo}>
                      <Text style={styles.shippingName}>{purchase.shipping_details.name}</Text>
                      <Text style={styles.shippingAddress}>{purchase.shipping_details.address}</Text>
                      <Text style={styles.shippingMobile}>{purchase.shipping_details.mobile}</Text>
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={2000}
      >
        Code copied to clipboard!
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  totalCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 8,
  },
  totalLabel: {
    color: '#666',
    marginTop: 4,
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    marginTop: 8,
  },
  purchaseCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  purchaseDate: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 16,
    gap: 4,
  },
  costText: {
    color: '#666',
    fontWeight: 'bold',
  },
  shippingDetails: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  shippingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  shippingName: {
    fontWeight: '600',
  },
  shippingAddress: {
    color: '#666',
    marginTop: 4,
  },
  shippingMobile: {
    color: '#666',
    marginTop: 4,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  giftCodeContainer: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  giftCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  giftCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    letterSpacing: 1,
  },
}); 