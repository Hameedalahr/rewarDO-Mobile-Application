import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Task } from '../../types/task';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>{task.title}</Text>
        {task.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {task.description}
          </Text>
        )}
        <Chip 
          icon="flag" 
          style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) }]}
        >
          Priority {task.priority}
        </Chip>
      </Card.Content>
    </Card>
  );
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return '#ff4444';
    case 2:
      return '#ff8c00';
    case 3:
      return '#ffd700';
    case 4:
      return '#90ee90';
    default:
      return '#e0e0e0';
  }
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
}); 