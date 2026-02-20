import React, { useMemo, useState } from 'react';
import { ToolSuggestion, UserContext, VerifiedUpdate } from '../../types';
import { TrendingUp, Sparkles, Search, MessageSquare, ArrowRight, Filter, Zap, RefreshCw } from 'lucide-react';
import { deltaService } from '../../services/deltaService';
import { ToolCard } from '../ToolCard';

interface TrendingViewProps {
    user: UserContext;
    tools: ToolSuggestion[];
    updates?: VerifiedUpdate[];
    onStartLesson: (tool: ToolSuggestion | VerifiedUpdate) => void;
    loading: boolean;
}

export const TrendingView: React.FC<TrendingViewProps> = ({ user, tools = [], updates = [], onStartLesson, loading: initialLoading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [localTools, setLocalTools] = useState<ToolSuggestion[]>(tools || []);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'tools' | 'news'>('tools');

    // Ensure we always have arrays
    const safeTools = Array.isArray(tools) ? tools : [];
    const safeLocalTools = Array.isArray(localTools) ? localTools : [];

    // Use local tools if we have search results, otherwise props tools
    const displayTools = searchQuery && safeLocalTools.length !== safeTools.length ? safeLocalTools : safeTools;

    // Filter for High Relevance News
    const trendingNews = updates.filter(u => u.relevanceScore >= 80).slice(0, 5);

    const formatTime = (dateString: string) => {
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return 'Just now';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Just now';
        }
    };

    const handleAiSearch = async () => {
        if (!searchQuery.trim()) return;
        setAiLoading(true);
        setLocalTools([]);
        const newTools = await deltaService.findToolsForUseCase(searchQuery, user);
        setLocalTools(newTools || []);
        setAiLoading(false);
    };

    const groupedTools = useMemo(() => {
        if (!displayTools || !Array.isArray(displayTools)) return { major: [], new: [], underrated: [] };

        return {
            major: displayTools.filter(t => t && t.collection === 'Major'),
            new: displayTools.filter(t => t && t.collection === 'New'),
            underrated: displayTools.filter(t => t && t.collection === 'Underrated'),
        };
    }, [displayTools]);

    return (
        <div className="pb-24 pt-4 px-1 animate-in fade-in duration-500">
            <header className="mb-6 sticky top-0 bg-black/95 backdrop-blur-xl z-20 pb-4 border-b border-neutral-900 pt-2 -mx-1 px-1">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-medium text-white">Trending</h2>
                </div>
                <p className="text-neutral-500 text-xs mb-4">What's happening right now in AI.</p>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-neutral-500" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                            placeholder="Find a tool..."
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-neutral-600 placeholder:text-neutral-600"
                        />
                    </div>
                    <button
                        onClick={handleAiSearch}
                        disabled={aiLoading || !searchQuery.trim()}
                        className="bg-white text-black rounded-lg px-4 font-bold flex items-center justify-center disabled:opacity-50"
                    >
                        {aiLoading ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={20} />}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-neutral-800 pb-2">
                    <button onClick={() => setActiveTab('tools')} className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'tools' ? 'text-white' : 'text-neutral-500'}`}>
                        Trending Tools
                        {activeTab === 'tools' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />}
                    </button>
                    <button onClick={() => setActiveTab('news')} className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'news' ? 'text-white' : 'text-neutral-500'}`}>
                        Just In News
                        {activeTab === 'news' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />}
                    </button>
                </div>
            </header>

            {/* Show Loading state OR List */}
            {(initialLoading || aiLoading) && (!displayTools || displayTools.length === 0) ? (
                <div className="p-10 text-center text-neutral-500 flex flex-col items-center">
                    <RefreshCw className="animate-spin mb-2" />
                    <p className="text-xs uppercase tracking-widest">Scanning trending repos...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {activeTab === 'news' ? (
                        /* TRENDING NEWS SECTION */
                        <div>
                            {trendingNews.length > 0 ? (
                                <div className="space-y-3">
                                    {trendingNews.map(news => (
                                        <div key={news.id} className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col gap-2 hover:bg-neutral-900 transition-colors cursor-pointer" onClick={() => onStartLesson(news)}>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[9px] uppercase tracking-wider text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">{news.source || 'News'}</span>
                                                <span className="text-[10px] text-neutral-500">{formatTime(news.date)}</span>
                                            </div>
                                            <h4 className="text-white font-medium text-sm leading-snug">{news.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <TrendingUp size={12} className="text-green-500" />
                                                <span className="text-[10px] text-neutral-400">Trending in global discussions</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-neutral-500 text-sm py-4 text-center">No breaking news right now.</p>
                            )}
                        </div>
                    ) : (
                        /* TOOLS SECTION */
                        <div>
                            {groupedTools.major.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest pl-1">Global Standards</h3>
                                    <div className="space-y-3">
                                        {groupedTools.major.map(t => <ToolCard key={t.id} tool={t} onClick={onStartLesson} />)}
                                    </div>
                                </div>
                            )}
                            {groupedTools.new.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest pl-1">Breaking Out</h3>
                                    <div className="space-y-3">
                                        {groupedTools.new.map(t => <ToolCard key={t.id} tool={t} onClick={onStartLesson} />)}
                                    </div>
                                </div>
                            )}
                            {groupedTools.underrated.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest pl-1">Hidden Gems</h3>
                                    <div className="space-y-3">
                                        {groupedTools.underrated.map(t => <ToolCard key={t.id} tool={t} onClick={onStartLesson} />)}
                                    </div>
                                </div>
                            )}

                            {displayTools.length === 0 && (
                                <div className="text-center text-neutral-500 py-10">
                                    No trending tools found matching your criteria.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
