import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView, TouchableWithoutFeedback } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getTasksRealtime, deleteTask as deleteTaskFromFirestore, toggleComplete as toggleCompleteInFirestore } from '../services/firestore';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
  dateTime?: string;
  deadline?: string;
  priority?: string;
  category?: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

export default function HomeScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority'>('deadline');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      console.log('No user logged in');
      setTasks([]);
      return;
    }
    
    console.log('Setting up tasks listener for user:', user.uid);
    const unsubscribe = getTasksRealtime((tasks: Task[]) => {
      console.log('Tasks updated:', tasks.length);
      setTasks(tasks);
    });
    
    return () => {
      console.log('Unsubscribing from tasks');
      unsubscribe();
    };
  }, []);

  const formatDeadline = (deadlineStr: string): string => {
    try {
      const date = new Date(deadlineStr);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return 'Overdue';
      } else if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Tomorrow';
      } else if (diffDays <= 7) {
        return `In ${diffDays} days`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch {
      return '';
    }
  };

  const getEncouragingMessage = () => {
    const messages = [
      "🎉 Awesome! You completed a task!",
      "✨ Great job! Keep up the momentum!",
      "🌟 Well done! You're making progress!",
      "💪 Excellent! You're on fire!",
      "🎯 Nice work! One step closer to your goals!",
      "🚀 Fantastic! You're unstoppable!",
      "⭐ Amazing! You're doing great!",
      "🏆 Outstanding! Keep it up!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const toggleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      await toggleCompleteInFirestore(taskId, completed);
      
      // Show encouraging message when task is completed
      if (completed) {
        setTimeout(() => {
          Alert.alert(
            "Task Completed! 🎉",
            getEncouragingMessage(),
            [{ text: "Keep Going!", style: "default" }]
          );
        }, 300);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteTaskHandler = async (taskId: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTaskFromFirestore(taskId);
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await auth().signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error: any) {
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
  ];

  const sortOptions = [
    { label: 'Deadline', value: 'deadline' },
    { label: 'Priority', value: 'priority' },
  ];

  const getFilterLabel = () => {
    return filterOptions.find(opt => opt.value === filter)?.label || 'All';
  };

  const getSortLabel = () => {
    return sortOptions.find(opt => opt.value === sortBy)?.label || 'Deadline';
  };

  const filteredTasks = tasks
    .filter(task => {
      // Show all tasks in all tabs (both completed and incomplete)
      if (filter === 'completed') return task.completed;
      if (filter === 'pending') return !task.completed;
      return true; // 'all' shows everything
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder: any = { High: 1, Medium: 2, Low: 3 };
        // Completed tasks at bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (priorityOrder[a.priority || 'Low'] || 3) - (priorityOrder[b.priority || 'Low'] || 3);
      }
      if (sortBy === 'deadline') {
        // Completed tasks at bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });

  return (
    <TouchableWithoutFeedback onPress={() => {
      setShowFilterDropdown(false);
      setShowSortDropdown(false);
    }}>
      <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.title}>Your Tasks</Text>
            <Text style={styles.taskCount}>{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersSection}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Filter Tasks</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowSortDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{getFilterLabel()}</Text>
            <Text style={styles.dropdownIcon}>{showFilterDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showFilterDropdown && (
            <View style={styles.dropdownMenu}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    filter === option.value && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setFilter(option.value as 'all' | 'completed' | 'pending');
                    setShowFilterDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    filter === option.value && styles.dropdownItemTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {filter === option.value && (
                    <Text style={styles.dropdownCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Sort By</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowFilterDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{getSortLabel()}</Text>
            <Text style={styles.dropdownIcon}>{showSortDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showSortDropdown && (
            <View style={styles.dropdownMenu}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    sortBy === option.value && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setSortBy(option.value as 'deadline' | 'priority');
                    setShowSortDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    sortBy === option.value && styles.dropdownItemTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Text style={styles.dropdownCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.taskCard, item.completed && styles.taskCardCompleted]}>
            <TouchableOpacity 
              style={styles.taskContent}
              onPress={() => toggleCompleteTask(item.id, !item.completed)}
              activeOpacity={0.6}
            >
              <View style={styles.checkboxWrapper}>
                <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                  {item.completed && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>
              <View style={styles.taskInfo}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.completed && (
                    <View style={styles.completedIndicator}>
                      <Text style={styles.completedIndicatorText}>Done</Text>
                    </View>
                  )}
                </View>
                {item.description && (
                  <Text style={[styles.taskDescription, item.completed && styles.taskDescriptionCompleted]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.taskFooter}>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                  {item.priority && (
                    <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) + '40' }]}>
                      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                        {item.priority}
                      </Text>
                    </View>
                  )}
                  {item.deadline && !item.completed && (
                    <View style={styles.deadlineBadge}>
                      <Text style={styles.deadlineText}>
                        {formatDeadline(item.deadline)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteTaskHandler(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap the button below to add your first task</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddTask")}
        activeOpacity={0.8}
      >
        <View style={styles.addButtonContent}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add New Task</Text>
        </View>
      </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#6366F1',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 2,
  },
  taskCount: {
    fontSize: 13,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 0,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 16,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F4FF',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  dropdownCheckmark: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 100, // Extra padding for add button
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCardCompleted: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E5E5',
    opacity: 0.85,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    flex: 1,
    paddingRight: 8,
  },
  taskTitleCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  completedIndicator: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedIndicatorText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taskDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  taskDescriptionCompleted: {
    color: '#D1D5DB',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
  },
  categoryText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    gap: 5,
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deadlineBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deadlineText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: '#6366F1',
    margin: 24,
    padding: 20,
    borderRadius: 18,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
