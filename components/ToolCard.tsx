import React, { useState } from 'react';
import { ToolSuggestion } from '../types';
import { ArrowRight, Star, ExternalLink, Plus } from 'lucide-react';

interface ToolCardProps {
    tool: ToolSuggestion;
    onClick: (tool: ToolSuggestion) => void;
    compact?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick, compact = false }) => {
    const [imgError, setImgError] = useState(false);

    // Extract domain from URL for logo fetching
    const getDomain = () => {
        if (tool.domain) return tool.domain;
        if (tool.url) {
            try {
                return new URL(tool.url).hostname;
            } catch { return null; }
        }
        return null;
    };

    const domain = getDomain();
    // Use multiple favicon sources for reliability
    const logoUrl = tool.logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

    return (
        <div
            onClick={() => onClick(tool)}
            className={`group bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-4 hover:border-neutral-600 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] ${compact ? 'p-3' : 'p-4'}`}
        >
            {/* Logo / Icon */}
            <div className="shrink-0 relative">
                {logoUrl && !imgError ? (
                    <img
                        src={logoUrl}
                        alt={tool.name}
                        className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-800 to-black border border-neutral-700 flex items-center justify-center font-bold text-lg text-white">
                        {tool.name.substring(0, 2).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="text-white font-medium text-sm truncate pr-2 group-hover:text-blue-400 transition-colors">
                        {tool.name}
                    </h3>
                    {tool.trending && (
                        <span className="text-[10px] font-bold text-yellow-500 bg-yellow-900/20 px-1.5 py-0.5 rounded border border-yellow-900/30">
                            HOT
                        </span>
                    )}
                </div>
                <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{tool.description}</p>
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
                        {tool.tags && tool.tags.length > 0 ? tool.tags[0] : (tool.category || 'Tool')}
                    </span>
                </div>
            </div>

            {/* Action Icon */}
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                <ArrowRight size={14} />
            </div>
        </div>
    );
};
