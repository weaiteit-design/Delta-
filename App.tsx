import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { UserContext } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await storageService.getUser();
      // Check if user exists AND has the new required 'name' field
      if (savedUser && savedUser.name) {
        setUser(savedUser);
      } else if (savedUser && !savedUser.name) {
        // Migration: If user exists but no name, reset or force onboarding
        // For simplicity, we'll reset to onboarding
        console.log("User found but missing name. Restarting onboarding.");
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, []);
  
  const handleOnboardingComplete = async (context: UserContext) => {
    try {
        // Generate a simple ID if not present (for Supabase upsert)
        if (!context.id) {
            // Robust ID generation that works in all contexts (including non-secure http)
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                try {
                    context.id = crypto.randomUUID();
                } catch (e) {
                    context.id = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
                }
            } else {
                // Fallback for environments where crypto is not available
                context.id = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
            }
        }
        setUser(context);
        await storageService.saveUser(context);
    } catch (e) {
        console.error("Critical Error completing onboarding:", e);
        // Ensure the user enters the app even if storage fails
        setUser(context); 
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Delta...</div>;

  return (
    <>
      {!user ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard user={user} />
      )}
    </>
  );
};

export default App;