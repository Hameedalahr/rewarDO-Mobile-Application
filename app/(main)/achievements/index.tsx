import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Text, Card, ProgressBar, Button, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAchievementsStore } from '../../../src/stores/achievementsStore';
import { useCoinsStore } from '../../../src/stores/coinsStore';
import { LinearGradient } from 'expo-linear-gradient';

// Update the icon type definition to include all used icons
type IconName = 
  | 'star' 
  | 'trophy' 
  | 'timer' 
  | 'check-circle' 
  | 'calendar-check' 
  | 'trophy-outline' 
  | 'gift' 
  | 'clock-outline' 
  | 'star-circle' 
  | 'checkbox-marked-circle'
  | 'clock-check'
  | 'timer-outline'
  | 'rocket'
  | 'weather-sunny'
  | 'calendar-weekend'
  | 'crown'
  | 'fire';

export default function AchievementsScreen() {
  const { achievements, loading, fetchAchievements, claimReward } = useAchievementsStore();
  const { addCoins, fetchCoins } = useCoinsStore();
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [claimingRewards, setClaimingRewards] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchAchievements();
    fetchCoins(); // Fetch initial coins balance
  }, []);

  const calculateProgress = (achievement) => {
    const progress = (achievement.current_value / achievement.requirement) * 100;
    if (progress >= 100 && !achievement.completed) {
      // Mark achievement as completed if progress is 100% but not marked as completed
      achievement.completed = true;
    }
    return Math.min(progress, 100);
  };

  const isAchievementCompleted = (achievement) => {
    return achievement.current_value >= achievement.requirement;
  };

  const handleClaimReward = async (achievement) => {
    try {
      // Set claiming state for this specific achievement
      setClaimingRewards(prev => ({
        ...prev,
        [achievement.id]: true
      }));
      
      if (!isAchievementCompleted(achievement)) {
        console.log('Achievement not completed yet');
        return;
      }

      // First add the coins to the wallet
      await addCoins(achievement.reward);
      
      // Then mark the achievement as claimed
      await claimReward(achievement.id);
      
      // Show the reward dialog
      setSelectedAchievement(achievement);
      setShowRewardDialog(true);

      // Refresh both achievements and coins
      await Promise.all([
        fetchAchievements(),
        fetchCoins()
      ]);

    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward. Please try again.');
    } finally {
      // Clear claiming state for this specific achievement
      setClaimingRewards(prev => ({
        ...prev,
        [achievement.id]: false
      }));
    }
  };

  const getAchievementIcon = (type: string): IconName => {
    switch (type) {
      case 'focus':
        return 'clock-check';
      case 'task':
        return 'check-circle';
      case 'streak':
        return 'fire';
      case 'milestone':
        return 'trophy';
      case 'sessions':
        return 'timer-outline';
      case 'focus_time':
        return 'clock-outline';
      case 'daily_tasks':
        return 'rocket';
      case 'coins':
        return 'star-circle';
      default:
        return 'trophy-outline';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>Complete tasks to earn rewards</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {achievements.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trophy-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No achievements yet</Text>
            <Text style={styles.emptySubtext}>Complete tasks and focus sessions to earn achievements</Text>
          </View>
        ) : (
          achievements.map((achievement) => (
            <Animated.View key={achievement.id}>
              <Card style={[
                styles.achievementCard,
                isAchievementCompleted(achievement) && styles.completedCard
              ]}>
                <Card.Content>
                  <View style={styles.achievementHeader}>
                    <MaterialCommunityIcons
                      name={getAchievementIcon(achievement.type)}
                      size={32}
                      color={isAchievementCompleted(achievement) ? '#FFD700' : '#666'}
                    />
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDesc}>{achievement.description}</Text>
                    </View>
                  </View>
                  
                  <ProgressBar
                    progress={calculateProgress(achievement) / 100}
                    color={isAchievementCompleted(achievement) ? '#FFD700' : '#6200ee'}
                    style={styles.progressBar}
                  />

                  <View style={styles.rewardSection}>
                    <View style={styles.rewardInfo}>
                      <View style={styles.coinContainer}>
                        <MaterialCommunityIcons 
                          name="star-circle"
                          size={20} 
                          color="#FFD700"
                          style={styles.rewardIcon}
                        />
                        <Text style={styles.rewardText}>{achievement.reward}</Text>
                      </View>
                    </View>
                    
                    {isAchievementCompleted(achievement) && !achievement.reward_claimed && (
                      <Button
                        mode="contained"
                        onPress={() => handleClaimReward(achievement)}
                        style={styles.claimButton}
                        icon="gift"
                        loading={claimingRewards[achievement.id]}
                        disabled={claimingRewards[achievement.id]}
                        labelStyle={styles.claimButtonLabel}
                      >
                        {claimingRewards[achievement.id] ? 'Claiming...' : 'Claim Reward'}
                      </Button>
                    )}
                    
                    {isAchievementCompleted(achievement) && achievement.reward_claimed && (
                      <View style={styles.claimedContainer}>
                        <MaterialCommunityIcons 
                          name="check-circle"
                          size={20} 
                          color="#4CAF50"
                        />
                        <Text style={styles.claimedText}>Reward Claimed</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.progressText}>
                    Progress: {achievement.current_value} / {achievement.requirement}
                  </Text>
                </Card.Content>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showRewardDialog}
          onDismiss={() => setShowRewardDialog(false)}
        >
          <Dialog.Content>
            <View style={styles.rewardDialog}>
              <MaterialCommunityIcons name="trophy" size={60} color="#FFD700" />
              <Text style={styles.rewardDialogTitle}>Congratulations!</Text>
              <Text style={styles.rewardDialogText}>
                You've earned {selectedAchievement?.reward} coins for completing:
              </Text>
              <Text style={styles.rewardDialogAchievement}>
                {selectedAchievement?.title}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRewardDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    padding: 16,
  },
  achievementCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementInfo: {
    marginLeft: 16,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  achievementDesc: {
    color: '#2c2c2c',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  completedCard: {
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    marginRight: 4,
  },
  rewardText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  claimButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    elevation: 2,
  },
  claimButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
  },
  claimedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  claimedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  rewardDialog: {
    alignItems: 'center',
    padding: 16,
  },
  rewardDialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#6200ee',
  },
  rewardDialogText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardDialogAchievement: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
}); 