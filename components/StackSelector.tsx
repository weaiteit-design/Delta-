import React from 'react';
import { Check, Plus, Palette, Briefcase, Code, PenTool, BookOpen, Zap, Camera, TrendingUp, Headphones, Heart } from 'lucide-react';

interface StackSelectorProps {
    selectedStack: string[];
    onToggleStack: (category: string) => void;
}

// Application categories for personalized content
const INTEREST_CATEGORIES = [
    { id: 'creative', name: 'Creative', icon: Palette, desc: 'Design, Art, Video' },
    { id: 'business', name: 'Business', icon: Briefcase, desc: 'Marketing, Sales, Finance' },
    { id: 'development', name: 'Development', icon: Code, desc: 'Coding, APIs, DevOps' },
    { id: 'writing', name: 'Writing', icon: PenTool, desc: 'Content, Copy, Scripts' },
    { id: 'research', name: 'Research', icon: BookOpen, desc: 'Academic, Data, Analysis' },
    { id: 'productivity', name: 'Productivity', icon: Zap, desc: 'Automation, Workflows' },
    { id: 'media', name: 'Media', icon: Camera, desc: 'Photo, Video, Audio' },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp, desc: 'Ads, SEO, Growth' },
    { id: 'music', name: 'Music & Audio', icon: Headphones, desc: 'Production, Editing' },
    { id: 'personal', name: 'Personal', icon: Heart, desc: 'Health, Learning, Life' },
];

export const StackSelector: React.FC<StackSelectorProps> = ({ selectedStack = [], onToggleStack }) => {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-medium text-white">My Interests</h2>
                    <p className="text-xs text-neutral-400">Select categories to personalize your AI feed & lessons.</p>
                </div>
                <span className="text-xs font-mono text-green-500 bg-green-900/20 px-2 py-1 rounded border border-green-900/50">
                    {selectedStack.length} Selected
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {INTEREST_CATEGORIES.map((cat) => {
                    const isSelected = selectedStack.includes(cat.id);
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onToggleStack(cat.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${isSelected
                                ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                                }`}
                        >
                            <Icon size={14} />
                            {cat.name}
                        </button>
                    );
                })}
            </div>

            {selectedStack.length === 0 && (
                <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg text-yellow-500 text-xs flex items-center gap-2">
                    <span className="shrink-0 text-lg">💡</span>
                    Select at least 2 interests to personalize your AI updates & lessons.
                </div>
            )}
        </div>
    );
};
