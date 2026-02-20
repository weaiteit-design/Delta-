import React, { useState } from 'react';
import { VerifiedUpdate, ToolSuggestion, UpdateType } from '../../types';
import { Twitter, Globe, Search, ArrowUpRight } from 'lucide-react';

interface UpdatesViewProps {
    updates: VerifiedUpdate[];
    loading: boolean;
    onStartLesson: (update: VerifiedUpdate) => void;
}

export const UpdatesView: React.FC<UpdatesViewProps> = ({ updates, loading, onStartLesson }) => {
    const [activeFilter, setFilter] = useState('All');

    const filteredUpdates = updates.filter(u => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Models') return u.updateType === UpdateType.MajorRelease || u.updateType === UpdateType.Capability;
        if (activeFilter === 'Tools') return u.updateType === UpdateType.NewTool;
        if (activeFilter === 'Regulation') return u.title.toLowerCase().includes('regulation') || u.shortSummary.toLowerCase().includes('law') || u.shortSummary.toLowerCase().includes('ban');
        return true;
    });
    return (
        <div className="space-y-6 pt-4 pb-20 animate-in fade-in duration-500">

            <header className="mb-6">
                <h1 className="text-2xl font-light text-white mb-2">Global AI Shifts</h1>
                <p className="text-neutral-400 text-sm">
                    Real-time signals from Twitter, Reddit, and Tech News.
                </p>
            </header>

            {/* FILTER TABS */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                {['All', 'Models', 'Tools', 'Regulation'].map((filter, i) => (
                    <button
                        key={filter}
                        onClick={() => setFilter(filter)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${activeFilter === filter ? 'bg-white text-black border-white' : 'text-neutral-500 border-neutral-800 hover:border-neutral-600'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-neutral-500">Scanning global networks...</div>
                ) : (
                    filteredUpdates.length > 0 ? (
                        filteredUpdates.map((update, i) => (
                            <div
                                key={update.id}
                                className="border-b border-neutral-800 pb-4 last:border-0"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono uppercase">
                                        {i % 2 === 0 ? <Twitter size={12} className="text-blue-400" /> : <Globe size={12} />}
                                        <span>{update.source || 'WEB SIGNAL'}</span>
                                        <span>•</span>
                                        <span>{new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded text-[10px]">
                                        {(update.relevanceScore / 10).toFixed(1)} Impact
                                    </div>
                                </div>

                                <h3 className="text-base text-white font-medium mb-1 leading-snug">
                                    {update.title}
                                </h3>
                                <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
                                    {update.shortSummary}
                                </p>

                                <div className="flex gap-3">
                                    {update.url && (
                                        <a
                                            href={update.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            Source <ArrowUpRight size={12} />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => onStartLesson(update)}
                                        className="text-xs text-white hover:text-neutral-300 flex items-center gap-1"
                                    >
                                        Analyze <Search size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-neutral-500 text-sm">No updates found for "{activeFilter}".</div>
                    )
                )}
            </div>
        </div>
    );
};
