import React, { useEffect, useState } from 'react';
import { UserContext, VerifiedUpdate, MicroLesson, ToolSuggestion, UserStats, ChatMessage, DailyLifeHack, LearnCategory } from '../types';
import { deltaService } from '../services/deltaService';
import { storageService } from '../services/storageService';
import { LEVEL_SYSTEM, XP_PER_LESSON } from '../constants';
import { LevelUpModal } from './LevelUpModal';
import {
  Home, BookOpen, Sparkles, TrendingUp as TrendingIcon,
  MessageSquare, Library as LibraryIcon, User,
  X, Play, Zap, Loader2, ChevronRight, LogOut, Copy
} from 'lucide-react';

// Views
import { HomeView } from './views/HomeView';
import { LearnView } from './views/LearnView';
import { UpdatesView } from './views/UpdatesView';
import { TrendingView } from './views/TrendingView';
import { ChatView } from './views/ChatView';
import { LibraryView } from './views/LibraryView';

interface DashboardProps {
  user: UserContext;
}

type Tab = 'home' | 'learn' | 'updates' | 'trending' | 'chat' | 'library';

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Data State
  const [updates, setUpdates] = useState<VerifiedUpdate[]>(deltaService.getFallbackUpdates());
  const [tools, setTools] = useState<ToolSuggestion[]>(deltaService.getFallbackTools());
  const [dailyHack, setDailyHack] = useState<DailyLifeHack | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<UserStats>({
    streak: 1, lessonsCompleted: 0, lastVisit: new Date().toISOString(), xp: 0, level: 1, toolsMastered: 0, skillsUnlocked: 0
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Navigation State
  const [selectedItem, setSelectedItem] = useState<{ type: 'update' | 'tool', data: VerifiedUpdate | ToolSuggestion } | null>(null);
  const [generatedLesson, setGeneratedLesson] = useState<MicroLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolSuggestion | null>(null);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // NEW: Profile Menu State

  const calculateLevel = (currentXp: number) => {
    let level = 1;
    for (let i = LEVEL_SYSTEM.length - 1; i >= 0; i--) {
      if (currentXp >= LEVEL_SYSTEM[i].xp) {
        level = LEVEL_SYSTEM[i].level;
        break;
      }
    }
    return level;
  };

  useEffect(() => {
    const initAgents = async () => {
      const cachedStats = await storageService.getStats();

      if (cachedStats) {
        const safeStats = {
          ...cachedStats,
          level: typeof cachedStats.level === 'number' ? cachedStats.level : 1,
          xp: typeof cachedStats.xp === 'number' ? cachedStats.xp : 0
        };
        setStats(prev => ({ ...prev, ...safeStats, level: calculateLevel(safeStats.xp || 0) }));
      }

      try {
        // Fetch tools and news in parallel for speed
        const [freshTools, freshUpdates] = await Promise.all([
          deltaService.discoverTools(user),
          deltaService.fetchLiveAINews()
        ]);

        setTools(freshTools);
        if (freshUpdates.length > 0) {
          setUpdates(freshUpdates);
        }

        // Generate daily hack if we have updates
        if (freshUpdates.length > 0 && !localStorage.getItem('delta_hack')) {
          const newHack = await deltaService.generateDailyLifeHack(freshUpdates, freshTools, user);
          if (newHack) {
            setDailyHack(newHack);
            localStorage.setItem('delta_hack', JSON.stringify(newHack));
          }
        } else if (localStorage.getItem('delta_hack')) {
          try {
            const cachedHack = JSON.parse(localStorage.getItem('delta_hack') || 'null');
            if (cachedHack && cachedHack.title) setDailyHack(cachedHack);
          } catch (e) {
            localStorage.removeItem('delta_hack');
          }
        }
      } catch (error) {
        console.error("Sync Error:", error);
      } finally {
        setLoading(false);
        storageService.saveStats({ ...stats, lastVisit: new Date().toISOString() });
      }
    };

    // Safety Timeout: Force app to load even if APIs hang
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Force releasing loading state after timeout.");
        setLoading(false);
      }
    }, 4000);

    initAgents().then(() => clearTimeout(safetyTimer));

    deltaService.initChat(user);
    setChatMessages([{
      id: 'welcome', role: 'model',
      text: deltaService.getIsDemoMode() ? "Demo Mode Active. Connect API Key for live intelligence." : `Hello ${user.name}. I'm synced with the latest AI shifts.`,
      timestamp: new Date()
    }]);
  }, []);

  // HANDLERS
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);
    const responseText = await deltaService.sendChatMessage(userMsg.text);
    const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
    setChatMessages(prev => [...prev, modelMsg]);
    setIsChatTyping(false);
  };

  const startMicroLesson = async (item: VerifiedUpdate | ToolSuggestion, levelContext?: string) => {
    setSelectedItem({ type: 'update' in item ? 'update' : 'tool', data: item });
    setLessonLoading(true);
    setGeneratedLesson(null);

    try {
      let lesson: MicroLesson | null = null;
      if ('updateType' in item) {
        lesson = await deltaService.generateLesson(item as VerifiedUpdate, user);
      } else {
        const toolItem = item as ToolSuggestion;
        const toolWithContext = levelContext ? { ...toolItem, description: `${levelContext} Guide for ${toolItem.name}. ${toolItem.description}` } : toolItem;
        lesson = await deltaService.generateToolLesson(toolWithContext, user);
      }

      // Defensive: Ensure we always have a valid lesson object
      if (lesson && lesson.title && Array.isArray(lesson.steps)) {
        setGeneratedLesson(lesson);
      } else {
        // Create a safe fallback if lesson is malformed
        const itemName = 'name' in item ? item.name : (item as VerifiedUpdate).title;
        setGeneratedLesson({
          id: 'emergency-fallback-' + Date.now(),
          updateId: item.id,
          title: `Learn ${itemName}`,
          duration: "2 min",
          whyItMatters: "This is a quick intro to get you started.",
          whatChanged: 'description' in item ? item.description : (item as VerifiedUpdate).shortSummary,
          steps: ["Explore the tool's official website.", "Try a simple task.", "Check out community tutorials."],
          mentalModel: "Explorer",
          practiceTask: "Spend 5 minutes experimenting.",
          visualConcept: "Learning",
          imageUrl: `https://pollinations.ai/p/${encodeURIComponent(itemName + " learning abstract")}?width=800&height=400`
        });
      }
    } catch (e) {
      console.error("Lesson generation crashed:", e);
      // Emergency fallback
      const itemName = 'name' in item ? (item as ToolSuggestion).name : (item as VerifiedUpdate).title;
      setGeneratedLesson({
        id: 'error-fallback-' + Date.now(),
        updateId: item.id,
        title: `Explore ${itemName}`,
        duration: "1 min",
        whyItMatters: "We encountered an issue generating your lesson.",
        whatChanged: "The AI service returned an error.",
        steps: ["Try again in a few moments.", "Check your network connection.", "Explore the tool directly."],
        mentalModel: "Troubleshooting",
        practiceTask: "Refresh and retry.",
        visualConcept: "Error",
        imageUrl: `https://pollinations.ai/p/abstract_error_recovery_neon?width=800&height=400`
      });
    } finally {
      setLessonLoading(false);
    }
  };

  const handleStartLesson = (item: VerifiedUpdate | ToolSuggestion) => {
    if ('matchScore' in item) {
      setSelectedTool(item as ToolSuggestion);
    } else {
      startMicroLesson(item);
    }
  };

  const completeLesson = () => {
    const oldLevel = stats.level;
    const newXP = stats.xp + XP_PER_LESSON;
    const newLevel = calculateLevel(newXP);
    const newStats = {
      ...stats, lessonsCompleted: stats.lessonsCompleted + 1, xp: newXP, level: newLevel,
      toolsMastered: (stats.toolsMastered || 0) + (selectedItem?.type === 'tool' ? 1 : 0),
      skillsUnlocked: (stats.skillsUnlocked || 0) + 1
    };
    setStats(newStats);
    storageService.saveStats(newStats);
    if (newLevel > oldLevel) setShowLevelUpModal(true);
    closeLesson();
  };

  const closeLesson = () => { setSelectedItem(null); setGeneratedLesson(null); };

  /* OVERLAYS: Constrained to Mobile Width */
  const ToolPathOverlay = () => {
    if (!selectedTool) return null;
    return (
      <div className="fixed inset-0 z-[60] flex justify-center items-end md:items-center pointer-events-none">
        <div className="w-full max-w-md h-full bg-black flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200 pointer-events-auto border-x border-neutral-900 shadow-2xl">
          <header className="p-6 border-b border-neutral-800 flex justify-between items-center bg-black/95 backdrop-blur z-10">
            <div>
              <h2 className="text-xl font-light text-white">{selectedTool.name}</h2>
              <p className="text-sm text-neutral-500">Mastery Path</p>
            </div>
            <button onClick={() => setSelectedTool(null)} className="p-2 bg-neutral-900 rounded-full text-white hover:bg-neutral-800 transition-colors"><X size={20} /></button>
          </header>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto no-scrollbar">
            {['Beginner', 'Intermediate', 'Advanced'].map((level, i) => (
              <button key={level} onClick={() => startMicroLesson(selectedTool, level)} className="w-full text-left group">
                <div className="flex gap-4">
                  <div className={`flex-col items-center flex`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 ${i === 0 ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-500 border-neutral-700'}`}>{i + 1}</div>
                    {i < 2 && <div className="w-0.5 h-12 bg-neutral-800 my-1" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl group-hover:border-neutral-600 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${i === 0 ? 'text-green-500' : (i === 1 ? 'text-yellow-500' : 'text-red-500')}`}>{level}</span>
                        <ChevronRight size={16} className="text-neutral-600 group-hover:text-white" />
                      </div>
                      <h3 className="text-white font-medium mb-1">{i === 0 ? `Getting Started` : i === 1 ? `Workflows` : `Mastery`}</h3>
                      <p className="text-neutral-500 text-xs line-clamp-2">{i === 0 ? "Setup & First Use" : i === 1 ? "Real-world Application" : "Advanced Features"}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const LessonOverlay = () => {
    if (!selectedItem) return null;
    return (
      <div className="fixed inset-0 z-[70] flex justify-center items-end md:items-center pointer-events-none">
        <div className="w-full max-w-md h-full bg-black flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200 pointer-events-auto border-x border-neutral-900 shadow-2xl">
          <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-black/95 backdrop-blur z-10 shrink-0">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Lesson</h3>
            <button onClick={closeLesson} className="text-white bg-neutral-800 p-2 rounded-full hover:bg-neutral-700 transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            {lessonLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                <p className="text-xs uppercase tracking-widest animate-pulse">Generating Lesson...</p>
              </div>
            ) : generatedLesson ? (
              <div className="space-y-6 pb-10">

                <div>
                  <h1 className="text-2xl font-light text-white mb-3 leading-tight">{String(generatedLesson.title || 'Lesson')}</h1>
                  <p className="text-base text-neutral-300 mb-4 border-l-2 border-blue-500 pl-4 italic">
                    "{String(generatedLesson.whyItMatters || 'Learn something new today.')}"
                  </p>
                  {(generatedLesson as any).whyUseThisTool && (
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-xl border border-blue-800/50 mb-4">
                      <h4 className="text-xs uppercase tracking-widest text-blue-400 mb-2 font-semibold">💡 Why Use This Tool?</h4>
                      <p className="text-neutral-300 text-sm leading-relaxed">{String((generatedLesson as any).whyUseThisTool)}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-neutral-900/50 p-5 rounded-xl border border-neutral-800">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Play size={16} className="text-green-500" /> Action Plan
                    </h3>
                    <ol className="space-y-4">
                      {generatedLesson.steps && Array.isArray(generatedLesson.steps) && generatedLesson.steps.length > 0 ? (
                        generatedLesson.steps.map((step, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold border border-neutral-700">
                              {i + 1}
                            </span>
                            <p className="text-neutral-300 text-sm leading-relaxed">{typeof step === 'string' ? step : JSON.stringify(step)}</p>
                          </li>
                        ))
                      ) : (
                        <li className="text-neutral-500 text-sm">No steps available.</li>
                      )}
                    </ol>
                  </div>

                  {/* TASK PROMPT - Copy-paste ready */}
                  {generatedLesson.taskPrompt && (
                    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-5 rounded-xl border border-purple-500/30">
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400" /> Try This Prompt
                      </h3>
                      <div className="bg-black/50 p-4 rounded-lg border border-neutral-700 mb-3">
                        <p className="text-neutral-200 text-sm leading-relaxed font-mono">
                          "{String(generatedLesson.taskPrompt)}"
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(generatedLesson.taskPrompt));
                          // Optional: show toast feedback
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Copy size={16} /> Copy Prompt
                      </button>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-neutral-900 to-black p-5 rounded-xl border border-neutral-800">
                    <button onClick={completeLesson} className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      Complete (+{XP_PER_LESSON} XP)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-red-400 p-10 flex flex-col items-center">
                <p className="mb-4">Failed to load lesson.</p>
                <button onClick={closeLesson} className="text-sm underline text-neutral-500">Go Back</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col max-w-md mx-auto relative overflow-hidden">
      <header className="px-6 pt-12 pb-2 flex justify-between items-center bg-gradient-to-b from-black to-transparent z-10 relative">
        <div className="flex items-center gap-2 relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"><User size={16} /></button>
          <span className="text-sm font-medium text-neutral-300">{user.name}</span>

          {/* PROFILE MENU */}
          {showProfileMenu && (
            <div className="absolute top-10 left-0 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => storageService.signOut()} className="w-full text-left px-4 py-3 text-red-400 hover:bg-neutral-800 rounded-lg text-sm flex items-center gap-2"><LogOut size={16} /> Sign Out</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {deltaService.getIsDemoMode() && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 rounded font-bold">DEMO</span>}
          <div className="text-xs font-mono text-neutral-500">Lvl {stats.level}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-5">
        <main className="flex-1 overflow-y-auto no-scrollbar px-5">
          {/* HOME: Only High Relevance (90+) + New Tools */}
          {activeTab === 'home' && <HomeView user={user} stats={stats} updates={updates.filter(u => u.relevanceScore >= 85).slice(0, 5)} tools={tools} dailyHack={dailyHack} loading={loading} onStartLesson={handleStartLesson} onTabChange={setActiveTab} />}

          {activeTab === 'learn' && <LearnView user={user} onSelectTool={handleStartLesson} />}

          {/* UPDATES: Show ALL updates in Global AI Shifts */}
          {activeTab === 'updates' && <UpdatesView updates={updates} loading={loading} onStartLesson={handleStartLesson} />}

          {activeTab === 'trending' && <TrendingView user={user} tools={tools} updates={updates} loading={loading} onStartLesson={handleStartLesson} />}
          {activeTab === 'chat' && <ChatView messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={handleSendMessage} isTyping={isChatTyping} />}
          {activeTab === 'library' && <LibraryView user={user} stats={stats} />}
        </main>
      </main>

      <nav className="border-t border-neutral-900 bg-black/95 backdrop-blur-xl px-2 pb-6 pt-2 z-20">
        <ul className="flex justify-between items-center text-[10px] font-medium text-neutral-500">
          {[{ id: 'home', icon: Home, label: 'Home' }, { id: 'learn', icon: BookOpen, label: 'Learn' }, { id: 'updates', icon: Sparkles, label: 'Updates' }, { id: 'trending', icon: TrendingIcon, label: 'Trending' }, { id: 'chat', icon: MessageSquare, label: 'Chat' }, { id: 'library', icon: LibraryIcon, label: 'Library' }].map(v => (
            <li key={v.id} className="flex-1"><button onClick={() => setActiveTab(v.id as Tab)} className={`w-full flex flex-col items-center gap-1 py-2 ${activeTab === v.id ? 'text-white' : 'hover:text-neutral-300'}`}><v.icon size={20} className={activeTab === v.id ? 'text-white' : 'text-neutral-600'} strokeWidth={activeTab === v.id ? 2.5 : 2} /><span className={activeTab === v.id ? 'opacity-100' : 'opacity-0 scale-0'}>{v.label}</span></button></li>
          ))}
        </ul>
      </nav>

      {selectedItem && <LessonOverlay />}
      {selectedTool && <ToolPathOverlay />}
      {showLevelUpModal && <LevelUpModal newLevel={stats.level} onClose={() => setShowLevelUpModal(false)} />}
    </div>
  );
};