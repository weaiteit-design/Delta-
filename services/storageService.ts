import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext, UserStats, ModelGuide } from '../types';
import { supabase } from './supabaseClient';

class StorageService {
  private isSupabaseEnabled = true;

  constructor() {
    this.checkConnection();
  }

  async checkConnection() {
    if (this.isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
          console.error('Supabase Check:', error.message);
        }
      } catch (e) {
        console.error('Supabase Connection Exception:', e);
      }
    }
  }

  // --- AUTH ---
  async signUp(email: string, password: string, name: string): Promise<{ user: any; error: any }> {
    if (!supabase) return { user: null, error: 'No Supabase client' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      if (error.message?.includes('rate limit') || error.status === 429) {
        console.warn('Rate limit hit. Falling back to offline mode.');
        const localUser = { id: 'local-' + Date.now(), name };
        await this.saveUser({
          id: localUser.id,
          name,
          role: 'Non-Technical Pro' as any,
          goals: [],
          aiLevel: 'Beginner' as any,
          learningStyle: 'Practical' as any,
          difficultyCeiling: 3,
          onboardingComplete: false,
        });
        return { user: localUser, error: null };
      }
      return { user: null, error };
    }

    if (data.user) {
      await this.saveUser({
        id: data.user.id,
        name,
        role: 'Non-Technical Pro' as any,
        goals: [],
        aiLevel: 'Beginner' as any,
        learningStyle: 'Practical' as any,
        difficultyCeiling: 3,
        onboardingComplete: false,
      });
    }

    return { user: data.user, error: null };
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: any; profile: UserContext | null; error: any }> {
    if (!supabase) return { user: null, error: 'No Supabase client', profile: null };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { user: null, profile: null, error };

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userContext: UserContext | null = profile
      ? {
          id: profile.id,
          name: profile.name,
          role: profile.role,
          goals: profile.goals,
          aiLevel: profile.ai_level,
          learningStyle: profile.learning_style,
          difficultyCeiling: 3,
          onboardingComplete: true,
        }
      : null;

    if (userContext) {
      await AsyncStorage.setItem('delta_user', JSON.stringify(userContext));
    }

    return { user: data.user, profile: userContext, error: null };
  }

  async signOut(onSignOut?: () => void) {
    if (supabase) await supabase.auth.signOut();
    await AsyncStorage.multiRemove(['delta_user', 'delta_stats', 'delta_hack', 'delta_news_cache']);
    if (onSignOut) onSignOut();
  }

  // --- USER ---
  async saveUser(user: UserContext): Promise<void> {
    if (this.isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id || undefined,
              name: user.name,
              role: user.role,
              goals: user.goals,
              ai_level: user.aiLevel,
              learning_style: user.learningStyle,
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (error) console.error('Supabase save error:', error);
      } catch (err) {
        console.error('Supabase exception', err);
      }
    }
    await AsyncStorage.setItem('delta_user', JSON.stringify(user));
  }

  async getUser(): Promise<UserContext | null> {
    const local = await AsyncStorage.getItem('delta_user');
    return local ? JSON.parse(local) : null;
  }

  // --- STATS ---
  async saveStats(stats: UserStats): Promise<void> {
    await AsyncStorage.setItem('delta_stats', JSON.stringify(stats));
  }

  async getStats(): Promise<UserStats | null> {
    const local = await AsyncStorage.getItem('delta_stats');
    return local ? JSON.parse(local) : null;
  }

  // --- CACHE HELPERS ---
  async getCached(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setCached(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeCached(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  // --- MODEL GUIDES ---
  async getModelGuide(modelName: string): Promise<ModelGuide | null> {
    const local = await AsyncStorage.getItem(`guide_${modelName}`);
    if (local) return JSON.parse(local);

    if (this.isSupabaseEnabled && supabase) {
      try {
        const { data } = await supabase
          .from('model_guides')
          .select('data')
          .eq('model_name', modelName)
          .single();

        if (data?.data) {
          await AsyncStorage.setItem(`guide_${modelName}`, JSON.stringify(data.data));
          return data.data as ModelGuide;
        }
      } catch (e) {
        console.warn('Error fetching guide from DB', e);
      }
    }
    return null;
  }

  async saveModelGuide(guide: ModelGuide): Promise<void> {
    await AsyncStorage.setItem(`guide_${guide.modelName}`, JSON.stringify(guide));
    if (this.isSupabaseEnabled && supabase) {
      try {
        await supabase.from('model_guides').upsert(
          { model_name: guide.modelName, data: guide, updated_at: new Date().toISOString() },
          { onConflict: 'model_name' }
        );
      } catch (e) {
        console.error('Error saving guide to DB', e);
      }
    }
  }
}

export const storageService = new StorageService();
