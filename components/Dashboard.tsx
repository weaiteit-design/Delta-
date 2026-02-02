import React, { useEffect, useState, useMemo, useRef } from 'react';
import { UserContext, VerifiedUpdate, MicroLesson, ToolSuggestion, UserStats, ChatMessage, DailyLifeHack, ModelGuide, UpdateType } from '../types';
import { deltaService } from '../services/deltaService';
import { storageService } from '../services/storageService';
import { LEVEL_SYSTEM, XP_PER_LESSON, TOP_MODELS } from '../constants';
import { LevelUpModal } from './LevelUpModal';
import { 
  Activity, 
  Grid, 
  Cpu, 
  User, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Zap,
  TrendingUp,
  BarChart3,
  Filter,
  X,
  Flame,
  Star,
  MessageSquare,
  Send,
  Lock,
  Trophy,
  Target,
  Lightbulb,
  FileText,
  Layout,
  Book,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';

interface DashboardProps {
  user: UserContext;
}

type Tab = 'today' | 'updates' | 'tools' | 'chat' | 'profile';
type UpdatesFilter = 'All' | 'Capabilities' | 'Workflows' | 'Fixes';
type ToolsTab = 'discovery' | 'guides';

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  
  // Updates View State
  const [updates, setUpdates] = useState<VerifiedUpdate[]>([]);
  const [updatesFilter, setUpdatesFilter] = useState<UpdatesFilter>('All');

  // Tools View State
  const [activeToolTab, setActiveToolTab] = useState<ToolsTab>('discovery');
  const [tools, setTools] = useState<ToolSuggestion[]>(deltaService.getFallbackTools()); // Seed immediately
  const [aiToolLoading, setAiToolLoading] = useState(false);
  
  // Common State
  const [dailyHack, setDailyHack] = useState<DailyLifeHack | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User Stats State with Gamification
  const [stats, setStats] = useState<UserStats>({
    streak: 1,
    lessonsCompleted: 0,
    lastVisit: new Date().toISOString(),
    xp: 0,
    level: 1
  });

  // Tools Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterCurve, setFilterCurve] = useState<string>('All');
  const [minScore, setMinScore] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Unified selection state
  const [selectedItem, setSelectedItem] = useState<{ type: 'update' | 'tool', data: VerifiedUpdate | ToolSuggestion } | null>(null);
  const [generatedLesson, setGeneratedLesson] = useState<MicroLesson | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<ModelGuide | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);

  // Level Up Modal State
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  // Helper to calculate level based on XP
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

  // Initial Data Fetch with Caching Strategy
  useEffect(() => {
    const initAgents = async () => {
      // 1. Load Caches using Storage Service (supports fallback)
      const cachedStats = await storageService.getStats();
      const cachedUpdates = localStorage.getItem('delta_updates');
      const cachedUpdatesTime = localStorage.getItem('delta_updates_timestamp');
      const cachedHack = localStorage.getItem('delta_hack');
      
      if (cachedStats) {
        setStats(prev => ({
          ...prev,
          ...cachedStats,
          level: calculateLevel(cachedStats.xp || 0)
        }));
      }

      if (cachedHack) {
         try { setDailyHack(JSON.parse(cachedHack)); } catch(e) {}
      }

      const SIX_HOURS = 6 * 60 * 60 * 1000;
      const now = Date.now();
      
      let validUpdates: VerifiedUpdate[] = [];
      let updatesAreFresh = false;

      // Check Updates Freshness
      if (cachedUpdates && cachedUpdatesTime) {
        const timeDiff = now - parseInt(cachedUpdatesTime);
        if (timeDiff < SIX_HOURS) {
          try {
             validUpdates = JSON.parse(cachedUpdates);
             setUpdates(validUpdates);
             updatesAreFresh = true;
          } catch(e) { console.error(e); }
        }
      }

      // If updates are stale, showing loading ONLY for the Dashboard view main components
      if (!updatesAreFresh) setLoading(true); else setLoading(false); 
      
      try {
        // Parallel Fetching for speed
        const promises = [];

        // 1. Live Tools Refresh (Background - we already seeded fallback)
        promises.push((async () => {
           // We don't block UI for this, we just update state when ready
           const freshTools = await deltaService.discoverTools(user);
           setTools(freshTools);
        })());

        // 2. Fetch News Updates if Stale
        if (!updatesAreFresh) {
            promises.push((async () => {
               const rawSignals = await deltaService.discoverUpdates();
               const verified = await deltaService.classifyUpdates(rawSignals, user);
               setUpdates(verified);
               localStorage.setItem('delta_updates', JSON.stringify(verified));
               localStorage.setItem('delta_updates_timestamp', now.toString());
               validUpdates = verified;
            })());
        }

        await Promise.allSettled(promises);
        
        // 3. Generate Daily Hack if needed
        if (!dailyHack) {
             const newHack = await deltaService.generateDailyLifeHack(validUpdates, tools, user);
             if (newHack) {
               setDailyHack(newHack);
               localStorage.setItem('delta_hack', JSON.stringify(newHack));
             }
        }

      } catch (error) {
        console.error("Failed to sync agents:", error);
      } finally {
        setLoading(false);
      }
    };

    initAgents();
    
    // Init Chat
    deltaService.initChat(user);
    setChatMessages([{
      id: 'welcome',
      role: 'model',
      text: `Hello ${user.name}! I'm Delta. I've analyzed your profile as a ${user.role}. How can I help you navigate the AI landscape today?`,
      timestamp: new Date()
    }]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Derived state for filtered updates
  const filteredUpdates = useMemo(() => {
    if (updatesFilter === 'All') return updates;
    
    return updates.filter(u => {
      if (updatesFilter === 'Capabilities') return u.updateType === UpdateType.Capability;
      if (updatesFilter === 'Workflows') return u.updateType === UpdateType.WorkflowShift;
      if (updatesFilter === 'Fixes') return u.updateType === UpdateType.Fix || u.updateType === UpdateType.LimitChange;
      return true;
    });
  }, [updates, updatesFilter]);


  // Derived state for filters (Tools)
  const categories = useMemo(() => {
    const cats = new Set(tools.map(t => t.category));
    return ['All', ...Array.from(cats)];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || tool.category === filterCategory;
      const matchesCurve = filterCurve === 'All' || tool.learningCurve === filterCurve;
      const matchesScore = tool.matchScore >= minScore;
      
      return matchesSearch && matchesCategory && matchesCurve && matchesScore;
    });
  }, [tools, searchQuery, filterCategory, filterCurve, minScore]);

  const isFiltering = searchQuery !== '' || filterCategory !== 'All' || filterCurve !== 'All' || minScore > 0;

  // Group filtered tools by collection
  const groupedTools = useMemo(() => {
    return {
      major: filteredTools.filter(t => t.collection === 'Major'),
      new: filteredTools.filter(t => t.collection === 'New'),
      underrated: filteredTools.filter(t => t.collection === 'Underrated'),
    };
  }, [filteredTools]);

  const completeLesson = () => {
    const oldLevel = stats.level;
    const newXP = stats.xp + XP_PER_LESSON;
    const newLevel = calculateLevel(newXP);
    
    const newStats = {
      ...stats,
      lessonsCompleted: stats.lessonsCompleted + 1,
      xp: newXP,
      level: newLevel
    };
    
    setStats(newStats);
    storageService.saveStats(newStats);
    
    // Check for level up
    if (newLevel > oldLevel) {
      setShowLevelUpModal(true);
    }
    
    closeLesson();
  };

  const handleStartUpdateLesson = async (update: VerifiedUpdate) => {
    setSelectedItem({ type: 'update', data: update });
    setLessonLoading(true);
    setGeneratedLesson(null);
    const lesson = await deltaService.generateLesson(update, user);
    setGeneratedLesson(lesson);
    setLessonLoading(false);
  };

  const handleStartToolLesson = async (tool: ToolSuggestion) => {
    setSelectedItem({ type: 'tool', data: tool });
    setLessonLoading(true);
    setGeneratedLesson(null);
    const lesson = await deltaService.generateToolLesson(tool, user);
    setGeneratedLesson(lesson);
    setLessonLoading(false);
  };

  const handleOpenModelGuide = async (modelName: string) => {
    setGuideLoading(true);
    setSelectedGuide(null); 
    
    // Check Backend/Cache First
    const cached = await storageService.getModelGuide(modelName);
    if (cached) {
        setSelectedGuide(cached);
        setGuideLoading(false);
        return;
    }

    // Generate if not found
    const guide = await deltaService.generateModelGuide(modelName);
    if (guide) {
        setSelectedGuide(guide);
        // Save to Backend
        storageService.saveModelGuide(guide);
    }
    setGuideLoading(false);
  };

  const handleAiToolSearch = async () => {
    if (!searchQuery.trim()) return;
    setAiToolLoading(true);
    setTools([]); // Clear current list to focus on results
    
    // Call new agent
    const newTools = await deltaService.findToolsForUseCase(searchQuery, user);
    setTools(newTools);
    setAiToolLoading(false);
  };

  const closeLesson = () => {
    setSelectedItem(null);
    setGeneratedLesson(null);
  };

  const closeGuide = () => {
    setSelectedGuide(null);
    setGuideLoading(false);
  }

  // Chat Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatTyping) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);
    
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const responseText = await deltaService.sendChatMessage(userMsg.text);
    
    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, modelMsg]);
    setIsChatTyping(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // --- Views ---

  const Header = () => {
    const currentLevelConfig = LEVEL_SYSTEM.find(l => l.level === stats.level) || LEVEL_SYSTEM[0];
    return (
      <div className="absolute top-4 right-6 flex items-center gap-3 z-10">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-8 h-8 rounded-full flex items-center justify-center border overflow-hidden transition-all ${activeTab === 'profile' ? 'bg-white border-white scale-110 shadow-glow' : 'bg-gradient-to-tr from-neutral-800 to-neutral-700 border-neutral-600 hover:border-white'}`}
        >
          <User size={16} className={activeTab === 'profile' ? 'text-black' : 'text-neutral-400'} />
        </button>
      </div>
    );
  };

  const GrowthChart = () => {
     // Simulated data based on current XP to visualize growth
     // Since we don't have historical data in the DB yet, we project a curve based on level
     const dataPoints = 7;
     const currentXP = stats.xp;
     const step = Math.max(10, currentXP / dataPoints);
     
     // Generate points
     const points = Array.from({length: dataPoints}, (_, i) => {
         // Create a slight logarithmic growth curve ending at current XP
         const x = i * (100 / (dataPoints - 1));
         // Randomize slightly for "realism"
         const noise = Math.random() * 20; 
         const y = Math.min(currentXP, (currentXP * (Math.pow(i + 1, 2) / Math.pow(dataPoints, 2))) + noise);
         return { x, y: Math.max(0, y) };
     });

     // Normalize Y for SVG 0-100 height
     const maxY = Math.max(...points.map(p => p.y), 100); // at least 100
     const svgPoints = points.map(p => `${p.x},${100 - (p.y / maxY * 80)}`).join(' ');

     return (
        <div className="h-32 w-full mt-4 relative">
           <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gradient Defs */}
              <defs>
                 <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                 </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="#262626" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="#262626" strokeWidth="0.5" strokeDasharray="2" />

              {/* Area */}
              <path d={`M0,100 ${svgPoints} L100,100 Z`} fill="url(#growthGradient)" />
              
              {/* Line */}
              <polyline 
                 points={svgPoints} 
                 fill="none" 
                 stroke="#60a5fa" 
                 strokeWidth="2" 
                 vectorEffect="non-scaling-stroke"
                 strokeLinecap="round"
                 strokeLinejoin="round"
              />
              
              {/* Dots */}
              {points.map((p, i) => (
                 <circle 
                   key={i} 
                   cx={p.x} 
                   cy={100 - (p.y / maxY * 80)} 
                   r="1.5" 
                   fill={i === points.length - 1 ? "#fff" : "#60a5fa"} 
                   stroke="#000"
                   strokeWidth="0.5"
                 />
              ))}
           </svg>
           <div className="absolute bottom-0 w-full flex justify-between text-[8px] text-neutral-600 font-mono uppercase mt-1">
              <span>Start</span>
              <span>7 Days Ago</span>
              <span>Today</span>
           </div>
        </div>
     );
  };

  const TodayView = () => {
    const topUpdate = updates[0];
    const currentLevelConfig = LEVEL_SYSTEM.find(l => l.level === stats.level) || LEVEL_SYSTEM[0];
    const nextLevelConfig = LEVEL_SYSTEM.find(l => l.level === stats.level + 1);
    
    // XP Progress Calculation
    const currentLevelBaseXP = currentLevelConfig.xp;
    const nextLevelXP = nextLevelConfig ? nextLevelConfig.xp : currentLevelConfig.xp + 1000;
    const progressPercent = Math.min(100, Math.max(0, ((stats.xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100));

    if (loading) return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500 animate-pulse">
        <RefreshCw className="animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest">Syncing Intelligence...</p>
      </div>
    );

    return (
      <div className="space-y-6 pb-20 pt-2">
        <header className="mb-2">
          <p className="text-[10px] font-mono text-neutral-500 mb-1 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-xl font-light text-white">
            Hello, <span className={currentLevelConfig.color}>{user.name}</span>.
          </h2>
        </header>

        {/* PROGRESS DASHBOARD */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 backdrop-blur-sm">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                 <Activity size={14} /> Progress
              </h3>
              <span className={`text-[10px] font-mono ${currentLevelConfig.color} border border-neutral-800 px-2 py-0.5 rounded-full`}>
                 {currentLevelConfig.title}
              </span>
           </div>
           
           <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-3 border border-neutral-800/50">
                 <Trophy size={20} className="text-yellow-500 mb-1" />
                 <span className="text-lg font-bold text-white">{stats.xp}</span>
                 <span className="text-[9px] text-neutral-500 uppercase">Total XP</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-3 border border-neutral-800/50">
                 <Flame size={20} className="text-orange-500 mb-1" />
                 <span className="text-lg font-bold text-white">{stats.streak}</span>
                 <span className="text-[9px] text-neutral-500 uppercase">Day Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-3 border border-neutral-800/50">
                 <Target size={20} className="text-blue-500 mb-1" />
                 <span className="text-lg font-bold text-white">{stats.lessonsCompleted}</span>
                 <span className="text-[9px] text-neutral-500 uppercase">Lessons</span>
              </div>
           </div>

           <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500 uppercase">
                 <span>Level {stats.level}</span>
                 <span>{nextLevelConfig ? `${nextLevelXP - stats.xp} XP to Lvl ${stats.level + 1}` : 'Max Level'}</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden border border-neutral-800">
                 <div 
                   className={`h-full ${currentLevelConfig.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
                   style={{ width: `${progressPercent}%` }}
                 ></div>
              </div>
           </div>
        </div>

        {/* Daily Integration Card */}
        {dailyHack ? (
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 p-5 rounded-xl relative overflow-hidden group shadow-lg">
             <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Lightbulb size={64} /></div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">Daily Hack</span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                    <Cpu size={10} /> {dailyHack.toolName}
                  </span>
                </div>
                <h3 className="text-white font-medium text-lg leading-tight mb-2">{dailyHack.title}</h3>
                <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{dailyHack.context}</p>
                <div className="flex items-center gap-2 text-[10px] text-green-400 font-mono bg-green-900/10 px-2 py-1 rounded inline-block">
                   <Clock size={10} className="inline mr-1" /> Impact: {dailyHack.impact}
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl flex items-center justify-center text-neutral-500 text-sm italic min-h-[140px]">
            <RefreshCw size={16} className="animate-spin mr-2" /> Generating today's daily hack...
          </div>
        )}

        {/* Top Priority Update */}
        {topUpdate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Top Priority</h3>
               <button onClick={() => setActiveTab('updates')} className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1">
                 View All <ArrowRight size={10} />
               </button>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden relative group">
              <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">
                    Critical Update
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wide">
                    {topUpdate.source}
                  </span>
                </div>
                <h3 className="text-lg text-white font-medium mb-2 leading-snug">{topUpdate.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-4 border-l-2 border-neutral-800 pl-3">
                  {topUpdate.shortSummary}
                </p>
                
                {topUpdate.lessonEligible && (
                  <button 
                    onClick={() => handleStartUpdateLesson(topUpdate)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all"
                  >
                    <Play size={16} fill="currentColor" />
                    Start Briefing (+{XP_PER_LESSON} XP)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const UpdatesView = () => (
    <div className="pb-20 space-y-4 pt-2">
      <header className="mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-20 border-b border-neutral-900">
        <h2 className="text-lg font-medium text-white">Latest AI Shifts</h2>
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {(['All', 'Capabilities', 'Workflows', 'Fixes'] as UpdatesFilter[]).map((filter) => (
            <button 
              key={filter} 
              onClick={() => setUpdatesFilter(filter)}
              className={`px-3 py-1 text-[10px] uppercase tracking-wide border rounded-full transition-colors ${
                updatesFilter === filter 
                ? 'bg-neutral-100 border-neutral-100 text-black font-bold' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {filteredUpdates.length === 0 ? (
        <div className="py-10 text-center text-neutral-600 text-sm">
           {loading ? <RefreshCw className="animate-spin mx-auto" /> : "No updates found for this category."}
        </div>
      ) : (
        filteredUpdates.map(update => (
          <div key={update.id} className="border-b border-neutral-900 pb-6 last:border-0 group">
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2">
                   <span className="text-[10px] text-neutral-500 uppercase tracking-widest bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">{update.updateType}</span>
               </div>
               <span className="text-[10px] text-neutral-600 font-mono">{new Date(update.date).toLocaleDateString()}</span>
            </div>
            <h3 className="text-white font-medium mb-1 group-hover:text-blue-200 transition-colors">{update.title}</h3>
            <p className="text-neutral-500 text-sm leading-relaxed mb-3">{update.shortSummary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 {update.url && (
                    <a href={update.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1">
                        <ExternalLink size={10} /> Source
                    </a>
                 )}
              </div>
              {update.lessonEligible && (
                <button 
                  onClick={() => handleStartUpdateLesson(update)}
                  className="text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300 font-medium"
                >
                  Learn <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const ToolSection = ({ title, tools, icon: Icon }: { title: string, tools: ToolSuggestion[], icon: any }) => {
    if (tools.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-xs font-bold text-neutral-500 mb-4 flex items-center gap-2 uppercase tracking-widest pl-1">
          <Icon size={12} /> {title}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {tools.map(tool => (
            <div key={tool.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all shadow-sm">
               <div className="p-4 flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">{tool.category}</span>
                        {tool.trending && (
                          <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">
                            <TrendingUp size={8} /> Trending
                          </span>
                        )}
                     </div>
                     <h3 className="text-white font-medium flex items-center gap-2">
                       {tool.name}
                     </h3>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-sm font-mono text-green-500 font-bold">{tool.matchScore}%</span>
                   </div>
                 </div>
                 
                 <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{tool.description}</p>
                 
                 {/* NanoBanana Concept: Delta Intelligence Block */}
                 <div className="bg-black/50 border border-neutral-800 p-2 rounded flex gap-2 items-start">
                    <Zap size={12} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-yellow-500 uppercase tracking-widest font-bold block mb-0.5">Delta Intelligence</span>
                      <p className="text-[10px] text-neutral-300 italic">"{tool.deltaAnalysis}"</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-1">
                    <button 
                      onClick={() => handleStartToolLesson(tool)}
                      className="w-full flex items-center justify-center gap-2 text-xs bg-white text-black py-2 rounded font-medium hover:bg-neutral-200 transition-colors"
                    >
                      <Play size={12} fill="currentColor" /> Micro-Lesson
                    </button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ToolsView = () => (
     <div className="pb-20 pt-2">
      <header className="mb-4 sticky top-0 bg-black/95 backdrop-blur-xl z-20 pb-4 border-b border-neutral-900 pt-2">
        <h2 className="text-lg font-medium text-white mb-4">Discovery Engine</h2>
        
        {/* Top Toggle Switch */}
        <div className="flex bg-neutral-900 p-1 rounded-lg mb-4 border border-neutral-800">
           <button 
              onClick={() => setActiveToolTab('discovery')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                 activeToolTab === 'discovery' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
              }`}
           >
              <Grid size={14} /> Tools Feed
           </button>
           <button 
              onClick={() => setActiveToolTab('guides')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                 activeToolTab === 'guides' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
              }`}
           >
              <Book size={14} /> Master Guides
           </button>
        </div>

        {/* --- DISCOVERY MODE CONTROLS --- */}
        {activeToolTab === 'discovery' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-3 text-neutral-500" size={16} />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAiToolSearch()}
                   placeholder="Filter or Ask Delta..." 
                   className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-neutral-600 placeholder:text-neutral-600"
                 />
                 {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-neutral-500 hover:text-white">
                     <X size={16} />
                   </button>
                 )}
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 rounded-lg border flex items-center justify-center transition-colors ${
                  showFilters || filterCategory !== 'All' || filterCurve !== 'All' || minScore > 0
                    ? 'bg-neutral-800 border-neutral-600 text-white' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                 <Filter size={18} />
              </button>
              <button 
                onClick={handleAiToolSearch}
                disabled={aiToolLoading || !searchQuery.trim()}
                className="bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 font-medium text-sm flex items-center gap-2 hover:bg-neutral-700 disabled:opacity-50"
              >
                 {aiToolLoading ? <RefreshCw className="animate-spin" size={16} /> : <ArrowUpRight size={18} />}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
               <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 mb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Categories */}
                  <div>
                    <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                       {categories.map(cat => (
                         <button
                           key={cat}
                           onClick={() => setFilterCategory(cat)}
                           className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                             filterCategory === cat 
                               ? 'bg-white text-black border-white font-medium' 
                               : 'bg-black text-neutral-400 border-neutral-800 hover:border-neutral-600'
                           }`}
                         >
                           {cat}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Learning Curve */}
                  <div>
                    <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-2 block">Learning Curve</label>
                    <div className="flex gap-2">
                       {['All', 'Low', 'Medium', 'High'].map(curve => (
                         <button
                           key={curve}
                           onClick={() => setFilterCurve(curve)}
                           className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex-1 ${
                             filterCurve === curve 
                               ? 'bg-white text-black border-white font-medium' 
                               : 'bg-black text-neutral-400 border-neutral-800 hover:border-neutral-600'
                           }`}
                         >
                           {curve}
                         </button>
                       ))}
                    </div>
                  </div>

                   {/* Min Score */}
                   <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Min Match Score</label>
                       <span className="text-xs font-mono text-green-400">{minScore}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={minScore} 
                      onChange={(e) => setMinScore(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>

                  {/* Reset */}
                  {(filterCategory !== 'All' || filterCurve !== 'All' || minScore > 0) && (
                     <div className="pt-2 border-t border-neutral-800">
                        <button 
                          onClick={() => {
                            setFilterCategory('All');
                            setFilterCurve('All');
                            setMinScore(0);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 w-full text-center"
                        >
                           Reset Filters
                        </button>
                     </div>
                  )}
               </div>
            )}

            {!searchQuery && !showFilters && (
                <p className="text-[10px] text-neutral-500 text-center mb-2">
                   Ask for anything (e.g., "Build a website", "Legal docs"). Powered by dynamic search.
                </p>
            )}
          </div>
        )}
      </header>

      {/* --- CONTENT AREA --- */}
      
      {activeToolTab === 'guides' && (
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-4">Select a model to master</h3>
            <div className="grid grid-cols-2 gap-4">
              {TOP_MODELS.map(model => (
                <button 
                  key={model} 
                  onClick={() => handleOpenModelGuide(model)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-neutral-800 hover:border-neutral-700 transition-all group aspect-square relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Layout size={32} className="text-neutral-500 group-hover:text-white transition-colors relative z-10" />
                  <span className="text-xs font-medium text-center text-neutral-300 group-hover:text-white relative z-10">{model}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-neutral-600 mt-8 max-w-xs mx-auto">
               Master Guides are dynamically generated using Gemini 2.5 to provide the latest strategies and prompts.
            </p>
         </div>
      )}

      {activeToolTab === 'discovery' && (
        aiToolLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
             <RefreshCw className="animate-spin mb-2" />
             <span className="text-xs">Scouting Tools...</span>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            <p className="text-sm">No tools found matching your filters.</p>
            {searchQuery && (
              <p className="text-xs mt-2 text-neutral-500">Try pressing the arrow button to perform a dynamic AI search.</p>
            )}
            <button onClick={() => {setFilterCategory('All'); setSearchQuery(''); setMinScore(0); setFilterCurve('All');}} className="text-xs text-blue-500 mt-4 underline">Reset All</button>
          </div>
        ) : (
          <div>
            <ToolSection title={isFiltering ? "Filtered Results" : "Most Used"} tools={isFiltering ? filteredTools : groupedTools.major} icon={Star} />
            {!isFiltering && (
              <>
                <ToolSection title="New & Trending" tools={groupedTools.new} icon={TrendingUp} />
                <ToolSection title="Underrated Gems" tools={groupedTools.underrated} icon={Sparkles} />
                <ToolSection title="More Tools" tools={filteredTools.filter(t => !['Major', 'New', 'Underrated'].includes(t.collection))} icon={Grid} />
              </>
            )}
          </div>
        )
      )}
     </div>
  );

  const GuideOverlay = () => {
    if (!selectedGuide) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-300">
         <button onClick={closeGuide} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-50">
            <X size={20} />
         </button>
         
         <div className="relative h-64 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10"></div>
            {selectedGuide.imageUrl ? (
                <img src={selectedGuide.imageUrl} alt="concept" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black"></div>
            )}
            <div className="absolute bottom-6 left-6 z-20">
               <span className="text-xs font-mono text-purple-400 bg-purple-900/20 border border-purple-500/30 px-2 py-1 rounded mb-2 inline-block">MASTER GUIDE</span>
               <h1 className="text-3xl font-bold text-white mb-1">{selectedGuide.modelName}</h1>
               <p className="text-neutral-400 italic">"{selectedGuide.tagline}"</p>
            </div>
         </div>

         <div className="p-6 max-w-2xl mx-auto space-y-8 pb-20">
            
            <section>
               <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Target size={14} /> Best Use Cases
               </h3>
               <div className="grid grid-cols-1 gap-2">
                 {selectedGuide.bestUseCases.map((uc, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg text-sm text-neutral-300 flex items-start gap-3">
                       <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                       {uc}
                    </div>
                 ))}
               </div>
            </section>

            <section>
               <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Zap size={14} /> Hidden Features
               </h3>
               <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  {selectedGuide.hiddenFeatures.map((feat, i) => (
                     <div key={i} className="p-4 border-b border-neutral-800 last:border-0 text-sm text-neutral-300">
                        • {feat}
                     </div>
                  ))}
               </div>
            </section>

            <section>
               <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <MessageSquare size={14} /> Pro Prompts
               </h3>
               <div className="space-y-3">
                  {selectedGuide.promptTemplates.map((prompt, i) => (
                     <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 relative group">
                        <div className="text-xs text-neutral-500 mb-2 font-mono">TEMPLATE {i+1}</div>
                        <p className="text-sm text-neutral-300 font-mono leading-relaxed">{prompt}</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(prompt)}
                          className="absolute top-3 right-3 p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
                          title="Copy"
                        >
                           <FileText size={14} />
                        </button>
                     </div>
                  ))}
               </div>
            </section>

            <section>
               <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <ArrowUpRight size={14} /> Weaknesses
               </h3>
               <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl text-sm text-red-200/80">
                  {selectedGuide.weaknesses}
               </div>
            </section>

         </div>
      </div>
    );
  };

  const LessonOverlay = () => {
    if (!selectedItem) return null;
    
    return (
       <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
             <button onClick={closeLesson} className="p-2 hover:bg-neutral-900 rounded-full">
                <X size={20} />
             </button>
             <span className="text-xs font-mono uppercase tracking-widest">Micro-Lesson</span>
             <div className="w-8"></div>
          </div>

          <div className="flex-1 overflow-y-auto">
             {lessonLoading || !generatedLesson ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                   <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
                   </div>
                   <div>
                      <h3 className="text-lg font-medium mb-1">Generating Curriculum...</h3>
                      <p className="text-sm text-neutral-500">Delta is analyzing "{selectedItem.type === 'update' ? (selectedItem.data as VerifiedUpdate).title : (selectedItem.data as ToolSuggestion).name}" to create a personalized briefing.</p>
                   </div>
                </div>
             ) : (
                <div className="pb-20">
                   {generatedLesson.imageUrl && (
                      <div className="w-full h-48 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                         <img src={generatedLesson.imageUrl} alt="Lesson Header" className="w-full h-full object-cover" />
                      </div>
                   )}
                   
                   <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                         <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded uppercase tracking-wide font-bold">
                            {generatedLesson.duration} Read
                         </span>
                      </div>
                      
                      <h1 className="text-2xl font-light mb-6 leading-tight">{generatedLesson.title}</h1>

                      <div className="space-y-8">
                         <section>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Why It Matters</h3>
                            <p className="text-base text-neutral-200 leading-relaxed">{generatedLesson.whyItMatters}</p>
                         </section>

                         <section className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">The Shift</h3>
                            <p className="text-sm text-neutral-300">{generatedLesson.whatChanged}</p>
                         </section>

                         <section>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Core Concepts</h3>
                            <div className="space-y-3">
                               {generatedLesson.steps.map((step, idx) => (
                                  <div key={idx} className="flex gap-4">
                                     <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-400 border border-neutral-700">
                                        {idx + 1}
                                     </div>
                                     <p className="text-sm text-neutral-300 leading-relaxed pt-0.5">{step}</p>
                                  </div>
                               ))}
                            </div>
                         </section>

                         <section>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Mental Model</h3>
                            <div className="bg-gradient-to-r from-neutral-900 to-black border border-neutral-800 p-4 rounded-xl flex gap-3 items-start">
                               <Lightbulb className="text-yellow-500 shrink-0 mt-1" size={18} />
                               <p className="text-sm text-neutral-300 italic">"{generatedLesson.mentalModel}"</p>
                            </div>
                         </section>
                         
                         <section className="pb-4">
                             <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Practice Task</h3>
                             <p className="text-sm text-neutral-300 border-l-2 border-green-500 pl-4 py-1">{generatedLesson.practiceTask}</p>
                         </section>
                      </div>
                   </div>
                </div>
             )}
          </div>

          {generatedLesson && !lessonLoading && (
             <div className="p-4 border-t border-neutral-800 bg-black">
                <button 
                   onClick={completeLesson}
                   className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
                >
                   Complete Briefing (+{XP_PER_LESSON} XP)
                </button>
             </div>
          )}
       </div>
    );
  };

  const ChatView = () => (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isChatTyping && (
          <div className="flex justify-start">
             <div className="bg-neutral-900 p-3 rounded-2xl rounded-bl-none border border-neutral-800 flex gap-1">
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-neutral-800 bg-black">
         <div className="relative">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Delta..." 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-3 pl-4 pr-12 text-white focus:outline-none focus:border-neutral-700"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isChatTyping}
              className="absolute right-2 top-2 p-1.5 bg-white text-black rounded-full hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Send size={16} />
            </button>
         </div>
      </div>
    </div>
  );

  const ProfileView = () => (
    <div className="p-4 space-y-6 pb-24">
       <div className="text-center py-6">
          <div className="w-20 h-20 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center border border-neutral-700 shadow-xl relative">
             <span className="text-2xl font-bold text-neutral-400">{user.name.charAt(0)}</span>
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>
          </div>
          <h2 className="text-xl text-white font-medium tracking-tight">{user.name}</h2>
          <p className="text-sm text-neutral-500">{user.role} • {user.aiLevel}</p>
       </div>

       <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-end mb-4 relative z-10">
             <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">XP Growth</h3>
                <span className="text-2xl font-bold text-white">{stats.xp} XP</span>
             </div>
             <div className="text-right">
                <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Level {stats.level}</span>
             </div>
          </div>
          
          <GrowthChart />
       </div>

       <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
             <Trophy size={20} className="text-yellow-500 mb-2" />
             <span className="text-xl font-bold text-white">{stats.lessonsCompleted}</span>
             <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Lessons</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
             <Flame size={20} className="text-orange-500 mb-2" />
             <span className="text-xl font-bold text-white">{stats.streak}</span>
             <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Day Streak</span>
          </div>
       </div>

       <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Target size={14} /> Learning Goals
          </h3>
          <div className="flex flex-wrap gap-2">
             {user.goals.map(g => (
                <span key={g} className="text-xs bg-black border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-300">
                   {g}
                </span>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-hidden">
      <div className="max-w-md mx-auto h-screen flex flex-col relative bg-black shadow-2xl">
         
         {activeTab !== 'profile' && <Header />}

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto px-6 scrollbar-hide pt-6">
            {activeTab === 'today' && <TodayView />}
            {activeTab === 'updates' && <UpdatesView />}
            {activeTab === 'tools' && <ToolsView />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'profile' && <ProfileView />}
         </div>

         {/* Bottom Navigation */}
         <div className="h-20 bg-black/90 backdrop-blur-md border-t border-neutral-900 px-6 flex items-center justify-between shrink-0 relative z-30">
            <button 
              onClick={() => setActiveTab('today')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'today' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
               <Grid size={20} />
               <span className="text-[9px] font-medium uppercase tracking-wide">Today</span>
            </button>
            <button 
              onClick={() => setActiveTab('updates')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'updates' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
               <Activity size={20} />
               <span className="text-[9px] font-medium uppercase tracking-wide">Updates</span>
            </button>
            <button 
              onClick={() => setActiveTab('tools')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'tools' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
               <Search size={20} />
               <span className="text-[9px] font-medium uppercase tracking-wide">Tools</span>
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chat' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
               <MessageSquare size={20} />
               <span className="text-[9px] font-medium uppercase tracking-wide">Delta</span>
            </button>
         </div>

         {/* Modals & Overlays */}
         {selectedItem && <LessonOverlay />}
         {selectedGuide && <GuideOverlay />}
         {showLevelUpModal && <LevelUpModal newLevel={stats.level} onClose={() => setShowLevelUpModal(false)} />}

      </div>
    </div>
  );
};