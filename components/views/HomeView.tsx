import React, { useState, useEffect } from 'react';
import { UserContext, UserStats, VerifiedUpdate, DailyLifeHack, ToolSuggestion, MicroLesson } from '../../types';
import { Play, Zap, CheckCircle2, TrendingUp, BarChart3, ArrowUpRight, Sliders, Target, ArrowRight, Loader2 } from 'lucide-react';
import { StackSelector } from '../StackSelector';
import { storageService } from '../../services/storageService';
import { deltaService } from '../../services/deltaService';
import { ToolCard } from '../ToolCard';

interface HomeViewProps {
    user: UserContext;
    stats: UserStats;
    updates: VerifiedUpdate[];
    tools: ToolSuggestion[];
    dailyHack: DailyLifeHack | null;
    loading: boolean;
    onStartLesson: (item: VerifiedUpdate | ToolSuggestion) => void;
    onTabChange: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
    user, stats, updates, tools, dailyHack, loading, onStartLesson, onTabChange
}) => {
    // State for Stack Selector
    const [showStackSelector, setShowStackSelector] = useState(false);
    const [myStack, setMyStack] = useState<string[]>(user.techStack || []);
    const [dynamicUpdates, setDynamicUpdates] = useState<VerifiedUpdate[]>([]);
    const [fetchingInterests, setFetchingInterests] = useState(false);
    const [interestLesson, setInterestLesson] = useState<MicroLesson | null>(null);

    // Fetch interest-specific news when interests change
    useEffect(() => {
        if (myStack.length > 0) {
            setFetchingInterests(true);
            deltaService.fetchNewsForInterests(myStack).then(news => {
                setDynamicUpdates(news);
                setFetchingInterests(false);
            }).catch(() => setFetchingInterests(false));
        } else {
            setDynamicUpdates([]);
        }
    }, [myStack]);

    const toggleStack = (category: string) => {
        const newStack = myStack.includes(category)
            ? myStack.filter(t => t !== category)
            : [...myStack, category];
        setMyStack(newStack);
        const updatedUser = { ...user, techStack: newStack };
        storageService.saveUser(updatedUser);

        // Generate a lesson for the newly added interest
        if (!myStack.includes(category)) {
            deltaService.generateInterestLesson(category).then(lesson => {
                if (lesson) setInterestLesson(lesson);
            });
        }
    };

    // Filter updates based on user's selected interest categories
    const stackUpdates = updates.filter(u => {
        if (myStack.length === 0) return true;
        if (u.interests && u.interests.length > 0) {
            return u.interests.some(interest => myStack.includes(interest));
        }
        const searchText = (u.title + u.shortSummary).toLowerCase();
        return myStack.some(cat => searchText.includes(cat.toLowerCase()));
    });

    // Prioritize dynamically fetched news for selected interests
    const displayUpdates = dynamicUpdates.length > 0 ? dynamicUpdates : (stackUpdates.length > 0 ? stackUpdates : updates);
    const isProMode = myStack.length > 0;

    // Filter for "New" or "Trending" tools for the Home Feed
    const featuredTools = tools.filter(t => t.trending || t.collection === 'New').slice(0, 3);

    // relevance calculation based on matching interests
    const relevanceScore = isProMode ? Math.min(98, 85 + (myStack.length * 3)) : 75;

    if (loading && updates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-500 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-neutral-800 border-t-white animate-spin mb-4" />
                <p className="text-xs uppercase tracking-widest">Optimizing your feed...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pt-4 pb-20 animate-in fade-in duration-500">

            {/* HEADER */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-light text-white mb-1">
                        Hello, <span className="font-medium">{user.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-neutral-500 text-sm">Level {user.aiLevel} • {user.role}</p>
                </div>
                {/* PRO TRIGGER */}
                <button
                    onClick={() => setShowStackSelector(!showStackSelector)}
                    className={`p-2 rounded-full border transition-all ${showStackSelector || isProMode ? 'bg-neutral-800 border-green-500/50 text-green-400' : 'border-neutral-800 text-neutral-500 hover:text-white'}`}
                >
                    <Sliders size={20} />
                </button>
            </header>

            {/* STACK SELECTOR (Expandable) */}
            {showStackSelector && (
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl mb-4">
                    <StackSelector selectedStack={myStack} onToggleStack={toggleStack} />

                    {/* Loading indicator for interest fetch */}
                    {fetchingInterests && (
                        <div className="flex items-center gap-2 mt-4 text-neutral-400 text-sm">
                            <Loader2 size={16} className="animate-spin" />
                            Fetching personalized AI news...
                        </div>
                    )}
                </div>
            )}

            {/* RECOMMENDED TOOL LESSON CARD */}
            {interestLesson && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 p-4 rounded-xl mb-4 animate-in slide-in-from-top duration-500">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">✨ Recommended Tool</p>
                            <h3 className="text-white font-medium">{interestLesson.title}</h3>
                        </div>
                        <button
                            onClick={() => setInterestLesson(null)}
                            className="text-neutral-500 hover:text-white p-1"
                        >
                            ×
                        </button>
                    </div>

                    <p className="text-sm text-neutral-300 mb-3">{interestLesson.whyItMatters}</p>

                    {/* Tool info */}
                    {(interestLesson as any).recommendedTool && (
                        <div className="flex items-center gap-3 bg-black/30 p-3 rounded-lg mb-3">
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${(interestLesson as any).recommendedTool.domain}&sz=64`}
                                alt={(interestLesson as any).recommendedTool.tool}
                                className="w-8 h-8 rounded"
                            />
                            <div className="flex-1">
                                <span className="text-white font-medium">{(interestLesson as any).recommendedTool.tool}</span>
                                <p className="text-xs text-neutral-400">{(interestLesson as any).recommendedTool.description}</p>
                            </div>
                            <a
                                href={`https://${(interestLesson as any).recommendedTool.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                Visit →
                            </a>
                        </div>
                    )}

                    {/* Task prompt with copy */}
                    {interestLesson.taskPrompt && (
                        <div className="bg-black/40 p-3 rounded-lg border border-neutral-700 mb-3">
                            <p className="text-xs text-neutral-300 font-mono mb-2">"{interestLesson.taskPrompt}"</p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(interestLesson.taskPrompt || '');
                                }}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                📋 Copy prompt
                            </button>
                        </div>
                    )}

                    <button
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-2"
                        onClick={() => onStartLesson(interestLesson)}
                    >
                        <Play size={14} /> View Full Lesson
                    </button>
                </div>
            )}

            {/* 1. RELEVANCE & DOPAMINE HEADER */}
            <section className="relative overflow-hidden mb-6">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-xl font-light text-white mb-1">
                            Profile <span className="text-green-400 font-bold">{relevanceScore}%</span> optimized.
                        </h1>
                        <p className="text-neutral-500 text-xs uppercase tracking-wider">
                            Based on {myStack.length > 0 ? `${myStack.length} active tools` : "general habits"}
                        </p>
                    </div>
                    {/* Simple Sparkline Visual */}
                    <div className="flex items-end gap-1 h-12">
                        {[40, 65, 50, 80, 60, 90, 100].map((h, i) => (
                            <div key={i} className="w-2 bg-gradient-to-t from-blue-900 to-blue-500 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%`, opacity: (i + 3) / 10 }} />
                        ))}
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full z-0 transition-transform group-hover:scale-110" />
                        <BarChart3 size={20} className="text-blue-400 mb-2 relative z-10" />
                        <div>
                            <div className="text-2xl font-bold text-white leading-none mb-1">{stats.xp}</div>
                            <div className="text-[10px] text-neutral-500 uppercase font-medium">Knowledge XP</div>
                        </div>
                    </div>

                    <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full z-0 transition-transform group-hover:scale-110" />
                        <Zap size={20} className="text-green-400 mb-2 relative z-10" />
                        <div>
                            <div className="text-2xl font-bold text-white leading-none mb-1">{stats.streak}</div>
                            <div className="text-[10px] text-neutral-500 uppercase font-medium">Day Streak</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. DAILY HACK (Quick Win) */}
            {dailyHack && (
                <div
                    onClick={() => onStartLesson({ ...dailyHack, name: dailyHack.title, description: dailyHack.action } as any)}
                    className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 p-5 rounded-2xl cursor-pointer hover:border-white/20 transition-all active:scale-[0.98] group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                            <Zap size={10} fill="currentColor" /> Quick Win
                        </span>
                        <ArrowUpRight size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1 group-hover:text-blue-200">{dailyHack.title}</h3>
                    <p className="text-sm text-neutral-400 line-clamp-2">{dailyHack.impact}</p>
                </div>
            )}

            {/* 3. ACTIONABLE UPDATES */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12} className={isProMode ? "text-green-500" : "text-yellow-500"} fill="currentColor" />
                        {isProMode ? "My Stack Updates" : "Actionable Updates"}
                    </h2>
                    <button onClick={() => onTabChange('updates')} className="text-xs text-neutral-600 hover:text-white transition-colors">View All</button>
                </div>

                <div className="space-y-3">
                    {displayUpdates.slice(0, 3).map(update => (
                        <div key={update.id} className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer" onClick={() => onStartLesson(update)}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${update.relevanceScore > 90 ? 'bg-green-900/20 text-green-500' : 'bg-neutral-800 text-neutral-400'
                                }`}>
                                <Target size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white text-sm font-medium truncate">{update.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">{update.source}</span>
                                    <span className="text-[10px] text-neutral-500">{new Date(update.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {displayUpdates.length === 0 && (
                        <div className="text-center text-neutral-500 text-xs py-4">
                            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No major updates for your active stack.</p>
                            <button onClick={() => setMyStack([])} className="text-blue-400 mt-2 hover:underline">Show global feed</button>
                        </div>
                    )}
                </div>
            </section>
            {/* 4. NEW TOOLS FOR YOU */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                        New Tools For You
                    </h2>
                    <button onClick={() => onTabChange('trending')} className="text-xs text-blue-400 hover:text-white transition-colors">View all</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {featuredTools.length > 0 ? (
                        featuredTools.map(tool => (
                            <ToolCard key={tool.id} tool={tool} onClick={onStartLesson} />
                        ))
                    ) : (
                        <p className="text-neutral-500 text-sm">No new tools discovered.</p>
                    )}
                </div>
            </section >
        </div >
    );
};
