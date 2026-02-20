import React from 'react';
import { UserContext, UserStats } from '../../types';
import { Trophy, Target, Award, CheckCircle2, Zap } from 'lucide-react';
import { LEVEL_SYSTEM } from '../../constants';

interface LibraryViewProps {
    user: UserContext;
    stats: UserStats;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ user, stats }) => {
    // Safety check: ensure stats and LEVEL_SYSTEM exist
    const safeXP = stats?.xp || 0;
    const safeLevel = stats?.level || 1;
    const currentLevelConfig = LEVEL_SYSTEM.find(l => l.level === safeLevel) || LEVEL_SYSTEM[0];
    const toolsLearned = stats?.toolsMastered || 0; // Fallback if undefined

    return (
        <div className="pb-24 pt-4 px-1 space-y-6">

            {/* Hero Stat */}
            <div className="text-center py-8 border-b border-neutral-900">
                <div className={`w-24 h-24 rounded-full border-4 ${currentLevelConfig.border} flex items-center justify-center bg-neutral-900 mx-auto mb-4`}>
                    <Trophy size={40} className={currentLevelConfig.color} />
                </div>
                <h2 className="text-3xl font-light text-white mb-2">{currentLevelConfig.title}</h2>
                <p className="text-neutral-500 text-sm">Level {stats.level} • {stats.xp} XP</p>
            </div>

            {/* Proof of Progress Statement */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <p className="text-white text-lg font-medium leading-relaxed">
                    "You now know how to use <span className="text-blue-400">{toolsLearned} AI tools</span> effectively."
                </p>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="text-green-500" size={24} />
                    <span className="text-2xl font-bold text-white">{stats.lessonsCompleted}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Lessons Done</span>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Zap className="text-yellow-500" size={24} />
                    <span className="text-2xl font-bold text-white">{stats.streak}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Day Streak</span>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Target className="text-blue-500" size={24} />
                    <span className="text-2xl font-bold text-white">{stats.skillsUnlocked || 0}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Skills Unlocked</span>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Award className="text-purple-500" size={24} />
                    <span className="text-2xl font-bold text-white">Top 5%</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Rank</span>
                </div>
            </div>

            {/* History (Placeholder) */}
            <div className="pt-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {/* Mock Data for MVP visualization */}
                    {[1, 2].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3 border-b border-neutral-900 last:border-0 opacity-50 grayscale">
                            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={14} className="text-neutral-500" />
                            </div>
                            <div>
                                <p className="text-white text-sm">Completed "Understanding R1"</p>
                                <p className="text-[10px] text-neutral-600">2 days ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
