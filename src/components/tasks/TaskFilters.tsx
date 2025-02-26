import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface Props {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
}

export default function TaskFilters({ 
  selectedFilter, 
  onFilterChange,
  selectedSort,
  onSortChange 
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>Filter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedFilter === 'all'}
            onPress={() => onFilterChange('all')}
            style={styles.chip}
          >
            All
          </Chip>
          <Chip
            selected={selectedFilter === 'today'}
            onPress={() => onFilterChange('today')}
            style={styles.chip}
          >
            Today
          </Chip>
          <Chip
            selected={selectedFilter === 'upcoming'}
            onPress={() => onFilterChange('upcoming')}
            style={styles.chip}
          >
            Upcoming
          </Chip>
          <Chip
            selected={selectedFilter === 'completed'}
            onPress={() => onFilterChange('completed')}
            style={styles.chip}
          >
            Completed
          </Chip>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>Sort By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedSort === 'dueDate'}
            onPress={() => onSortChange('dueDate')}
            style={styles.chip}
          >
            Due Date
          </Chip>
          <Chip
            selected={selectedSort === 'priority'}
            onPress={() => onSortChange('priority')}
            style={styles.chip}
          >
            Priority
          </Chip>
          <Chip
            selected={selectedSort === 'created'}
            onPress={() => onSortChange('created')}
            style={styles.chip}
          >
            Created
          </Chip>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#666',
  },
  chip: {
    marginHorizontal: 4,
    marginLeft: 12,
  },
}); 