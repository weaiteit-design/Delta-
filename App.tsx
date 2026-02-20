import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { UserContext } from './types';
import { storageService } from './services/storageService';

export default function App() {
  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await storageService.getUser();
      if (savedUser && savedUser.name && savedUser.onboardingComplete) {
        setUser(savedUser);
      } else if (savedUser && !savedUser.name) {
        console.log('User found but missing name. Restarting onboarding.');
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleOnboardingComplete = async (context: UserContext) => {
    try {
      if (!context.id) {
        context.id = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      }
      setUser(context);
      await storageService.saveUser(context);
    } catch (e) {
      console.error('Critical Error completing onboarding:', e);
      setUser(context);
    }
  };

  const handleSignOut = async () => {
    setUser(null);
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Delta...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!user || !user.onboardingComplete ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard user={user} onSignOut={handleSignOut} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 2,
  },
});
