import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, List, Avatar, Portal, Dialog, TextInput, Card, Divider, IconButton } from 'react-native-paper';
// import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/stores/authStore';
import { supabase } from '../../../src/services/supabase/supabaseClient';
import GradientHeader from '../../../src/components/common/GradientHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePurchasesStore, Purchase } from '../../../src/stores/purchasesStore';
import { useCoinsStore } from '../../../src/stores/coinsStore';
import { useRouter } from 'expo-router';
import { useStatisticsStore } from '../../../src/stores/statisticsStore';

export default function SettingsScreen() {
  const { user, updateUserProfile, signOut } = useAuthStore();
  const { purchases, fetchPurchases } = usePurchasesStore();
  const { coins } = useCoinsStore();
  const router = useRouter();
  const { stats, fetchStats } = useStatisticsStore();
  const [loading, setLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newName, setNewName] = useState(user?.full_name || '');

  useEffect(() => {
    fetchStats();
    fetchPurchases();
  }, []);

  const handleImagePick = async () => {
    try {
      setLoading(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const file = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `${Date.now()}.jpg`,
        };

        const formData = new FormData();
        formData.append('avatar', file as any);

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`${user?.id}/${file.name}`, formData);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${user?.id}/${file.name}`);

        await updateUserProfile({
          avatar_url: publicUrl
        });
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      alert(error.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    try {
      setLoading(true);
      await updateUserProfile({
        full_name: newName
      });
      setShowNameDialog(false);
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPurchase = (purchase: Purchase) => (
    <View key={purchase.id} style={styles.purchaseItem}>
      <View style={styles.purchaseInfo}>
        <Text style={styles.purchaseName}>{purchase.item_name}</Text>
        <Text style={styles.purchaseDate}>
          {new Date(purchase.purchased_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.purchaseCost}>{purchase.cost} coins</Text>
      {purchase.shipping_details && (
        <Text style={styles.shippingDetails}>
          Shipping to: {purchase.shipping_details.name}
        </Text>
      )}
      {purchase !== purchases[purchases.length - 1] && <Divider style={styles.divider} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Profile"
        subtitle="Manage your account"
      />
      <View style={styles.headerIconContainer}>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => router.push('/settings/purchase-history')}
        >
          <MaterialCommunityIcons name="history" size={24} color="#fff" />
          <Text style={styles.historyText}>Your Purchases</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <Avatar.Icon 
                size={80} 
                icon="account"
                style={styles.avatar}
              />
            )}
            <Button 
              mode="outlined" 
              onPress={handleImagePick}
              loading={loading}
              style={styles.changePhotoButton}
            >
              Change Photo
            </Button>
          </View>

          <List.Section style={styles.profileList}>
            <List.Item
              title="Name"
              description={user?.full_name}
              left={props => <List.Icon {...props} icon="account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowNameDialog(true)}
            />
            <List.Item
              title="Email"
              description={user?.email}
              left={props => <List.Icon {...props} icon="email" />}
            />
            <List.Item
              title="Store"
              description={`${coins} coins available`}
              left={props => <List.Icon {...props} icon="store" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/store')}
            />
          </List.Section>
        </View>

        <Card style={styles.section}>
          <Card.Title 
            title="Streaks & Stats" 
            left={(props) => <MaterialCommunityIcons name="fire" size={24} color="#6200ee" />}
          />
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="fire" size={24} color="#FF9800" />
                <Text style={styles.statValue}>{stats.streak_days}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="trophy" size={24} color="#FFC107" />
                <Text style={styles.statValue}>{stats.total_sessions}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{stats.total_focus_minutes}</Text>
                <Text style={styles.statLabel}>Minutes Focused</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.section, { marginTop: 16 }]}>
          <Card.Title 
            title="Account" 
            left={(props) => <MaterialCommunityIcons name="account-cog" size={24} color="#6200ee" />}
          />
          <Card.Content>
            <Button 
              mode="contained" 
              onPress={signOut}
              style={styles.logoutButton}
              icon="logout"
              buttonColor="#FF5252"
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showNameDialog} onDismiss={() => setShowNameDialog(false)}>
          <Dialog.Title>Update Name</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNameDialog(false)}>Cancel</Button>
            <Button 
              onPress={handleNameUpdate}
              loading={loading}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    backgroundColor: '#fff',
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  changePhotoButton: {
    marginTop: 8,
  },
  profileList: {
    backgroundColor: '#fff',
  },
  section: {
    margin: 16,
    elevation: 2,
  },
  purchaseItem: {
    marginVertical: 8,
  },
  purchaseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  purchaseDate: {
    color: '#666',
    fontSize: 14,
  },
  purchaseCost: {
    color: '#6200ee',
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  shippingDetails: {
    color: '#666',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginVertical: 8,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  headerIconContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  historyText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});