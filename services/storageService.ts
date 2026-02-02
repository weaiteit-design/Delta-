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
                console.error("Supabase Connection Error:", error);
            } else {
                console.log("Supabase Connected. User count:", count);
            }
        } catch (e) {
            console.error("Supabase Connection Exception:", e);
        }
    }
  }

  // --- USER ---
  async saveUser(user: UserContext): Promise<void> {
    if (this.isSupabaseEnabled && supabase) {
      try {
        // Upsert user into Supabase
        const { error } = await supabase
          .from('users')
          .upsert({ 
            id: user.id, 
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
            if (error.code === 'PGRST204') {
                console.warn("HINT: Your Supabase database schema might be missing columns. Run the SQL from 'supabase_setup.sql' in your Supabase SQL Editor.");
            }
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
         } catch(e) {
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
          } catch(e) {
              console.error("Error saving guide to DB", e);
          }
      }
  }
}

export const storageService = new StorageService();