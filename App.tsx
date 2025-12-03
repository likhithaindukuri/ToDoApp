import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import auth from '@react-native-firebase/auth';
import { LogBox } from 'react-native';

// Ignore specific warnings if needed
LogBox.ignoreLogs(['new NativeEventEmitter']);

export default function App() {
  useEffect(() => {
    // Check if Firebase is initialized
    try {
      const currentUser = auth().currentUser;
      console.log('Firebase initialized, current user:', currentUser?.uid || 'none');
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }, []);

  return <AppNavigator />;
}
