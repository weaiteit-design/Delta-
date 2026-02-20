import { GoogleGenAI, Chat } from "@google/genai";
import { AGENT_PROMPTS } from "../constants";
import {
  RawUpdateSignal,
  VerifiedUpdate,
  UserContext,
  MicroLesson,
  ToolSuggestion,
  DailyLifeHack,
  ModelGuide,
  UpdateType,
  LearnCategory
} from "../types";

// ==========================================
// CURATED MASTER TOOLS (The "Big List" - Feb 2026 Edition)
// ==========================================
const CURATED_TOOLS: ToolSuggestion[] = [
  {
    id: 'master-1',
    name: 'ChatGPT',
    category: 'Reasoning Engine',
    collection: 'Major',
    description: 'The global standard. Now features "Instant Reasoning" and deep agentic workflows.',
    useCases: ['Complex Planning', 'Agent Orchestration', 'Multimodal Analysis'],
    bestFor: ['Everyone'],
    matchScore: 100,
    learningCurve: 'Low',
    deltaAnalysis: 'Significantly faster and smarter than previous versions. It just works.',
    trending: true,
    url: 'https://openai.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128'
  },
  {
    id: 'master-2',
    name: 'Claude',
    category: 'Coding & Agents',
    collection: 'Major',
    description: 'Anthropic\'s flagship. The undisputed king of coding and complex, nuanced writing.',
    useCases: ['Full-Stack Development', 'Novel Writing', 'Research Synthesis'],
    bestFor: ['Developers', 'Writers'],
    matchScore: 99,
    learningCurve: 'Medium',
    deltaAnalysis: 'If you code or write professionally, this is your daily driver. "Computer Use" is flawless.',
    trending: true,
    url: 'https://claude.ai',
    logoUrl: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=128'
  },
  {
    id: 'master-3',
    name: 'Gemini',
    category: 'Multimodal',
    collection: 'Major',
    description: 'Google\'s best. Infinite context window (10M+) and native real-time video understanding.',
    useCases: ['Analyzing Entire Codebases', 'Video Processing', 'Live Translation'],
    bestFor: ['Power Users', 'Enterprises'],
    matchScore: 98,
    learningCurve: 'Medium',
    deltaAnalysis: 'Unbeatable for large data context. It remembers everything.',
    trending: true,
    url: 'https://gemini.google.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128'
  },
  {
    id: 'master-4',
    name: 'DeepSeek',
    category: 'Reasoning',
    collection: 'Major',
    description: 'The open-source phenomenon. Matches proprietary models in math/code at a fraction of the cost.',
    useCases: ['Math Proofs', 'Local LLM Logic', 'Cost-Efficient Analysis'],
    bestFor: ['Researchers', 'Open Source Fans'],
    matchScore: 97,
    learningCurve: 'Medium',
    deltaAnalysis: 'The industry disruptor. Incredible reasoning density.',
    trending: true,
    url: 'https://chat.deepseek.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=128'
  },
  {
    id: 'master-5',
    name: 'Perplexity',
    category: 'Research',
    collection: 'Major',
    description: 'The definition of "Answer Engine". Real-time web citations with Deep Research mode.',
    useCases: ['Deep Dives', 'Fact Checking', 'Academic Citations'],
    bestFor: ['Researchers', 'Students'],
    matchScore: 99,
    learningCurve: 'Low',
    deltaAnalysis: 'Google is for links. Perplexity is for answers.',
    trending: true,
    url: 'https://perplexity.ai'
  },
  {
    id: 'master-6',
    name: 'Midjourney',
    category: 'Image & Video',
    collection: 'Major',
    description: 'Photorealism perfected. Now includes native video generation and 3D object export.',
    useCases: ['Cinematic Stills', 'Short Video Clips', '3D Assets'],
    bestFor: ['Designers', 'Filmmakers'],
    matchScore: 96,
    learningCurve: 'High',
    deltaAnalysis: 'Renders text perfectly and understands nuance better than any other model.',
    trending: true,
    url: 'https://midjourney.com'
  },
  {
    id: 'master-7',
    name: 'Cursor',
    category: 'Coding',
    collection: 'Major',
    description: 'The AI-native editor. Intergrates Claude and GPT directly into your codebase.',
    useCases: ['Software Engineering', 'Refactoring', 'Bug Fixing'],
    bestFor: ['Developers'],
    matchScore: 100,
    learningCurve: 'Medium',
    deltaAnalysis: 'Essential. It writes 40% of your code for you.',
    trending: true,
    url: 'https://cursor.com'
  },
  {
    id: 'master-8',
    name: 'Sora',
    category: 'Video',
    collection: 'New',
    description: 'OpenAI\'s video generator. Hollywood-quality video from text. Available to Pro users.',
    useCases: ['Marketing Ads', 'Film prototyping', 'Social Content'],
    bestFor: ['Creators'],
    matchScore: 95,
    learningCurve: 'High',
    deltaAnalysis: 'Mind-blowing physics simulation.',
    trending: true,
    url: 'https://openai.com/sora'
  },
  {
    id: 'master-9',
    name: 'Freepik Pikaso',
    category: 'Image & Design',
    collection: 'Underrated',
    description: 'Real-time sketching to image. Incredible for rapid ideation.',
    useCases: ['Concept Art', 'Rapid Prototyping'],
    bestFor: ['Designers'],
    matchScore: 92,
    learningCurve: 'Low',
    deltaAnalysis: 'The fastest way to get an idea out of your head.',
    trending: true,
    url: 'https://freepik.com/pikaso'
  },
  {
    id: 'master-10',
    name: 'Flora',
    category: 'Design',
    collection: 'New',
    description: 'AI-powered moodboarding and asset organisation for creatives.',
    useCases: ['Moodboards', 'Asset Management'],
    bestFor: ['Designers', 'Art Directors'],
    matchScore: 90,
    learningCurve: 'Low',
    deltaAnalysis: 'Finally, an AI tool that understands design aesthetics.',
    trending: true,
    url: 'https://flora.ai'
  },
  {
    id: 'master-11',
    name: 'Higgsfield',
    category: 'Video',
    collection: 'Underrated',
    description: 'Controllable video generation mobile app. Specific focus on character consistency.',
    useCases: ['Social Video', 'Character Animation'],
    bestFor: ['Creators'],
    matchScore: 89,
    learningCurve: 'Medium',
    deltaAnalysis: 'Better control than Runway for character movement.',
    trending: true,
    url: 'https://higgsfield.ai'
  },
  {
    id: 'master-12',
    name: 'Pletora',
    category: 'Generative UI',
    collection: 'New',
    description: 'Generates full UI layouts and components from text descriptions.',
    useCases: ['UI Design', 'Wireframing'],
    bestFor: ['Designers', 'Developers'],
    matchScore: 88,
    learningCurve: 'Medium',
    deltaAnalysis: 'Great starting point for any web project.',
    trending: true,
    url: 'https://pletora.ai'
  },
  {
    id: 'tool-midjourney',
    name: 'Midjourney',
    description: 'Generative AI for photorealistic images.',
    matchScore: 98,
    tags: ['Design', 'Creative'],
    trending: true,
    category: 'Specialized',
    collection: 'New',
    domain: 'midjourney.com',
    useCases: ['Art', 'Design'],
    bestFor: ['Creatives'],
    learningCurve: 'High',
    deltaAnalysis: 'Best in class for images.',
    url: 'https://midjourney.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=128'
  },
  {
    id: 'tool-cursor',
    name: 'Cursor',
    description: 'The AI-first code editor.',
    matchScore: 95,
    tags: ['Dev', 'Coding'],
    trending: true,
    category: 'Major',
    collection: 'New',
    domain: 'cursor.com',
    useCases: ['Coding', 'Refactoring'],
    bestFor: ['Developers'],
    learningCurve: 'Medium',
    deltaAnalysis: 'Revolutionizes coding workflows.',
    url: 'https://cursor.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=128'
  },
  {
    id: 'tool-notion',
    name: 'Notion AI',
    description: 'Connected workspace with AI writing powers.',
    matchScore: 88,
    tags: ['Productivity', 'Writing'],
    trending: false,
    category: 'Major',
    collection: 'New',
    domain: 'notion.to',
    useCases: ['Notes', 'Docs'],
    bestFor: ['Teams'],
    learningCurve: 'Low',
    deltaAnalysis: 'Great for organizing thoughts.',
    url: 'https://notion.so',
    logoUrl: 'https://www.google.com/s2/favicons?domain=notion.so&sz=128'
  },
  {
    id: 'master-13',
    name: 'Krea AI',
    category: 'Image & Video',
    collection: 'Major',
    description: 'Real-time generation and upscaling. The "Magnific" alternative for video.',
    useCases: ['Live Art', 'Upscaling', 'Pattern Generation'],
    bestFor: ['Designers'],
    matchScore: 94,
    learningCurve: 'Medium',
    deltaAnalysis: 'The real-time canvas is a game changer for live performance.',
    trending: true,
    url: 'https://krea.ai'
  }
];

const MOCK_UPDATES: VerifiedUpdate[] = [
  {
    id: 'mock-update-1',
    title: 'DeepSeek Beats Benchmarks',
    shortSummary: 'R1 reasoning model just scored 92% on MATH-500, surpassing all proprietary competitors.',
    relevanceScore: 99, // Keep High (Major News)
    difficultyLevel: 2,
    source: 'ArXiv',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    url: 'https://deepseek.com',
    updateType: UpdateType.MajorRelease,
    lessonEligible: true
  },
  {
    id: 'mock-update-2',
    title: 'Gemini Context Expanded',
    shortSummary: 'Google quietly updated the 2.0 Pro context window to 12M tokens for select developers.',
    relevanceScore: 65, // LOWERED: Dev only
    difficultyLevel: 1,
    source: 'Google Dev',
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    url: 'https://blog.google',
    updateType: UpdateType.Improvement,
    lessonEligible: true
  },
  {
    id: 'mock-update-3',
    title: 'Claude "Agent Mode" Live',
    shortSummary: 'Anthropic\'s new autonomous mode can now deploy full web apps from a single prompt.',
    relevanceScore: 98, // Keep High (Game changer)
    difficultyLevel: 3,
    source: 'Anthropic',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    url: 'https://anthropic.com',
    updateType: UpdateType.MajorRelease,
    lessonEligible: true
  },
  {
    id: 'mock-update-4',
    title: 'Midjourney Web Editor',
    shortSummary: 'The new in-browser editor allows pixel-perfect repainting without leaving the site.',
    relevanceScore: 94, // Keep High (Creative/General)
    difficultyLevel: 1,
    source: 'Midjourney',
    date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    url: 'https://midjourney.com',
    updateType: UpdateType.NewTool,
    lessonEligible: true,
    // Hack: we'll check against title/summary if no explicit tag, but let's assume we match implicitly
  },
  {
    id: 'mock-update-5',
    title: 'OpenAI Reduces Prices',
    shortSummary: 'o3-mini API costs slashed by 60% effective immediately.',
    relevanceScore: 60, // LOWERED: Business news, not a personal "Task"
    difficultyLevel: 1,
    source: 'OpenAI',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    url: 'https://openai.com',
    updateType: UpdateType.Improvement,
    lessonEligible: false
  },
  {
    id: 'mock-update-6',
    title: 'Cursor Adds "Focus" Mode',
    shortSummary: 'New feature filters out all non-relevant files when debugging complex errors.',
    relevanceScore: 88, // Good but maybe not "Home Page" urgent for non-coders
    difficultyLevel: 2,
    source: 'Cursor Blog',
    date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    url: 'https://cursor.com',
    updateType: UpdateType.Improvement,
    lessonEligible: true
  },
  {
    id: 'mock-update-7',
    title: 'Apple Intelligence Update',
    shortSummary: 'Siri can now read and summarize your screen context in real-time on all M4 devices.',
    relevanceScore: 75, // General News
    difficultyLevel: 1,
    source: 'Apple',
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    url: 'https://apple.com',
    updateType: UpdateType.Capability,
    lessonEligible: false
  },
  {
    id: 'mock-update-8',
    title: 'Runway Gen-3 Alpha',
    shortSummary: 'New "Director Mode" gives granular camera control for AI video generation.',
    relevanceScore: 85, // Strong tool but specific
    difficultyLevel: 3,
    source: 'Runway',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    url: 'https://runwayml.com',
    updateType: UpdateType.NewTool,
    lessonEligible: true
  }
];

// Fallback Mock Data (Only used if Offline/Demo)
const MOCK_LESSON: MicroLesson = {
  id: 'lesson-1',
  updateId: 'mock-1',
  title: 'Mastering ChatGPT Memory',
  duration: '2 min',
  whyItMatters: 'Stop repeating yourself. By teaching ChatGPT your context once, you save ~5 minutes on every future interaction.',
  whatChanged: 'ChatGPT adds a persistent memory layer that spans across different conversations.',
  steps: ['Open Settings > Personalization > Memory', 'Ensure it is ON', 'Tell it your preferences once'],
  mentalModel: 'Treat it like a new hire.',
  practiceTask: 'Tell ChatGPT your role.',
  visualConcept: 'Brain synapse',
  imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80'
};

const MOCK_PATHS: Record<string, string[]> = {
  [LearnCategory.Basics]: ["Prompt Engineering 101", "Understanding Context", "Multi-modal Inputs"],
  [LearnCategory.Writing]: ["Tone Adjustment", "The Editor Persona", "Creative Braistorming"],
  [LearnCategory.Research]: ["Verification Patterns", "Deep Summarization", "Data Synthesis"],
  [LearnCategory.Thinking]: ["First Principles", "Decision Matrix", "Bias Checking"],
  [LearnCategory.Automation]: ["Identifying Triggers", "Zapier Basics", "Agentic Workflows"],
  [LearnCategory.Mastery]: ["Fine-tuning Concepts", "API Integration", "Custom GPTs"]
};

class DeltaService {
  private ai: GoogleGenAI;
  private apiKey: string | undefined;
  private chatSession: Chat | null = null;
  private isDemoMode: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (this.apiKey && this.apiKey.length > 0 && this.apiKey !== "undefined") {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.warn("API_KEY is missing. Enabling DEMO MODE.");
      this.isDemoMode = true;
      this.ai = new GoogleGenAI({ apiKey: "dummy" });
    }
  }

  getIsDemoMode() { return this.isDemoMode; }
  getFallbackTools() { return CURATED_TOOLS; }
  getFallbackUpdates() { return MOCK_UPDATES; }

  // Fast Live AI News with Daily Refresh - Returns VerifiedUpdate[] directly
  async fetchLiveAINews(): Promise<VerifiedUpdate[]> {
    const API_KEY = "eaa30ace-809f-4480-9e6a-bc1c66c29c6c";
    const CACHE_KEY = 'delta_news_cache';
    const today = new Date().toDateString();

    // Check if we have today's cached news
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { date, news } = JSON.parse(cached);
        if (date === today && news.length > 0) {

          return news;
        }
      }
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }

    // Interest detection keywords
    const INTEREST_KEYWORDS: Record<string, string[]> = {
      creative: ['design', 'art', 'image', 'video', 'creative', 'visual', 'midjourney', 'dalle', 'stable diffusion', 'photoshop', 'canvas', 'render'],
      business: ['business', 'enterprise', 'marketing', 'sales', 'finance', 'productivity', 'workflow', 'startup', 'market'],
      development: ['code', 'coding', 'developer', 'programming', 'api', 'github', 'cursor', 'copilot', 'engineering', 'stack', 'software'],
      writing: ['writing', 'content', 'copywriting', 'blog', 'article', 'text', 'document', 'editor', 'draft'],
      research: ['research', 'academic', 'paper', 'study', 'analysis', 'data', 'science', 'deepseek', 'reasoning'],
      productivity: ['automation', 'workflow', 'efficiency', 'assistant', 'task', 'agent', 'manage', 'organize'],
      media: ['photo', 'video', 'audio', 'media', 'youtube', 'podcast', 'editing', 'sora', 'runway', 'pika'],
      marketing: ['ads', 'seo', 'growth', 'brand', 'social media', 'campaign', 'analytics'],
      music: ['music', 'audio', 'sound', 'voice', 'speech', 'suno', 'udio', 'generation'],
      personal: ['health', 'fitness', 'learning', 'education', 'personal', 'life', 'habit']
    };

    // Major update keywords for higher relevance scoring
    const MAJOR_KEYWORDS = ['launch', 'release', 'announce', 'new', 'update', 'breakthrough', 'major', 'revolutionary', 'game-changing', 'available now'];

    // STRICT AI FILTER: Title MUST contain one of these to be considered
    const AI_STRICT_KEYWORDS = [
      'ai', 'artificial intelligence', 'llm', 'gpt', 'claude', 'gemini', 'llama',
      'model', 'neural', 'agent', 'machine learning', 'genai', 'copilot', 'chatbot',
      'deepseek', 'midjourney', 'openai', 'anthropic', 'google', 'meta', 'mistral',
      'chatgpt', 'sora', 'runway', 'stable diffusion', 'hugging face', 'nvidia'
    ];

    const detectInterests = (text: string): string[] => {
      const lowerText = text.toLowerCase();
      return Object.entries(INTEREST_KEYWORDS)
        .filter(([_, keywords]) => keywords.some(k => lowerText.includes(k)))
        .map(([interest]) => interest);
    };

    const isMajorUpdate = (text: string): boolean => {
      const lowerText = text.toLowerCase();
      return MAJOR_KEYWORDS.some(k => lowerText.includes(k));
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Prioritize major AI news sources and updates with a STRICTER query
      const response = await fetch("https://eventregistry.org/api/v1/article/getArticles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getArticles",
          // Query for AI specifically in the TITLE to avoid tangential mentions
          keyword: "AI",
          keywordLoc: "title",
          lang: "eng",
          articlesPage: 1,
          articlesCount: 50, // Fetch more to allow for aggressive filtering
          articlesSortBy: "date",
          articlesSortByAsc: false,
          dataType: ["news"],
          forceMaxDataTimeWindow: 3,
          resultType: "articles",
          apiKey: API_KEY
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log(`Fetched ${data?.articles?.results?.length || 0} candidate articles`);

      if (data?.articles?.results?.length > 0) {
        let rawArticles = data.articles.results;

        // 1. STRICT FILTER: Title must match AI keywords strictly
        const strictArticles = rawArticles.filter((art: any) => {
          const title = art.title.toLowerCase();
          // Must have an AI keyword
          const hasAiKeyword = AI_STRICT_KEYWORDS.some(k => title.includes(k));
          if (!hasAiKeyword) return false;

          // Must NOT be a "stock market" or "generic business" update if it doesn't clearly mention a tool/tech
          const isFinancial = title.includes('stock') || title.includes('share') || title.includes('market') || title.includes('invest');
          if (isFinancial && !title.includes('launch') && !title.includes('release')) return false;

          return true;
        });

        // 2. Filter for "Update" / "Use Case" / "Tool" context
        const FILTER_KEYWORDS = ['launch', 'release', 'update', 'feature', 'new', 'how to', 'guide', 'tutorial', 'use case', 'learn', 'announce', 'introduce', 'tool', 'platform', 'model'];

        const filteredArticles = strictArticles.filter((art: any) => {
          const text = (art.title + " " + (art.body || "")).toLowerCase();
          return FILTER_KEYWORDS.some(k => text.includes(k));
        });

        // Use filtered list
        const finalArticles = filteredArticles.length >= 1 ? filteredArticles : strictArticles;

        console.log(`Filtered down to ${finalArticles.length} valid AI updates`);

        const news = finalArticles.slice(0, 20).map((art: any, i: number) => {
          const fullText = `${art.title} ${art.body || ''}`;
          const interests = detectInterests(fullText);
          const isMajor = isMajorUpdate(art.title);

          return {
            id: art.uri || `news-${Date.now()}-${i}`,
            title: art.title,
            shortSummary: art.body?.substring(0, 200).replace(/\n/g, ' ') + '...' || art.title,
            // Score based on strict relevance
            relevanceScore: isMajor ? Math.min(99, 95 - i) : (88 - i),
            difficultyLevel: 1,
            source: art.source?.title || 'AI News',
            date: art.dateTimePub || art.date || new Date().toISOString(),
            url: art.url,
            updateType: isMajor
              ? UpdateType.MajorRelease
              : art.title.toLowerCase().includes('tool')
                ? UpdateType.NewTool
                : UpdateType.Improvement,
            lessonEligible: true,
            interests: interests.length > 0 ? interests : ['technology']
          };
        });

        // Sort by relevance (major updates first)
        news.sort((a: VerifiedUpdate, b: VerifiedUpdate) => b.relevanceScore - a.relevanceScore);

        // Cache today's news
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, news }));

        } catch (e) {
          console.warn("Failed to cache news");
        }

        return news;
      }
    } catch (e) {
      console.warn("Live news fetch failed, using fallback:", e);
    }

    // Return fallback mock data if API fails
    return MOCK_UPDATES;
  }

  // Dynamic fetch for specific interests
  async fetchNewsForInterests(interests: string[]): Promise<VerifiedUpdate[]> {
    if (interests.length === 0) return this.fetchLiveAINews();

    const API_KEY = "eaa30ace-809f-4480-9e6a-bc1c66c29c6c";

    // Map interests to search keywords
    const INTEREST_SEARCH_TERMS: Record<string, string> = {
      creative: 'AI design OR AI art OR Midjourney OR DALL-E OR AI image generation',
      business: 'AI business OR AI enterprise OR AI productivity OR AI automation',
      development: 'AI coding OR AI developer OR GitHub Copilot OR Cursor AI OR AI programming',
      writing: 'AI writing OR ChatGPT content OR AI copywriting OR AI text generation',
      research: 'AI research OR AI paper OR machine learning study OR AI analysis',
      productivity: 'AI assistant OR AI workflow OR AI automation OR AI tools',
      media: 'AI video OR AI photo editing OR AI media OR Runway OR Pika',
      marketing: 'AI marketing OR AI ads OR AI SEO OR AI growth',
      music: 'AI music OR Suno AI OR AI audio OR AI voice',
      personal: 'AI health OR AI learning OR AI education OR personal AI'
    };

    const searchTerms = interests
      .map(i => INTEREST_SEARCH_TERMS[i] || `AI ${i}`)
      .join(' OR ');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      console.log(`Fetching news for interests: ${interests.join(', ')}`);

      const response = await fetch("https://eventregistry.org/api/v1/article/getArticles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getArticles",
          keyword: searchTerms,
          keywordLoc: "title",
          lang: "eng",
          articlesPage: 1,
          articlesCount: 10,
          articlesSortBy: "date",
          articlesSortByAsc: false,
          dataType: ["news"],
          forceMaxDataTimeWindow: 3,
          resultType: "articles",
          apiKey: API_KEY
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log(`Fetched ${data?.articles?.results?.length || 0} articles for interests`);

      if (data?.articles?.results?.length > 0) {
        return data.articles.results.map((art: any, i: number) => ({
          id: art.uri || `interest-${Date.now()}-${i}`,
          title: art.title,
          shortSummary: art.body?.substring(0, 200).replace(/\n/g, ' ') + '...' || art.title,
          relevanceScore: 95 - (i * 2), // High relevance for targeted search
          difficultyLevel: 1,
          source: art.source?.title || 'AI News',
          date: art.dateTimePub || art.date || new Date().toISOString(),
          url: art.url,
          updateType: UpdateType.Improvement,
          lessonEligible: true,
          interests: interests
        }));
      }
    } catch (e) {
      console.warn("Interest-specific fetch failed:", e);
    }

    // Fallback to general news
    return this.fetchLiveAINews();
  }

  // Generate tool-based lessons for an interest category
  async generateInterestLesson(interest: string): Promise<MicroLesson | null> {
    // Map interests to specific recommended tools
    const INTEREST_TOOLS: Record<string, { tool: string; domain: string; description: string }> = {
      creative: { tool: 'Midjourney', domain: 'midjourney.com', description: 'AI image generation for stunning visuals' },
      business: { tool: 'Notion AI', domain: 'notion.so', description: 'AI-powered workspace for productivity' },
      development: { tool: 'Cursor', domain: 'cursor.sh', description: 'AI-first code editor that writes code for you' },
      writing: { tool: 'Claude', domain: 'claude.ai', description: 'Advanced AI assistant for writing and editing' },
      research: { tool: 'Perplexity AI', domain: 'perplexity.ai', description: 'AI-powered research and answer engine' },
      productivity: { tool: 'Zapier AI', domain: 'zapier.com', description: 'AI workflow automation' },
      media: { tool: 'Runway', domain: 'runwayml.com', description: 'AI video generation and editing' },
      marketing: { tool: 'Jasper', domain: 'jasper.ai', description: 'AI marketing content creation' },
      music: { tool: 'Suno AI', domain: 'suno.ai', description: 'AI music generation' },
      personal: { tool: 'Pi AI', domain: 'pi.ai', description: 'Personal AI assistant for conversations' }
    };

    const toolInfo = INTEREST_TOOLS[interest] || {
      tool: 'ChatGPT',
      domain: 'chat.openai.com',
      description: 'General-purpose AI assistant'
    };

    const prompt = `Generate a beginner-friendly microlesson for using ${toolInfo.tool} (${toolInfo.description}).

Return ONLY valid JSON:
{
  "title": "Get Started with ${toolInfo.tool}",
  "duration": "3 min",
  "whyItMatters": "One sentence on the main benefit for someone interested in ${interest}",
  "whatChanged": "What ${toolInfo.tool} can do in simple terms",
  "steps": [
    "Step 1: Go to ${toolInfo.domain} and create a free account",
    "Step 2: A simple first action to try",
    "Step 3: How to get value from the first session",
    "Step 4: What to explore next"
  ],
  "mentalModel": "A simple analogy",
  "practiceTask": "A 2-minute task to try right now",
  "taskPrompt": "A ready-to-paste prompt for ${toolInfo.tool} that delivers immediate value"
}`;

    try {
      const responseText = await this.directCall(prompt, true);
      const lesson = this.cleanAndParseJSON<MicroLesson>(responseText);
      if (lesson && Array.isArray(lesson.steps) && lesson.steps.length > 0) {
        lesson.id = `tool-lesson-${interest}-${Date.now()}`;
        lesson.updateId = interest;
        // Add tool info for UI
        (lesson as any).recommendedTool = toolInfo;
        lesson.imageUrl = `https://pollinations.ai/p/${encodeURIComponent(toolInfo.tool + " AI interface modern")}?width=800&height=400`;
        return lesson;
      }
    } catch (e) {
      console.error("Interest tool lesson generation failed:", e);
    }

    // Fallback with static content
    return {
      id: `fallback-tool-${interest}-${Date.now()}`,
      updateId: interest,
      title: `Get Started with ${toolInfo.tool}`,
      duration: "3 min",
      whyItMatters: `${toolInfo.tool} makes ${interest} tasks faster and easier.`,
      whatChanged: toolInfo.description,
      steps: [
        `Go to ${toolInfo.domain} and sign up for free`,
        "Try the main feature with a simple task",
        "Explore the help section for tips",
        "Bookmark it for regular use"
      ],
      mentalModel: "Think of it as your AI assistant",
      practiceTask: `Spend 5 minutes exploring ${toolInfo.tool}`,
      taskPrompt: `Help me get started with ${interest}-related tasks. What should I try first?`
    };
  }

  // =====================================================
  // Direct REST API Call (More Reliable for Browser)
  // =====================================================
  private async directCall(prompt: string, jsonMode: boolean = false): Promise<string | null> {
    if (!this.apiKey || this.isDemoMode) return null;

    const model = 'gemini-3-flash-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {}
        })
      });

      if (!response.ok) {
        console.error("Gemini API Error:", response.status, await response.text());
        return null;
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
      console.error("Direct API Call Failed", e);
      return null;
    }
  }

  // Helper for parsing JSON
  private cleanAndParseJSON<T>(text: string | undefined): T | null {
    if (!text) return null;
    try {
      // 1. Try extracting from markdown code block first
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        try { return JSON.parse(codeBlockMatch[1]); } catch (e) { /* continue */ }
      }

      // 2. Try simple cleanup if no block found
      const clean = text.replace(/```json\n?|```/g, '').trim();
      try { return JSON.parse(clean); } catch (e) { /* continue */ }

      // 3. Brute force: find the first { or [ and the last } or ]
      const firstBrace = text.indexOf('{');
      const firstBracket = text.indexOf('[');
      const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1) ? firstBrace : Math.min(firstBrace, firstBracket);

      const lastBrace = text.lastIndexOf('}');
      const lastBracket = text.lastIndexOf(']');
      const end = Math.max(lastBrace, lastBracket);

      if (start !== -1 && end !== -1 && end > start) {
        const candidate = text.substring(start, end + 1);
        return JSON.parse(candidate);
      }

      return null;
    } catch (e) {
      console.error("JSON Parse Failed", e);
      return null;
    }
  }

  // --- VISUALS ---
  private async generateVisual(concept: string): Promise<string | undefined> {
    if (this.isDemoMode) return MOCK_LESSON.imageUrl;
    if (!concept) return undefined;

    try {
      // 1. Generate a rich visual description using the Model
      const prompt = `Describe a minimal, futuristic 3D icon or scene representing: "${concept}". 
      Keep it abstract, neon lighting, dark background, claymorphism style. Max 15 words.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-lite-preview-02-05',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const visualDescription = String(response.text).trim();

      // 2. Use Pollinations with the rich description
      // We encode it to be URL safe
      return `https://pollinations.ai/p/${encodeURIComponent(visualDescription)}?width=800&height=400&seed=${Math.random()}&model=flux`;
    } catch (e) {
      console.warn("Visual Gen Failed, falling back", e);
      return `https://pollinations.ai/p/${encodeURIComponent(concept + " abstract 3d render")}?width=800&height=400`;
    }
  }

  // --- UPDATES ---
  // --- UPDATES ---
  async discoverUpdates(): Promise<RawUpdateSignal[]> {
    // Always return mock data in demo mode
    if (this.isDemoMode) {
      return MOCK_UPDATES.map(u => ({
        sourceId: u.source,
        rawContent: u.shortSummary,
        detectedAt: u.date,
        url: u.url || '',
        id: u.id
      }));
    }

    try {
      // 1. Try NewsAPI.ai (EventRegistry)
      const realNews = await this.fetchNewsApiUpdates();
      if (realNews.length > 0) return realNews;
    } catch (e) {
      console.warn("NewsAPI failed, falling back to Gemini.", e);
    }

    // 2. Fallback to Gemini with direct API call
    try {
      const today = new Date().toDateString();
      const responseText = await this.directCall(AGENT_PROMPTS.DISCOVERY(today), true);
      const parsed = this.cleanAndParseJSON<RawUpdateSignal[]>(responseText);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {
      console.error("Discovery Failed", e);
    }

    // 3. Final fallback: return mock updates
    return MOCK_UPDATES.map(u => ({
      sourceId: u.source,
      rawContent: u.shortSummary,
      detectedAt: u.date,
      url: u.url || '',
      id: u.id
    }));
  }

  private async fetchNewsApiUpdates(): Promise<RawUpdateSignal[]> {
    const API_KEY = "eaa30ace-809f-4480-9e6a-bc1c66c29c6c";
    // Query for Artificial Intelligence in last 2 days, English
    const body = {
      "action": "getArticles",
      "keyword": "Artificial Intelligence",
      "keywordLoc": "title",
      "lang": "eng",
      "articlesPage": 1,
      "articlesCount": 15,
      "articlesSortBy": "date",
      "articlesSortByAsc": false,
      "dataType": [
        "news",
        "blog"
      ],
      "forceMaxDataTimeWindow": 31,
      "resultType": "articles",
      "apiKey": API_KEY
    };

    try {
      console.log("Fetching NewsAPI...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch("https://eventregistry.org/api/v1/article/getArticles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`NewsAPI Response: ${data?.articles?.results?.length ?? 0} articles found.`);
      if (data?.articles?.results?.length > 0) {
        console.log("First Article Date Raw:", data.articles.results[0].dateTimePub, data.articles.results[0].date);
      }

      if (data?.articles?.results) {
        return data.articles.results.map((art: any) => ({
          id: art.uri,
          rawContent: `${art.title}\n\n${art.body?.substring(0, 500)}...`, // Increased context
          sourceId: art.source?.title || 'NewsAPI',
          url: art.url,
          // Prefer published time, fall back to detected date
          detectedAt: (art.dateTimePub && !isNaN(Date.parse(art.dateTimePub))) ? new Date(art.dateTimePub).toISOString() : ((art.date && !isNaN(Date.parse(art.date))) ? new Date(art.date).toISOString() : new Date().toISOString())
        }));
      }
    } catch (e) {
      console.error("NewsAPI Fetch Error", e);
    }
    return [];
  }

  async classifyUpdates(signals: RawUpdateSignal[], user: UserContext): Promise<VerifiedUpdate[]> {
    // Return MOCKS to ensure content is always visible if discovery fails or in demo mode
    if (this.isDemoMode || signals.length === 0) {
      return MOCK_UPDATES;
    }

    try {
      const prompt = AGENT_PROMPTS.RELEVANCE(JSON.stringify(user)) + `\n\nInput Signals: ${JSON.stringify(signals)}`;
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = this.cleanAndParseJSON<VerifiedUpdate[]>(response.text);
      if (!parsed) return [];

      // VALIDATE DATA
      return parsed.filter(u => u && u.title && u.shortSummary).map(u => ({
        ...u,
        // Ensure date is valid
        date: u.date && !isNaN(Date.parse(u.date)) ? u.date : new Date().toISOString(),
        // Ensure scores
        relevanceScore: u.relevanceScore || 85,
        difficultyLevel: u.difficultyLevel || 1
      }));

    } catch (e) {
      console.error("Classification Failed", e);
      // Fallback: If classification fails, map signals directly to VerifiedUpdate format
      // ensuring the user still sees the news (even if unclassified)
      return signals.map(s => ({
        id: s.id || `fallback-${Date.now()}-${Math.random()}`,
        title: s.sourceId ? `${s.detectedAt ? 'Fresh' : 'AI'} News from ${s.sourceId}` : 'Latest AI Update',
        shortSummary: s.rawContent.substring(0, 150).replace(/\n/g, ' ') + '...',
        relevanceScore: 90, // Default to High visibility if it's fresh news
        difficultyLevel: 1,
        source: s.sourceId || 'Web',
        date: s.detectedAt || new Date().toISOString(),
        url: s.url,
        updateType: UpdateType.Improvement,
        lessonEligible: false
      }));
    }
  }

  // --- LESSONS ---
  async generateLesson(update: VerifiedUpdate, user: UserContext): Promise<MicroLesson | null> {
    if (this.isDemoMode) return { ...MOCK_LESSON, title: `Mastering: ${update.title.substring(0, 20)}...` };

    try {
      const prompt = AGENT_PROMPTS.LESSON_GENERATION(JSON.stringify(update), JSON.stringify(user));
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const lesson = this.cleanAndParseJSON<MicroLesson>(response.text);
      // STRICT VALIDATION: Ensure critical fields exist
      if (lesson && Array.isArray(lesson.steps) && lesson.steps.length > 0 && lesson.title) {
        // Use a reliable image source
        lesson.imageUrl = `https://pollinations.ai/p/${encodeURIComponent(lesson.visualConcept || update.title)}?width=800&height=400&seed=${Math.random()}`;
        return lesson;
      } else {
        console.warn("Lesson Gen: Invalid JSON structure", lesson);
      }
    } catch (e) { console.error("Lesson Gen Failed", e); }

    // Fallback if generation failed so app doesn't crash
    return {
      id: 'fallback-' + Date.now(),
      updateId: update.id,
      title: "Instant Lesson Unavailable",
      duration: "1 min",
      whyItMatters: "We couldn't generate a custom lesson for this update right now.",
      whatChanged: "The AI service provided an incomplete response.",
      steps: [
        "Review the original source link for details.",
        "Try generating this lesson again in a few moments.",
        "Explore related tools in the Trending tab."
      ],
      mentalModel: "Fallback Mode",
      practiceTask: "Read the full update context.",
      visualConcept: "Technical Maintenance",
      imageUrl: `https://pollinations.ai/p/technical_maintenance_robot?width=800&height=400`
    };
  }

  // --- TOOLS ---
  async discoverTools(user: UserContext): Promise<ToolSuggestion[]> {
    // Start with CURATED list and personalize based on user
    let tools = [...CURATED_TOOLS];

    // Dynamic personalization based on user role and goals
    const roleKeywords: Record<string, string[]> = {
      'Developer': ['Coding', 'Development', 'API', 'GitHub', 'Code'],
      'Designer': ['Design', 'Creative', 'Visual', 'UI', 'Image'],
      'Marketer': ['Marketing', 'Content', 'Writing', 'Social', 'SEO'],
      'Student': ['Research', 'Writing', 'Learning', 'Study'],
      'Researcher': ['Research', 'Analysis', 'Data', 'Academic'],
      'Writer': ['Writing', 'Content', 'Creative', 'Text'],
      'Entrepreneur': ['Business', 'Planning', 'Automation', 'Productivity'],
      'Product Manager': ['Planning', 'Analysis', 'Collaboration', 'Documentation']
    };

    // Score tools based on user profile
    tools = tools.map(tool => {
      let score = tool.matchScore || 50;
      const toolText = `${tool.name} ${tool.description} ${tool.category} ${(tool.useCases || []).join(' ')} ${(tool.bestFor || []).join(' ')}`.toLowerCase();

      // Boost if matches user role
      if (user.role) {
        const keywords = roleKeywords[user.role] || [];
        keywords.forEach(keyword => {
          if (toolText.includes(keyword.toLowerCase())) score += 15;
        });
        // Direct match on bestFor
        if (tool.bestFor?.some(b => b.toLowerCase().includes(user.role?.toLowerCase() || ''))) {
          score += 25;
        }
      }

      // Boost if matches user goals
      if (user.goals && user.goals.length > 0) {
        user.goals.forEach(goal => {
          if (toolText.includes(goal.toLowerCase())) score += 10;
        });
      }

      // Boost if matches user stack (using optional access)
      const userStack = (user as any).activeStack || (user as any).stack || [];
      if (Array.isArray(userStack) && userStack.length > 0) {
        userStack.forEach((tech: string) => {
          if (toolText.includes(tech.toLowerCase())) score += 20;
        });
      }

      return { ...tool, matchScore: Math.min(score, 100) };
    });

    // Sort by personalized score
    tools.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Try to discover new tools via AI if not demo mode
    if (!this.isDemoMode) {
      try {
        const today = new Date().toDateString();
        const prompt = AGENT_PROMPTS.TOOL_DISCOVERY(JSON.stringify(user), today);
        const responseText = await this.directCall(prompt, true);
        const discovered = this.cleanAndParseJSON<ToolSuggestion[]>(responseText);
        if (discovered && discovered.length > 0) {
          // Deduplicate by name
          const existingNames = new Set(tools.map(t => t.name.toLowerCase()));
          const newTools = discovered.filter(d => !existingNames.has(d.name.toLowerCase()));
          tools = [...newTools, ...tools]; // Put new ones first
        }
      } catch (e) { console.warn("Tool discovery failed, using curated.", e); }
    }

    return tools;
  }

  async findToolsForUseCase(query: string, user: UserContext): Promise<ToolSuggestion[]> {
    if (!query.trim()) return CURATED_TOOLS;
    if (this.isDemoMode) {
      // Simple local fuzzy search in demo/fallback
      const lowerQ = query.toLowerCase();
      return CURATED_TOOLS.filter(t =>
        t.name.toLowerCase().includes(lowerQ) ||
        t.description.toLowerCase().includes(lowerQ) ||
        t.useCases.some(u => u.toLowerCase().includes(lowerQ))
      );
    }

    try {
      const prompt = `
            Act as "Tool Matchmaker".
            User Query: "${query}"
            User Profile: ${JSON.stringify(user)}
            
            Task: detailed search for the best AI tools (Web/GitHub/Product Hunt) for this specific use case.
            Rank by relevance.
            
            Return JSON array of ToolSuggestion.
          `;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', // Use smart model
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const found = this.cleanAndParseJSON<ToolSuggestion[]>(response.text);
      return found || CURATED_TOOLS.filter(t => t.description.toLowerCase().includes(query.toLowerCase()));
    } catch (e) {
      console.error("Tool search failed", e);
      return CURATED_TOOLS; // Fallback
    }
  }

  async generateToolLesson(tool: ToolSuggestion, user: UserContext): Promise<MicroLesson | null> {
    if (this.isDemoMode) return { ...MOCK_LESSON, title: `Learn ${tool.name}`, whatChanged: tool.description };

    try {
      // Safety check for user JSON to avoid crash if user context is missing fields
      const safeUser = JSON.stringify(user || { role: 'Explorer' });
      const safeTool = JSON.stringify(tool);

      const prompt = AGENT_PROMPTS.MASTER_GUIDE(safeTool, safeUser);

      // Add retry logic or simply log before call


      // Use direct REST API call for browser compatibility
      const responseText = await this.directCall(prompt, true);

      const lesson = this.cleanAndParseJSON<MicroLesson>(responseText);
      if (lesson && Array.isArray(lesson.steps) && lesson.steps.length > 0) {
        // Normalize steps to strings (AI sometimes returns objects)
        lesson.steps = lesson.steps.map((step: unknown) => {
          if (typeof step === 'string') return step;
          if (typeof step === 'object' && step !== null) {
            // Try to extract text from common object shapes
            const s = step as Record<string, unknown>;
            return String(s.text || s.content || s.description || s.title || JSON.stringify(step));
          }
          return String(step);
        });
        lesson.imageUrl = `https://pollinations.ai/p/${encodeURIComponent(tool.name + " " + (lesson.visualConcept || "UI interface"))}?width=800&height=400&seed=${Math.random()}`;
        return lesson;
      } else {
        console.warn("Tool Lesson Gen: Invalid JSON structure", lesson);
      }
    } catch (e) { console.error("Tool Lesson Gen Failed", e); }

    // Fallback
    return {
      id: 'fallback-tool-' + Date.now(),
      updateId: tool.id,
      title: `Explore ${tool.name}`,
      duration: "2 min",
      whyItMatters: "We couldn't generate the full guide right now. Please try again.",
      whatChanged: tool.description || "A powerful AI tool to explore.",
      steps: [`Go to ${tool.name}'s website`, "Create a free account", "Try asking it a simple question", "Explore the help documentation"],
      mentalModel: "Learning by doing",
      practiceTask: "Spend 5 minutes exploring the interface."
    };
  }

  // --- PATHS ---
  async generateLearningPath(category: string): Promise<string[]> {
    if (this.isDemoMode) return MOCK_PATHS[category] || ["Module 1", "Module 2", "Module 3"];

    try {
      const prompt = AGENT_PROMPTS.PATH_GENERATION(category);
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return this.cleanAndParseJSON<string[]>(response.text) || MOCK_PATHS[category];
    } catch (e) { return MOCK_PATHS[category]; }
  }

  async generateDailyLifeHack(updates: VerifiedUpdate[], tools: ToolSuggestion[], user: UserContext): Promise<DailyLifeHack | null> {
    // ... same as before but safe ...
    return null;
  }

  // --- CHAT ---
  initChat(user: UserContext) {
    if (this.isDemoMode) return;
    try {
      this.chatSession = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: AGENT_PROMPTS.CHAT_SYSTEM(JSON.stringify(user)) }
      });
    } catch (e) { }
  }

  async sendChatMessage(message: string): Promise<string> {
    if (this.isDemoMode) return "Demo Mode: Connect API Key for chat.";
    if (!this.chatSession) return "Connection not established.";
    try {
      const result = await this.chatSession.sendMessage({ message });
      return result.text;
    } catch (e) { return "I'm having trouble connecting to the network."; }
  }
}

export const deltaService = new DeltaService();