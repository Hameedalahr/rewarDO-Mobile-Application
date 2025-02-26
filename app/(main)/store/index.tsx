import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, FlatList, Dimensions } from 'react-native';
import { Text, Card, Button, Portal, Dialog, TextInput, Snackbar, Menu, TouchableRipple } from 'react-native-paper';
import { useStoreStore } from '../../../src/stores/storeStore';
import { useCoinsStore } from '../../../src/stores/coinsStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

// Define image mapping
const productImages = {
  'timer.png': require('../../../assets/products/timer.png'),
  'notebook.png': require('../../../assets/products/notebook.png'),
  'headphones.png': require('../../../assets/products/headphones.png'),
  'amazon.png': require('../../../assets/products/amazon.png'),
  'bookmyshow.png': require('../../../assets/products/bookmyshow.png'),
  'aha.png': require('../../../assets/products/aha.png'),
  'udemy.png': require('../../../assets/products/udemy.png'),
  'wrogn.png': require('../../../assets/products/wrogn.png'),
  'watch.png': require('../../../assets/products/watch.png'),
  'cosmetics.png': require('../../../assets/products/cosmetics.png'),
};

interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  image_url: string;
  type: 'physical' | 'digital' | 'giftCard';
  isGiftCard?: boolean;
}

export default function StoreScreen() {
  const { items, loading, purchaseItem } = useStoreStore();
  const { coins } = useCoinsStore();
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    mobile: '',
    address: ''
  });
  const [giftCode, setGiftCode] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortedItems, setSortedItems] = useState(items);
  const [sortType, setSortType] = useState<'asc' | 'desc' | null>(null);

  const sortItems = (type: 'asc' | 'desc') => {
    const sorted = [...items].sort((a, b) => {
      if (type === 'asc') {
        return a.cost - b.cost;
      } else {
        return b.cost - a.cost;
      }
    });
    setSortedItems(sorted);
    setSortType(type);
    setSortMenuVisible(false);
  };

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const handleCopyCode = async () => {
    if (giftCode) {
      await Clipboard.setStringAsync(giftCode);
      setShowSnackbar(true);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!selectedItem) return;

      // Always require name and mobile for all purchases
      if (!userDetails.name || !userDetails.mobile) {
        alert('Please fill in your name and mobile number');
        return;
      }

      // Require address for all products except gift cards
      if (!selectedItem.isGiftCard && !userDetails.address) {
        alert('Please fill in your shipping address');
        return;
      }

      const result = await purchaseItem(
        selectedItem.id, 
        selectedItem.isGiftCard ? undefined : userDetails
      );
      
      if (result.giftCode) {
        setGiftCode(result.giftCode);
      } else {
        alert('Purchase successful!');
        setSelectedItem(null);
        setUserDetails({
          name: '',
          mobile: '',
          address: ''
        });
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.message || 'Failed to make purchase');
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <Card.Cover 
        source={productImages[item.image_url] || <MaterialCommunityIcons name="timer" size={24} color="#000" />}
        style={styles.itemImage}
      />
      <View style={styles.costBadge}>
        <MaterialCommunityIcons name="star-circle" size={16} color="#FFD700" />
        <Text style={styles.costText}>{item.cost}</Text>
      </View>
      
      <Card.Content>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        
        {coins >= item.cost ? (
          <View style={styles.unlockBadge}>
            <MaterialCommunityIcons name="lock-open" size={16} color="#4CAF50" />
            <Text style={styles.unlockText}>Available</Text>
          </View>
        ) : (
          <View style={styles.lockBadge}>
            <MaterialCommunityIcons name="lock" size={16} color="#666" />
            <Text style={styles.lockText}>
              Need {item.cost - coins} more coins
            </Text>
          </View>
        )}
        
        <Button
          mode="contained"
          onPress={() => setSelectedItem(item)}
          disabled={coins < item.cost || loading}
          style={styles.purchaseButton}
          icon={coins >= item.cost ? "cart" : "lock"}
        >
          {coins >= item.cost ? 'Purchase' : 'Locked'}
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Store</Text>
          <View style={styles.headerRight}>
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <TouchableRipple
                  onPress={() => setSortMenuVisible(true)}
                  style={styles.sortButton}
                >
                  <View style={styles.sortButtonContent}>
                    <MaterialCommunityIcons 
                      name={sortType === 'asc' ? 'sort-ascending' : sortType === 'desc' ? 'sort-descending' : 'sort'} 
                      size={20} 
                      color="white" 
                    />
                    <Text style={styles.sortButtonText}>
                      {sortType === 'asc' 
                        ? 'Price: Low to High'
                        : sortType === 'desc'
                        ? 'Price: High to Low'
                        : 'Sort by Price'}
                    </Text>
                  </View>
                </TouchableRipple>
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item 
                onPress={() => sortItems('asc')} 
                title="Price: Low to High" 
                leadingIcon={props => (
                  <MaterialCommunityIcons 
                    {...props}
                    name="sort-ascending"
                    color={sortType === 'asc' ? '#6200ee' : '#666'}
                  />
                )}
                style={styles.menuItem}
                titleStyle={sortType === 'asc' ? styles.activeMenuItemText : styles.menuItemText}
              />
              <Menu.Item 
                onPress={() => sortItems('desc')} 
                title="Price: High to Low" 
                leadingIcon={props => (
                  <MaterialCommunityIcons 
                    {...props}
                    name="sort-descending"
                    color={sortType === 'desc' ? '#6200ee' : '#666'}
                  />
                )}
                style={styles.menuItem}
                titleStyle={sortType === 'desc' ? styles.activeMenuItemText : styles.menuItemText}
              />
            </Menu>
            <View style={styles.coinsDisplay}>
              <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
              <Text style={styles.coinsText}>{coins}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
      />

      <Portal>
        <Dialog visible={!!selectedItem} onDismiss={() => {
          setSelectedItem(null);
          setGiftCode(null);
        }}>
          <Dialog.Title>Purchase Details</Dialog.Title>
          <Dialog.Content>
            {giftCode ? (
              <View style={styles.giftCodeContainer}>
                <Text style={styles.successText}>Purchase Successful!</Text>
                <Text style={styles.giftCodeLabel}>Your Gift Code:</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.giftCodeText}>{giftCode}</Text>
                </View>
                <Button 
                  mode="contained" 
                  onPress={handleCopyCode}
                  style={styles.copyButton}
                  icon="content-copy"
                >
                  Copy Code
                </Button>
                <Text style={styles.giftCodeNote}>
                  Please save this code. You can find it later in your purchase history.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.confirmText}>
                  Are you sure you want to purchase {selectedItem?.name} for {selectedItem?.cost} coins?
                </Text>
                
                <TextInput
                  label="Full Name"
                  value={userDetails.name}
                  onChangeText={name => setUserDetails(prev => ({ ...prev, name }))}
                  style={styles.input}
                />
                <TextInput
                  label="Mobile Number"
                  value={userDetails.mobile}
                  onChangeText={mobile => setUserDetails(prev => ({ ...prev, mobile }))}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                
                {!selectedItem?.isGiftCard && (
                  <TextInput
                    label="Shipping Address"
                    value={userDetails.address}
                    onChangeText={address => setUserDetails(prev => ({ ...prev, address }))}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                  />
                )}

                {selectedItem?.isGiftCard ? (
                  <Text style={styles.digitalNote}>
                    You will receive a gift code after purchase.
                  </Text>
                ) : (
                  <Text style={styles.shippingNote}>
                    Your item will be delivered to the provided address.
                  </Text>
                )}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setSelectedItem(null);
              setGiftCode(null);
            }}>
              {giftCode ? 'Close' : 'Cancel'}
            </Button>
            {!giftCode && (
              <Button 
                mode="contained" 
                onPress={handlePurchase}
                loading={loading}
              >
                Confirm Purchase
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  coinsText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  itemCard: {
    width: (Dimensions.get('window').width - 40) / 2,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    height: 150,
  },
  costBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
  },
  costText: {
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  unlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  unlockText: {
    color: '#4CAF50',
    marginLeft: 4,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  lockText: {
    color: '#666',
    marginLeft: 4,
  },
  purchaseButton: {
    marginTop: 8,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemDescription: {
    color: '#666',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 8,
  },
  digitalNote: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  giftCodeContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  giftCodeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  giftCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#6200ee',
  },
  copyButton: {
    marginTop: 16,
  },
  giftCodeNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  shippingNote: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  sortButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  menuContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 8,
    elevation: 4,
  },
  menuItem: {
    height: 48,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  activeMenuItemText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: 'bold',
  },
}); 