import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView, FlatList } from 'react-native';
import { addTask } from '../services/firestore';
import auth from '@react-native-firebase/auth';
import styles from '../styles/AddTaskScreenStyles';

export default function AddTaskScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(''); // Format: dd mm yyyy
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [titleError, setTitleError] = useState('');
  const [priorityError, setPriorityError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
    // Reset errors
    setTitleError('');
    setPriorityError('');
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    
    // Validate priority
    if (!priority) {
      setPriorityError('Priority is required');
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
      description: description || undefined,
      deadline: parsedDeadline ? parsedDeadline.toISOString() : undefined,
      priority,
      category: category || undefined,
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
      
      // Reset form - clear all fields immediately
      setTitle('');
      setDescription('');
      setDeadlineDate('');
      setPriority('');
      setCategory('');
      setTitleError('');
      setPriorityError('');
      
      // Show success message on interface
      setShowSuccess(true);
      
      // Hide success message and navigate back after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Home" as never);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error saving task:', err);
      Alert.alert("Error", err.message || "Failed to add task. Please try again.");
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDeadlineDate('');
    setPriority('');
    setCategory('');
    setTitleError('');
    setPriorityError('');
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home" as never);
    }
  };

  const priorityOptions = ['Low', 'Medium', 'High'];
  const categoryOptions = ['Work', 'Personal', 'Shopping', 'Health', 'Education', 'Other'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Create New Task</Text>
            <Text style={styles.headerSubtitle}>Fill in the details below</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.contentContainer}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={[styles.input, titleError && styles.inputError]}
              placeholder="Enter task title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError('');
              }}
            />
            {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Add a description"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline Date</Text>
            <TextInput
              style={styles.input}
              placeholder="dd mm yyyy"
              placeholderTextColor="#9CA3AF"
              value={deadlineDate}
              onChangeText={(text) => setDeadlineDate(formatDateInput(text))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
              contentContainerStyle={styles.categoryContainer}
            >
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.categoryOption,
                    category === option && styles.categoryOptionActive,
                    category === option && {
                      backgroundColor: '#6366F1'
                    }
                  ]}
                  onPress={() => setCategory(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryText,
                    category === option && styles.categoryTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority *</Text>
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
                  onPress={() => {
                    setPriority(option);
                    if (priorityError) setPriorityError('');
                  }}
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
            {priorityError ? <Text style={styles.errorText}>{priorityError}</Text> : null}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddTask} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Task</Text>
            </TouchableOpacity>
          </View>

          {showSuccess && (
            <View style={styles.successMessage}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>Task created successfully!</Text>
            </View>
          )}
        </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
