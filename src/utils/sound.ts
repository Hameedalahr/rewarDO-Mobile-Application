import { Audio } from 'expo-av';

export async function playAchievementSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/achievement.mp3')
    );
    await sound.playAsync();
  } catch (error) {
    console.error('Error playing sound:', error);
  }
} 