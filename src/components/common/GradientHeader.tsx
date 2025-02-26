import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  title: string;
  subtitle?: string;
  stats?: Array<{
    value: string | number;
    label: string;
  }>;
  style?: ViewStyle;
}

export default function GradientHeader({ title, subtitle, stats, style }: Props) {
  return (
    <LinearGradient
      colors={['#6200ee', '#9c27b0']}
      style={[styles.headerGradient, style]}
    >
      <View style={styles.header}>
        <Text variant="displayLarge" style={styles.title}>{title}</Text>
        {subtitle && (
          <Text variant="titleMedium" style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <Surface key={index} style={styles.statCard}>
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Surface>
          ))}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
}); 