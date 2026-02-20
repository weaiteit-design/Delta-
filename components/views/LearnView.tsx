import React, { useState } from 'react';
import { ToolSuggestion, UserContext } from '../../types';
import { deltaService } from '../../services/deltaService';
import { ChevronRight, Sparkles, Star } from 'lucide-react';

interface LearnViewProps {
    user: UserContext;
    onSelectTool: (tool: ToolSuggestion) => void;
}

// Dynamic tools mapped by interest category
const INTEREST_TOOLS: Record<string, Array<{ id: string; name: string; description: string; domain: string }>> = {
    creative: [
        { id: 'midjourney', name: 'Midjourney', description: 'AI image generation for design and art', domain: 'midjourney.com' },
        { id: 'runway', name: 'Runway', description: 'AI video generation and editing', domain: 'runwayml.com' },
        { id: 'canva-ai', name: 'Canva AI', description: 'AI-powered design and templates', domain: 'canva.com' },
    ],
    business: [
        { id: 'notion-ai', name: 'Notion AI', description: 'AI writing and productivity assistant', domain: 'notion.so' },
        { id: 'jasper', name: 'Jasper', description: 'AI marketing and business content', domain: 'jasper.ai' },
        { id: 'copy-ai', name: 'Copy.ai', description: 'AI copywriting for sales and marketing', domain: 'copy.ai' },
    ],
    development: [
        { id: 'github-copilot', name: 'GitHub Copilot', description: 'AI pair programmer for developers', domain: 'github.com' },
        { id: 'cursor', name: 'Cursor', description: 'AI-first code editor', domain: 'cursor.sh' },
        { id: 'v0-dev', name: 'v0.dev', description: 'AI UI generation by Vercel', domain: 'v0.dev' },
    ],
    writing: [
        { id: 'grammarly', name: 'Grammarly', description: 'AI writing assistant and editor', domain: 'grammarly.com' },
        { id: 'writesonic', name: 'Writesonic', description: 'AI content writer', domain: 'writesonic.com' },
        { id: 'claude-writing', name: 'Claude for Writing', description: 'Advanced AI writing with Claude', domain: 'claude.ai' },
    ],
    research: [
        { id: 'perplexity', name: 'Perplexity AI', description: 'AI research and answer engine', domain: 'perplexity.ai' },
        { id: 'consensus', name: 'Consensus', description: 'AI-powered academic search', domain: 'consensus.app' },
        { id: 'elicit', name: 'Elicit', description: 'AI research assistant', domain: 'elicit.com' },
    ],
    productivity: [
        { id: 'zapier-ai', name: 'Zapier AI', description: 'AI-powered workflow automation', domain: 'zapier.com' },
        { id: 'otter', name: 'Otter.ai', description: 'AI meeting transcription', domain: 'otter.ai' },
        { id: 'mem', name: 'Mem', description: 'AI-powered note taking', domain: 'mem.ai' },
    ],
    media: [
        { id: 'descript', name: 'Descript', description: 'AI video and podcast editing', domain: 'descript.com' },
        { id: 'pika', name: 'Pika', description: 'AI video generation', domain: 'pika.art' },
        { id: 'luma', name: 'Luma AI', description: 'AI 3D and video creation', domain: 'lumalabs.ai' },
    ],
    marketing: [
        { id: 'surfer', name: 'Surfer SEO', description: 'AI SEO optimization', domain: 'surferseo.com' },
        { id: 'adcreative', name: 'AdCreative.ai', description: 'AI ad generation', domain: 'adcreative.ai' },
        { id: 'hootsuite-ai', name: 'Hootsuite AI', description: 'AI social media management', domain: 'hootsuite.com' },
    ],
    music: [
        { id: 'suno', name: 'Suno AI', description: 'AI music generation', domain: 'suno.ai' },
        { id: 'udio', name: 'Udio', description: 'AI music creation', domain: 'udio.com' },
        { id: 'elevenlabs', name: 'ElevenLabs', description: 'AI voice and audio', domain: 'elevenlabs.io' },
    ],
    personal: [
        { id: 'replika', name: 'Replika', description: 'AI companion for conversations', domain: 'replika.com' },
        { id: 'pi', name: 'Pi AI', description: 'Personal AI assistant by Inflection', domain: 'pi.ai' },
        { id: 'duolingo-ai', name: 'Duolingo Max', description: 'AI-powered language learning', domain: 'duolingo.com' },
    ],
};

export const LearnView: React.FC<LearnViewProps> = ({ user, onSelectTool }) => {
    const allTools = deltaService.getFallbackTools();
    const majorTools = allTools.filter(t => t.collection === 'Major');

    // Get personalized tools based on user interests directly from prop
    const userInterests = user.techStack || [];
    const personalizedTools: Array<{ id: string; name: string; description: string; domain: string }> = [];

    userInterests.forEach(interest => {
        const tools = INTEREST_TOOLS[interest];
        if (tools) {
            personalizedTools.push(...tools);
        }
    });

    // Convert to ToolSuggestion format for consistency
    const specializedTools: ToolSuggestion[] = personalizedTools.slice(0, 9).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        domain: t.domain,
        matchScore: 90,
        tags: [],
        trending: false,
        category: 'Specialized',
        collection: 'New' as const,
        useCases: [],
        bestFor: [],
        learningCurve: 'Low' as const,
        deltaAnalysis: '',
        url: `https://${t.domain}`
    }));


    return (
        <div className="pt-4 pb-20 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-2xl font-light text-white mb-2">Tool Mastery</h1>
                <p className="text-neutral-400 text-sm">
                    {userInterests.length > 0
                        ? `Personalized for your interests: ${userInterests.join(', ')}`
                        : 'Select interests on Home to see personalized tools'}
                </p>
            </header>

            {/* MAJOR TOOLS */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Star size={12} className="text-yellow-500" fill="currentColor" /> Core Essentials
                </h2>
                <div className="space-y-3">
                    {majorTools.map(tool => <LearnToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />)}
                </div>
            </section>

            {/* PERSONALIZED SPECIALIZED KIT */}
            {specializedTools.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={12} className="text-purple-500" /> Your Specialized Kit
                    </h2>
                    <div className="space-y-3">
                        {specializedTools.map(tool => <LearnToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />)}
                    </div>
                </section>
            )}

            {/* NO INTERESTS SELECTED */}
            {specializedTools.length === 0 && (
                <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 text-center">
                    <Sparkles className="mx-auto text-purple-500 mb-3" size={32} />
                    <h3 className="text-white font-medium mb-2">Personalize Your Toolkit</h3>
                    <p className="text-neutral-400 text-sm mb-4">
                        Select your interests on the Home tab to see tools tailored for you.
                    </p>
                </section>
            )}
        </div>
    );
};

const LearnToolCard = ({ tool, onSelect }: { tool: ToolSuggestion, onSelect: (t: ToolSuggestion) => void }) => {
    const [imgError, setImgError] = useState(false);
    const domain = tool.domain || (tool.url ? new URL(tool.url).hostname : null);
    const logoUrl = tool.logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

    return (
        <button
            onClick={() => onSelect(tool)}
            className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-4 hover:border-neutral-600 transition-all group text-left"
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border overflow-hidden ${tool.collection === 'Major' ? 'bg-white border-white' : 'bg-neutral-800 border-neutral-700'}`}>
                {logoUrl && !imgError ? (
                    <img
                        src={logoUrl}
                        alt={tool.name}
                        className="w-8 h-8 object-contain"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className={`text-lg font-bold ${tool.collection === 'Major' ? 'text-black' : 'text-neutral-400'}`}>
                        {tool.name.substring(0, 2).toUpperCase()}
                    </span>
                )}
            </div>

            <div className="flex-1">
                <div className="flex justify-between mb-0.5">
                    <h3 className="text-white font-medium">{tool.name}</h3>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(l => <div key={l} className="w-1 h-3 bg-neutral-700 rounded-full" />)}
                    </div>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-1">{tool.description}</p>
            </div>

            <ChevronRight size={20} className="text-neutral-700 group-hover:text-white" />
        </button>
    );
};
