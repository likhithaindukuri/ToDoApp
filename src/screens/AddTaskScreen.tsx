import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { addTask } from '../services/firestore';
import auth from '@react-native-firebase/auth';

export default function AddTaskScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(''); // Format: dd mm yyyy
  const [priority, setPriority] = useState('');

  // Parse date string in "dd mm yyyy" format
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr.trim()) return null;
    
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2024) return null;

    const date = new Date(year, month, day, 12, 0); // Set to noon
    
    // Validate the date is actually valid (e.g., not Feb 30)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }

    return date;
  };

  // Format input helper - auto-format as user types
  const formatDateInput = (text: string): string => {
    // Remove all non-digits and spaces
    const digits = text.replace(/\D/g, '');
    
    // Format as dd mm yyyy
    if (digits.length === 0) {
      return '';
    } else if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return digits.slice(0, 2) + ' ' + digits.slice(2);
    } else {
      return digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4, 8);
    }
  };


  const handleAddTask = async () => {
    if (!title || !priority) {
      Alert.alert("Error", "Title & Priority are required");
      return;
    }

    // Parse deadline
    let parsedDeadline: Date | null = null;

    if (deadlineDate.trim()) {
      parsedDeadline = parseDate(deadlineDate);
      if (!parsedDeadline) {
        Alert.alert("Error", "Invalid Deadline format. Please use: dd mm yyyy");
        return;
      }
      if (parsedDeadline <= new Date()) {
        Alert.alert("Error", "Deadline must be greater than today");
        return;
      }
    }

    const newTask = {
      title,
      description,
      deadline: parsedDeadline ? parsedDeadline.toISOString() : '',
      priority,
    };

    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert("Error", "You are not logged in. Please login again.");
        navigation.navigate("Login" as never);
        return;
      }
      
      console.log('Saving task for user:', user.uid);
      await addTask(newTask);
      console.log('Task saved successfully');
      
      // Show success popup and then navigate back
      Alert.alert(
        "Success",
        "Task created successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to HomeScreen
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("Home" as never);
              }
            }
          }
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.error('Error saving task:', err);
      Alert.alert("Error", err.message || "Failed to add task. Please try again.");
    }
  };

  const priorityOptions = ['Low', 'Medium', 'High'];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Create New Task</Text>
            <Text style={styles.headerSubtitle}>Fill in the details below</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelIcon}>📝</Text>
              <Text style={styles.label}>Task Title *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelIcon}>📄</Text>
              <Text style={styles.label}>Description</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a description (optional)"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelIcon}>📅</Text>
              <Text style={styles.label}>Deadline</Text>
            </View>
            <TextInput
              style={styles.dateInput}
              placeholder="dd mm yyyy"
              placeholderTextColor="#9CA3AF"
              value={deadlineDate}
              onChangeText={(text) => setDeadlineDate(formatDateInput(text))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelIcon}>⭐</Text>
              <Text style={styles.label}>Priority *</Text>
            </View>
            <View style={styles.priorityContainer}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.priorityOption,
                    priority === option && styles.priorityOptionActive,
                    priority === option && {
                      backgroundColor: 
                        option === 'High' ? '#EF4444' :
                        option === 'Medium' ? '#F59E0B' : '#10B981'
                    }
                  ]}
                  onPress={() => setPriority(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.priorityText,
                    priority === option && styles.priorityTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleAddTask} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save Task</Text>
            <Text style={styles.saveButtonIcon}>✓</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 26,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.3,
  },
  input: {
    height: 58,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontWeight: '500',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  dateInput: {
    height: 50,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityOptionActive: {
    borderWidth: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  priorityTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  saveButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
