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
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) {
          // Check if it's just an auth/permission error which is "fine" for connection check
          if (error.code !== 'PGRST116') console.error("Supabase Check:", error.message);
        } else {

        }
      } catch (e) {
        console.error("Supabase Connection Exception:", e);
      }
    }
  }

  // --- AUTH ---
  async signUp(email: string, password: string, name: string): Promise<{ user: any, error: any }> {
    if (!supabase) return { user: null, error: 'No Supabase client' };

    // 1. Create Auth User
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      // HANDLE RATE LIMIT: Fallback to local-only mode
      if (error.message?.includes('rate limit') || error.status === 429) {
        console.warn("Rate limit hit. Falling back to offline mode.");
        // Create a local-only user
        const localUser = {
          id: 'local-' + Date.now(),
          name: name,
        };
        await this.saveUser({
          id: localUser.id,
          name: name,
          role: 'Non-Technical Pro' as any,
          goals: [],
          aiLevel: 'Beginner' as any,
          learningStyle: 'Practical' as any,
          difficultyCeiling: 3,
          onboardingComplete: false
        });
        return { user: localUser, error: null };
      }
      return { user: null, error };
    }

    // 2. Create Public Profile (linking Auth ID to Users table)
    if (data.user) {
      await this.saveUser({
        id: data.user.id,
        name: name,
        // Defaults
        role: 'Non-Technical Pro' as any,
        goals: [],
        aiLevel: 'Beginner' as any,
        learningStyle: 'Practical' as any,
        difficultyCeiling: 3,
        onboardingComplete: false
      });
    }

    return { user: data.user, error: null };
  }

  async signIn(email: string, password: string): Promise<{ user: any, profile: UserContext | null, error: any }> {
    if (!supabase) return { user: null, error: 'No Supabase client', profile: null };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) return { user: null, profile: null, error };

    // Fetch Profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Transform snake_case DB to camelCase Profile
    const userContext: UserContext | null = profile ? {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      goals: profile.goals,
      aiLevel: profile.ai_level,
      learningStyle: profile.learning_style,
      difficultyCeiling: 3,
      onboardingComplete: true
    } : null;

    if (userContext) {
      localStorage.setItem('delta_user', JSON.stringify(userContext));
    }

    return { user: data.user, profile: userContext, error: null };
  }

  async signOut() {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('delta_user');
    localStorage.removeItem('delta_stats');
    window.location.reload();
  }

  // --- USER ---
  async saveUser(user: UserContext): Promise<void> {
    if (this.isSupabaseEnabled && supabase) {
      try {
        // Upsert user into Supabase
        const { error } = await supabase
          .from('users')
          .upsert({
            id: user.id || undefined, // Allow Supabase to handle ID if missing, or use Auth ID
            name: user.name,
            role: user.role,
            goals: user.goals,
            ai_level: user.aiLevel,
            learning_style: user.learningStyle
          }, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('Supabase save error:', error);
        }
      } catch (err) {
        console.error("Supabase exception", err);
      }
    }
    localStorage.setItem('delta_user', JSON.stringify(user));
  }

  async getUser(): Promise<UserContext | null> {
    const local = localStorage.getItem('delta_user');
    return local ? JSON.parse(local) : null;
  }

  // --- STATS ---
  async saveStats(stats: UserStats): Promise<void> {
    localStorage.setItem('delta_stats', JSON.stringify(stats));
  }

  async getStats(): Promise<UserStats | null> {
    const local = localStorage.getItem('delta_stats');
    return local ? JSON.parse(local) : null;
  }

  // --- MODEL GUIDES (BACKEND) ---
  async getModelGuide(modelName: string): Promise<ModelGuide | null> {
    // Try local cache first for speed
    const local = localStorage.getItem(`guide_${modelName}`);
    if (local) return JSON.parse(local);

    if (this.isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase
          .from('model_guides')
          .select('data')
          .eq('model_name', modelName)
          .single();

        if (data && data.data) {
          // Cache it locally
          localStorage.setItem(`guide_${modelName}`, JSON.stringify(data.data));
          return data.data as ModelGuide;
        }
      } catch (e) {
        console.warn("Error fetching guide from DB", e);
      }
    }
    return null;
  }

  async saveModelGuide(guide: ModelGuide): Promise<void> {
    localStorage.setItem(`guide_${guide.modelName}`, JSON.stringify(guide));

    if (this.isSupabaseEnabled && supabase) {
      try {
        await supabase.from('model_guides').upsert({
          model_name: guide.modelName,
          data: guide,
          updated_at: new Date().toISOString()
        }, { onConflict: 'model_name' });
      } catch (e) {
        console.error("Error saving guide to DB", e);
      }
    }
  }
}

export const storageService = new StorageService();