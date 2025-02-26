import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, TextInput, Button, Switch } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';

export default function FocusSettings() {
  const { user, updateUserPreferences } = useAuthStore();
  const [defaultDuration, setDefaultDuration] = useState(
    user?.preferences?.focus_mode_settings?.default_session_duration?.toString() || '25'
  );
  const [breakDuration, setBreakDuration] = useState(
    user?.preferences?.focus_mode_settings?.break_duration?.toString() || '5'
  );
  const [notificationSound, setNotificationSound] = useState(
    user?.preferences?.focus_mode_settings?.notification_sound || true
  );

  const handleSave = () => {
    updateUserPreferences({
      ...user?.preferences,
      focus_mode_settings: {
        default_session_duration: parseInt(defaultDuration),
        break_duration: parseInt(breakDuration),
        notification_sound: notificationSound,
      },
    });
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>Focus Mode Settings</Text>
        
        <TextInput
          label="Default Session Duration (minutes)"
          value={defaultDuration}
          onChangeText={setDefaultDuration}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Break Duration (minutes)"
          value={breakDuration}
          onChangeText={setBreakDuration}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.setting}>
          <Text>Notification Sound</Text>
          <Switch
            value={notificationSound}
            onValueChange={setNotificationSound}
          />
        </View>

        <Button 
          mode="contained"
          onPress={handleSave}
          style={styles.button}
        >
          Save Settings
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 