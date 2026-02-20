import { GoogleGenAI, Chat } from '@google/genai';
import { AGENT_PROMPTS } from '../constants';
import {
  RawUpdateSignal,
  VerifiedUpdate,
  UserContext,
  MicroLesson,
  ToolSuggestion,
  DailyLifeHack,
  ModelGuide,
  UpdateType,
  LearnCategory,
} from '../types';
import { storageService } from './storageService';

// ==========================================
// CURATED MASTER TOOLS (Feb 2026 Edition)
// ==========================================
const CURATED_TOOLS: ToolSuggestion[] = [
  {
    id: 'master-1', name: 'ChatGPT', category: 'Reasoning Engine', collection: 'Major',
    description: 'The global standard. Now features "Instant Reasoning" and deep agentic workflows.',
    useCases: ['Complex Planning', 'Agent Orchestration', 'Multimodal Analysis'],
    bestFor: ['Everyone'], matchScore: 100, learningCurve: 'Low',
    deltaAnalysis: 'Significantly faster and smarter than previous versions. It just works.',
    trending: true, url: 'https://openai.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128',
  },
  {
    id: 'master-2', name: 'Claude', category: 'Coding & Agents', collection: 'Major',
    description: "Anthropic's flagship. The undisputed king of coding and complex, nuanced writing.",
    useCases: ['Full-Stack Development', 'Novel Writing', 'Research Synthesis'],
    bestFor: ['Developers', 'Writers'], matchScore: 99, learningCurve: 'Medium',
    deltaAnalysis: 'If you code or write professionally, this is your daily driver.',
    trending: true, url: 'https://claude.ai',
    logoUrl: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=128',
  },
  {
    id: 'master-3', name: 'Gemini', category: 'Multimodal', collection: 'Major',
    description: "Google's best. Infinite context window (10M+) and native real-time video understanding.",
    useCases: ['Analyzing Entire Codebases', 'Video Processing', 'Live Translation'],
    bestFor: ['Power Users', 'Enterprises'], matchScore: 98, learningCurve: 'Medium',
    deltaAnalysis: 'Unbeatable for large data context. It remembers everything.',
    trending: true, url: 'https://gemini.google.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128',
  },
  {
    id: 'master-4', name: 'DeepSeek', category: 'Reasoning', collection: 'Major',
    description: 'The open-source phenomenon. Matches proprietary models in math/code at a fraction of the cost.',
    useCases: ['Math Proofs', 'Local LLM Logic', 'Cost-Efficient Analysis'],
    bestFor: ['Researchers', 'Open Source Fans'], matchScore: 97, learningCurve: 'Medium',
    deltaAnalysis: 'The industry disruptor. Incredible reasoning density.',
    trending: true, url: 'https://chat.deepseek.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=128',
  },
  {
    id: 'master-5', name: 'Perplexity', category: 'Research', collection: 'Major',
    description: 'The definition of "Answer Engine". Real-time web citations with Deep Research mode.',
    useCases: ['Deep Dives', 'Fact Checking', 'Academic Citations'],
    bestFor: ['Researchers', 'Students'], matchScore: 99, learningCurve: 'Low',
    deltaAnalysis: 'Google is for links. Perplexity is for answers.',
    trending: true, url: 'https://perplexity.ai',
  },
  {
    id: 'master-6', name: 'Midjourney', category: 'Image & Video', collection: 'Major',
    description: 'Photorealism perfected. Now includes native video generation and 3D object export.',
    useCases: ['Cinematic Stills', 'Short Video Clips', '3D Assets'],
    bestFor: ['Designers', 'Filmmakers'], matchScore: 96, learningCurve: 'High',
    deltaAnalysis: 'Renders text perfectly and understands nuance better than any other model.',
    trending: true, url: 'https://midjourney.com',
  },
  {
    id: 'master-7', name: 'Cursor', category: 'Coding', collection: 'Major',
    description: 'The AI-native editor. Integrates Claude and GPT directly into your codebase.',
    useCases: ['Software Engineering', 'Refactoring', 'Bug Fixing'],
    bestFor: ['Developers'], matchScore: 100, learningCurve: 'Medium',
    deltaAnalysis: 'Essential. It writes 40% of your code for you.',
    trending: true, url: 'https://cursor.com',
  },
  {
    id: 'master-8', name: 'Sora', category: 'Video', collection: 'New',
    description: "OpenAI's video generator. Hollywood-quality video from text.",
    useCases: ['Marketing Ads', 'Film prototyping', 'Social Content'],
    bestFor: ['Creators'], matchScore: 95, learningCurve: 'High',
    deltaAnalysis: 'Mind-blowing physics simulation.',
    trending: true, url: 'https://openai.com/sora',
  },
  {
    id: 'master-9', name: 'Freepik Pikaso', category: 'Image & Design', collection: 'Underrated',
    description: 'Real-time sketching to image. Incredible for rapid ideation.',
    useCases: ['Concept Art', 'Rapid Prototyping'],
    bestFor: ['Designers'], matchScore: 92, learningCurve: 'Low',
    deltaAnalysis: 'The fastest way to get an idea out of your head.',
    trending: true, url: 'https://freepik.com/pikaso',
  },
  {
    id: 'master-10', name: 'Notion AI', category: 'Productivity', collection: 'Major',
    description: 'Connected workspace with AI writing and summarisation powers.',
    useCases: ['Notes', 'Docs', 'Project Planning'],
    bestFor: ['Teams', 'Students'], matchScore: 88, learningCurve: 'Low',
    deltaAnalysis: 'Great for organising thoughts and turning notes into action.',
    trending: false, url: 'https://notion.so',
    logoUrl: 'https://www.google.com/s2/favicons?domain=notion.so&sz=128',
  },
  {
    id: 'master-11', name: 'Krea AI', category: 'Image & Video', collection: 'Major',
    description: 'Real-time generation and upscaling. The "Magnific" alternative for video.',
    useCases: ['Live Art', 'Upscaling', 'Pattern Generation'],
    bestFor: ['Designers'], matchScore: 94, learningCurve: 'Medium',
    deltaAnalysis: 'The real-time canvas is a game changer for live performance.',
    trending: true, url: 'https://krea.ai',
  },
  {
    id: 'master-12', name: 'Runway', category: 'Video', collection: 'Major',
    description: 'Professional AI video generation and editing. Director Mode gives granular camera control.',
    useCases: ['Short Films', 'Marketing', 'Social Content'],
    bestFor: ['Creators', 'Filmmakers'], matchScore: 93, learningCurve: 'Medium',
    deltaAnalysis: 'Best control for character movement in AI video.',
    trending: true, url: 'https://runwayml.com',
  },
];

const MOCK_UPDATES: VerifiedUpdate[] = [
  {
    id: 'mock-update-1', title: 'DeepSeek Beats Benchmarks',
    shortSummary: 'R1 reasoning model scored 92% on MATH-500, surpassing all proprietary competitors.',
    relevanceScore: 99, difficultyLevel: 2, source: 'ArXiv',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    url: 'https://deepseek.com', updateType: UpdateType.MajorRelease, lessonEligible: true,
  },
  {
    id: 'mock-update-2', title: 'Gemini Context Expanded',
    shortSummary: 'Google quietly updated the 2.0 Pro context window to 12M tokens for select developers.',
    relevanceScore: 65, difficultyLevel: 1, source: 'Google Dev',
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    url: 'https://blog.google', updateType: UpdateType.Improvement, lessonEligible: true,
  },
  {
    id: 'mock-update-3', title: 'Claude Agent Mode Live',
    shortSummary: "Anthropic's new autonomous mode can deploy full web apps from a single prompt.",
    relevanceScore: 98, difficultyLevel: 3, source: 'Anthropic',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    url: 'https://anthropic.com', updateType: UpdateType.MajorRelease, lessonEligible: true,
  },
  {
    id: 'mock-update-4', title: 'Midjourney Web Editor',
    shortSummary: 'The new in-browser editor allows pixel-perfect repainting without leaving the site.',
    relevanceScore: 94, difficultyLevel: 1, source: 'Midjourney',
    date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    url: 'https://midjourney.com', updateType: UpdateType.NewTool, lessonEligible: true,
  },
  {
    id: 'mock-update-5', title: 'OpenAI Reduces Prices',
    shortSummary: 'o3-mini API costs slashed by 60% effective immediately.',
    relevanceScore: 60, difficultyLevel: 1, source: 'OpenAI',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    url: 'https://openai.com', updateType: UpdateType.Improvement, lessonEligible: false,
  },
  {
    id: 'mock-update-6', title: 'Cursor Adds Focus Mode',
    shortSummary: 'New feature filters out all non-relevant files when debugging complex errors.',
    relevanceScore: 88, difficultyLevel: 2, source: 'Cursor Blog',
    date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    url: 'https://cursor.com', updateType: UpdateType.Improvement, lessonEligible: true,
  },
  {
    id: 'mock-update-7', title: 'Apple Intelligence Update',
    shortSummary: 'Siri can now read and summarize your screen context in real-time on all M4 devices.',
    relevanceScore: 75, difficultyLevel: 1, source: 'Apple',
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    url: 'https://apple.com', updateType: UpdateType.Capability, lessonEligible: false,
  },
  {
    id: 'mock-update-8', title: 'Runway Gen-3 Alpha',
    shortSummary: "New Director Mode gives granular camera control for AI video generation.",
    relevanceScore: 85, difficultyLevel: 3, source: 'Runway',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    url: 'https://runwayml.com', updateType: UpdateType.NewTool, lessonEligible: true,
  },
];

const MOCK_LESSON: MicroLesson = {
  id: 'lesson-1', updateId: 'mock-1', title: 'Mastering ChatGPT Memory', duration: '2 min',
  whyItMatters: 'Stop repeating yourself. By teaching ChatGPT your context once, you save ~5 minutes on every future interaction.',
  whatChanged: 'ChatGPT adds a persistent memory layer that spans across different conversations.',
  steps: ['Open Settings > Personalization > Memory', 'Ensure it is ON', 'Tell it your preferences once'],
  mentalModel: 'Treat it like a new hire.',
  practiceTask: 'Tell ChatGPT your role.',
  imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
};

const MOCK_PATHS: Record<string, string[]> = {
  [LearnCategory.Basics]: ['Prompt Engineering 101', 'Understanding Context', 'Multi-modal Inputs'],
  [LearnCategory.Writing]: ['Tone Adjustment', 'The Editor Persona', 'Creative Brainstorming'],
  [LearnCategory.Research]: ['Verification Patterns', 'Deep Summarization', 'Data Synthesis'],
  [LearnCategory.Thinking]: ['First Principles', 'Decision Matrix', 'Bias Checking'],
  [LearnCategory.Automation]: ['Identifying Triggers', 'Zapier Basics', 'Agentic Workflows'],
  [LearnCategory.Mastery]: ['Fine-tuning Concepts', 'API Integration', 'Custom GPTs'],
};

// =============================================
// FIXED GEMINI MODEL NAMES (was broken before)
// =============================================
const GEMINI_FLASH = 'gemini-2.0-flash';
const GEMINI_FLASH_LITE = 'gemini-2.0-flash-lite';
const GEMINI_PRO = 'gemini-2.5-flash';

const NEWS_API_KEY = 'eaa30ace-809f-4480-9e6a-bc1c66c29c6c';

class DeltaService {
  private ai: GoogleGenAI;
  private apiKey: string | undefined;
  private chatSession: Chat | null = null;
  private isDemoMode: boolean = false;

  constructor() {
    // In Expo, use process.env or Constants.expoConfig.extra
    this.apiKey =
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (this.apiKey && this.apiKey.length > 0 && this.apiKey !== 'undefined') {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.warn('GEMINI_API_KEY is missing. Enabling DEMO MODE.');
      this.isDemoMode = true;
      this.ai = new GoogleGenAI({ apiKey: 'dummy' });
    }
  }

  getIsDemoMode() { return this.isDemoMode; }
  getFallbackTools() { return CURATED_TOOLS; }
  getFallbackUpdates() { return MOCK_UPDATES; }

  // =============================================
  // LIVE AI NEWS — with AsyncStorage caching
  // =============================================
  async fetchLiveAINews(): Promise<VerifiedUpdate[]> {
    const CACHE_KEY = 'delta_news_cache';
    const today = new Date().toDateString();

    // Check AsyncStorage cache
    try {
      const cached = await storageService.getCached(CACHE_KEY);
      if (cached) {
        const { date, news } = JSON.parse(cached);
        if (date === today && news.length > 0) return news;
      }
    } catch (e) {
      await storageService.removeCached(CACHE_KEY);
    }

    const INTEREST_KEYWORDS: Record<string, string[]> = {
      creative: ['design', 'art', 'image', 'video', 'creative', 'visual', 'midjourney', 'dalle', 'stable diffusion'],
      business: ['business', 'enterprise', 'marketing', 'sales', 'finance', 'productivity', 'workflow', 'startup'],
      development: ['code', 'coding', 'developer', 'programming', 'api', 'github', 'cursor', 'copilot', 'engineering'],
      writing: ['writing', 'content', 'copywriting', 'blog', 'article', 'text', 'document', 'editor'],
      research: ['research', 'academic', 'paper', 'study', 'analysis', 'data', 'science', 'deepseek', 'reasoning'],
      productivity: ['automation', 'workflow', 'efficiency', 'assistant', 'task', 'agent', 'manage', 'organize'],
      media: ['photo', 'video', 'audio', 'media', 'youtube', 'podcast', 'editing', 'sora', 'runway', 'pika'],
      music: ['music', 'audio', 'sound', 'voice', 'speech', 'suno', 'udio'],
    };

    const AI_STRICT_KEYWORDS = [
      'ai', 'artificial intelligence', 'llm', 'gpt', 'claude', 'gemini', 'llama', 'model',
      'neural', 'agent', 'machine learning', 'genai', 'copilot', 'chatbot', 'deepseek',
      'midjourney', 'openai', 'anthropic', 'google', 'meta', 'mistral', 'chatgpt', 'sora', 'runway',
    ];

    const MAJOR_KEYWORDS = ['launch', 'release', 'announce', 'new', 'update', 'breakthrough', 'major', 'available now'];

    const detectInterests = (text: string): string[] => {
      const lowerText = text.toLowerCase();
      return Object.entries(INTEREST_KEYWORDS)
        .filter(([_, kws]) => kws.some(k => lowerText.includes(k)))
        .map(([interest]) => interest);
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('https://eventregistry.org/api/v1/article/getArticles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getArticles',
          keyword: 'AI',
          keywordLoc: 'title',
          lang: 'eng',
          articlesPage: 1,
          articlesCount: 50,
          articlesSortBy: 'date',
          articlesSortByAsc: false,
          dataType: ['news'],
          forceMaxDataTimeWindow: 3,
          resultType: 'articles',
          apiKey: NEWS_API_KEY,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data?.articles?.results?.length > 0) {
        const strictArticles = data.articles.results.filter((art: any) => {
          const title = art.title.toLowerCase();
          const hasAiKeyword = AI_STRICT_KEYWORDS.some(k => title.includes(k));
          if (!hasAiKeyword) return false;
          const isFinancial = title.includes('stock') || title.includes('share') || title.includes('market') || title.includes('invest');
          if (isFinancial && !title.includes('launch') && !title.includes('release')) return false;
          return true;
        });

        const FILTER_KEYWORDS = ['launch', 'release', 'update', 'feature', 'new', 'how to', 'guide', 'tool', 'platform', 'model'];
        const filteredArticles = strictArticles.filter((art: any) => {
          const text = (art.title + ' ' + (art.body || '')).toLowerCase();
          return FILTER_KEYWORDS.some(k => text.includes(k));
        });

        const finalArticles = filteredArticles.length >= 1 ? filteredArticles : strictArticles;

        const news: VerifiedUpdate[] = finalArticles.slice(0, 20).map((art: any, i: number) => {
          const fullText = `${art.title} ${art.body || ''}`;
          const interests = detectInterests(fullText);
          const isMajor = MAJOR_KEYWORDS.some(k => art.title.toLowerCase().includes(k));
          return {
            id: art.uri || `news-${Date.now()}-${i}`,
            title: art.title,
            shortSummary: art.body?.substring(0, 200).replace(/\n/g, ' ') + '...' || art.title,
            relevanceScore: isMajor ? Math.min(99, 95 - i) : (88 - i),
            difficultyLevel: 1,
            source: art.source?.title || 'AI News',
            date: art.dateTimePub || art.date || new Date().toISOString(),
            url: art.url,
            updateType: isMajor ? UpdateType.MajorRelease : UpdateType.Improvement,
            lessonEligible: true,
            interests: interests.length > 0 ? interests : ['technology'],
          };
        });

        news.sort((a, b) => b.relevanceScore - a.relevanceScore);

        try {
          await storageService.setCached(CACHE_KEY, JSON.stringify({ date: today, news }));
        } catch (e) {
          console.warn('Failed to cache news');
        }

        return news;
      }
    } catch (e) {
      console.warn('Live news fetch failed, using fallback:', e);
    }

    return MOCK_UPDATES;
  }

  // =============================================
  // DIRECT GEMINI REST CALL
  // =============================================
  private async directCall(prompt: string, jsonMode: boolean = false): Promise<string | null> {
    if (!this.apiKey || this.isDemoMode) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
        }),
      });

      if (!response.ok) {
        console.error('Gemini API Error:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
      console.error('Direct API Call Failed', e);
      return null;
    }
  }

  private cleanAndParseJSON<T>(text: string | undefined): T | null {
    if (!text) return null;
    try {
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        try { return JSON.parse(codeBlockMatch[1]); } catch (e) { /* continue */ }
      }
      const clean = text.replace(/```json\n?|```/g, '').trim();
      try { return JSON.parse(clean); } catch (e) { /* continue */ }
      const firstBrace = text.indexOf('{');
      const firstBracket = text.indexOf('[');
      const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1) ? firstBrace : Math.min(firstBrace, firstBracket);
      const lastBrace = text.lastIndexOf('}');
      const lastBracket = text.lastIndexOf(']');
      const end = Math.max(lastBrace, lastBracket);
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(text.substring(start, end + 1));
      }
      return null;
    } catch (e) {
      console.error('JSON Parse Failed', e);
      return null;
    }
  }

  // =============================================
  // UPDATES
  // =============================================
  async discoverUpdates(): Promise<RawUpdateSignal[]> {
    if (this.isDemoMode) {
      return MOCK_UPDATES.map(u => ({
        sourceId: u.source, rawContent: u.shortSummary,
        detectedAt: u.date, url: u.url || '', id: u.id,
      }));
    }

    try {
      const realNews = await this.fetchNewsApiUpdates();
      if (realNews.length > 0) return realNews;
    } catch (e) {
      console.warn('NewsAPI failed, falling back to Gemini.', e);
    }

    try {
      const today = new Date().toDateString();
      const responseText = await this.directCall(AGENT_PROMPTS.DISCOVERY(today), true);
      const parsed = this.cleanAndParseJSON<RawUpdateSignal[]>(responseText);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Discovery Failed', e);
    }

    return MOCK_UPDATES.map(u => ({
      sourceId: u.source, rawContent: u.shortSummary,
      detectedAt: u.date, url: u.url || '', id: u.id,
    }));
  }

  private async fetchNewsApiUpdates(): Promise<RawUpdateSignal[]> {
    const body = {
      action: 'getArticles',
      keyword: 'Artificial Intelligence',
      keywordLoc: 'title',
      lang: 'eng',
      articlesPage: 1,
      articlesCount: 15,
      articlesSortBy: 'date',
      articlesSortByAsc: false,
      dataType: ['news', 'blog'],
      forceMaxDataTimeWindow: 31,
      resultType: 'articles',
      apiKey: NEWS_API_KEY,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://eventregistry.org/api/v1/article/getArticles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data?.articles?.results) {
        return data.articles.results.map((art: any) => ({
          id: art.uri,
          rawContent: `${art.title}\n\n${art.body?.substring(0, 500)}...`,
          sourceId: art.source?.title || 'NewsAPI',
          url: art.url,
          detectedAt: (art.dateTimePub && !isNaN(Date.parse(art.dateTimePub)))
            ? new Date(art.dateTimePub).toISOString()
            : new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error('NewsAPI Fetch Error', e);
    }
    return [];
  }

  async classifyUpdates(signals: RawUpdateSignal[], user: UserContext): Promise<VerifiedUpdate[]> {
    if (this.isDemoMode || signals.length === 0) return MOCK_UPDATES;

    try {
      const prompt = AGENT_PROMPTS.RELEVANCE(JSON.stringify(user)) + `\n\nInput Signals: ${JSON.stringify(signals)}`;
      const response = await this.ai.models.generateContent({
        model: GEMINI_FLASH_LITE,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = this.cleanAndParseJSON<VerifiedUpdate[]>(response.text);
      if (!parsed) return [];
      return parsed.filter(u => u && u.title && u.shortSummary).map(u => ({
        ...u,
        date: u.date && !isNaN(Date.parse(u.date)) ? u.date : new Date().toISOString(),
        relevanceScore: u.relevanceScore || 85,
        difficultyLevel: u.difficultyLevel || 1,
      }));
    } catch (e) {
      console.error('Classification Failed', e);
      return signals.map(s => ({
        id: s.id || `fallback-${Date.now()}-${Math.random()}`,
        title: `Fresh News from ${s.sourceId || 'AI'}`,
        shortSummary: s.rawContent.substring(0, 150).replace(/\n/g, ' ') + '...',
        relevanceScore: 90,
        difficultyLevel: 1,
        source: s.sourceId || 'Web',
        date: s.detectedAt || new Date().toISOString(),
        url: s.url,
        updateType: UpdateType.Improvement,
        lessonEligible: false,
      }));
    }
  }

  // =============================================
  // LESSONS
  // =============================================
  async generateLesson(update: VerifiedUpdate, user: UserContext): Promise<MicroLesson | null> {
    if (this.isDemoMode) return { ...MOCK_LESSON, title: `Mastering: ${update.title.substring(0, 20)}...` };

    try {
      const prompt = AGENT_PROMPTS.LESSON_GENERATION(JSON.stringify(update), JSON.stringify(user));
      const response = await this.ai.models.generateContent({
        model: GEMINI_FLASH_LITE,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const lesson = this.cleanAndParseJSON<MicroLesson>(response.text);
      if (lesson && Array.isArray(lesson.steps) && lesson.steps.length > 0 && lesson.title) {
        lesson.imageUrl = `https://pollinations.ai/p/${encodeURIComponent(lesson.visualConcept || update.title)}?width=800&height=400&seed=${Math.random()}`;
        return lesson;
      }
    } catch (e) {
      console.error('Lesson Gen Failed', e);
    }

    return {
      id: 'fallback-' + Date.now(), updateId: update.id,
      title: 'Instant Lesson Unavailable', duration: '1 min',
      whyItMatters: "We couldn't generate a custom lesson right now.",
      whatChanged: 'The AI service provided an incomplete response.',
      steps: ['Review the original source link.', 'Try generating this lesson again.', 'Explore related tools in Trending.'],
      mentalModel: 'Fallback Mode', practiceTask: 'Read the full update context.',
      imageUrl: 'https://pollinations.ai/p/technical_maintenance_robot?width=800&height=400',
    };
  }

  // =============================================
  // TOOLS
  // =============================================
  async discoverTools(user: UserContext): Promise<ToolSuggestion[]> {
    let tools = [...CURATED_TOOLS];

    const roleKeywords: Record<string, string[]> = {
      Developer: ['Coding', 'Development', 'API', 'GitHub', 'Code'],
      Designer: ['Design', 'Creative', 'Visual', 'UI', 'Image'],
      Marketer: ['Marketing', 'Content', 'Writing', 'Social', 'SEO'],
      Student: ['Research', 'Writing', 'Learning', 'Study'],
      Researcher: ['Research', 'Analysis', 'Data', 'Academic'],
      Writer: ['Writing', 'Content', 'Creative', 'Text'],
      Entrepreneur: ['Business', 'Planning', 'Automation', 'Productivity'],
    };

    tools = tools.map(tool => {
      let score = tool.matchScore || 50;
      const toolText = `${tool.name} ${tool.description} ${tool.category} ${(tool.useCases || []).join(' ')} ${(tool.bestFor || []).join(' ')}`.toLowerCase();

      if (user.role) {
        const keywords = roleKeywords[user.role] || [];
        keywords.forEach(keyword => { if (toolText.includes(keyword.toLowerCase())) score += 15; });
        if (tool.bestFor?.some(b => b.toLowerCase().includes((user.role || '').toLowerCase()))) score += 25;
      }

      if (user.goals?.length > 0) {
        user.goals.forEach(goal => { if (toolText.includes(goal.toLowerCase())) score += 10; });
      }

      return { ...tool, matchScore: Math.min(score, 100) };
    });

    tools.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    if (!this.isDemoMode) {
      try {
        const today = new Date().toDateString();
        const prompt = AGENT_PROMPTS.TOOL_DISCOVERY(JSON.stringify(user), today);
        const responseText = await this.directCall(prompt, true);
        const discovered = this.cleanAndParseJSON<ToolSuggestion[]>(responseText);
        if (discovered && discovered.length > 0) {
          const existingNames = new Set(tools.map(t => t.name.toLowerCase()));
          const newTools = discovered.filter(d => !existingNames.has(d.name.toLowerCase()));
          tools = [...newTools, ...tools];
        }
      } catch (e) {
        console.warn('Tool discovery failed, using curated.', e);
      }
    }

    return tools;
  }

  async generateToolLesson(tool: ToolSuggestion, user: UserContext): Promise<MicroLesson | null> {
    if (this.isDemoMode) return { ...MOCK_LESSON, title: `Learn ${tool.name}`, whatChanged: tool.description };

    try {
      const prompt = AGENT_PROMPTS.MASTER_GUIDE(JSON.stringify(tool), JSON.stringify(user || { role: 'Explorer' }));
      const responseText = await this.directCall(prompt, true);
      const lesson = this.cleanAndParseJSON<MicroLesson>(responseText);
      if (lesson && Array.isArray(lesson.steps) && lesson.steps.length > 0) {
        lesson.steps = lesson.steps.map((step: unknown) => {
          if (typeof step === 'string') return step;
          if (typeof step === 'object' && step !== null) {
            const s = step as Record<string, unknown>;
            return String(s.text || s.content || s.description || s.title || JSON.stringify(step));
          }
          return String(step);
        });
        lesson.imageUrl = `https://pollinations.ai/p/${encodeURIComponent(tool.name + ' UI interface')}?width=800&height=400&seed=${Math.random()}`;
        return lesson;
      }
    } catch (e) {
      console.error('Tool Lesson Gen Failed', e);
    }

    return {
      id: 'fallback-tool-' + Date.now(), updateId: tool.id,
      title: `Explore ${tool.name}`, duration: '2 min',
      whyItMatters: "We couldn't generate the full guide right now.",
      whatChanged: tool.description || 'A powerful AI tool to explore.',
      steps: [`Go to ${tool.name}'s website`, 'Create a free account', 'Try asking it a simple question', 'Explore the help documentation'],
      mentalModel: 'Learning by doing', practiceTask: 'Spend 5 minutes exploring the interface.',
    };
  }

  async generateInterestLesson(interest: string): Promise<MicroLesson | null> {
    const INTEREST_TOOLS: Record<string, { tool: string; domain: string; description: string }> = {
      creative: { tool: 'Midjourney', domain: 'midjourney.com', description: 'AI image generation for stunning visuals' },
      business: { tool: 'Notion AI', domain: 'notion.so', description: 'AI-powered workspace for productivity' },
      development: { tool: 'Cursor', domain: 'cursor.com', description: 'AI-first code editor that writes code for you' },
      writing: { tool: 'Claude', domain: 'claude.ai', description: 'Advanced AI assistant for ariting and editing' },
      research: { tool: 'Perplexity AI', domain: 'perplexity.ai', description: 'AI-powered research and answer engine' },
      productivity: { tool: 'Zapier AI', domain: 'zapier.com', description: 'AI workflow automation' },
      media: { tool: 'Runway', domain: 'runwayml.com', description: 'AI video generation and editing' },
      music: { tool: 'Suno AI', domain: 'suno.ai', description: 'AI music generation' },
    };

    const toolInfo = INTEREST_TOOLS[interest] || { tool: 'ChatGPT', domain: 'chat.openai.com', description: 'General-purpose AI assistant' };

    const prompt = `Generate a beginner-friendly microlesson for using ${toolInfo.tool} (${toolInfo.description}). Return ONLY valid JSON: { "title": "string", "duration": "3 min", "whyItMatters": "string", "whatChanged": "string", "steps": ["string"], "mentalModel": "string", "practiceTask": "string", "taskPrompt": "string" }`;

    try {
      const responseText = await this.directCall(prompt, true);
      const lesson = this.cleanAndParseJSON<MicroLesson>(responseText);
      if (lesson && Array.isArray(lesson.steps) && lesson.steps.length > 0) {
        lesson.id = `tool-lesson-${interest}-${Date.now()}`;
        lesson.updateId = interest;
        lesson.imageUrl = `https://pollinations.ai/p/${encodeURIComponent(toolInfo.tool + ' AI interface modern')}?width=800&height=400`;
        return lesson;
      }
    } catch (e) {
      console.error('Interest tool lesson generation failed:', e);
    }

    return {
      id: `fallback-tool-${interest}-${Date.now()}`, updateId: interest,
      title: `Get Started with ${toolInfo.tool}`, duration: '3 min',
      whyItMatters: `${toolInfo.tool} makes ${interest} tasks faster and easier.`,
      whatChanged: toolInfo.description,
      steps: [`Go to ${toolInfo.domain} and sign up for free`, 'Try the main feature with a simple task', 'Explore the help section for tips', 'Bookmark it for regular use'],
      mentalModel: 'Think of it as your AI assistant',
      practiceTask: `Spend 5 minutes exploring ${toolInfo.tool}`,
      taskPrompt: `Help me get started with ${interest}-related tasks. What should I try first?`,
    };
  }

  async generateLearningPath(category: string): Promise<string[]> {
    if (this.isDemoMode) return MOCK_PATHS[category] || ['Module 1', 'Module 2', 'Module 3'];

    try {
      const prompt = AGENT_PROMPTS.PATH_GENERATION(category);
      const response = await this.ai.models.generateContent({
        model: GEMINI_FLASH_LITE,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return this.cleanAndParseJSON<string[]>(response.text) || MOCK_PATHS[category];
    } catch (e) {
      return MOCK_PATHS[category];
    }
  }

  async generateDailyLifeHack(
    updates: VerifiedUpdate[],
    tools: ToolSuggestion[],
    user: UserContext
  ): Promise<DailyLifeHack | null> {
    if (this.isDemoMode) return null;
    try {
      const prompt = AGENT_PROMPTS.LIFE_HACK(JSON.stringify(user), JSON.stringify(updates.slice(0, 3)));
      const responseText = await this.directCall(prompt, true);
      return this.cleanAndParseJSON<DailyLifeHack>(responseText);
    } catch (e) {
      return null;
    }
  }

  // =============================================
  // CHAT
  // =============================================
  initChat(user: UserContext) {
    if (this.isDemoMode) return;
    try {
      this.chatSession = this.ai.chats.create({
        model: GEMINI_PRO,
        config: { systemInstruction: AGENT_PROMPTS.CHAT_SYSTEM(JSON.stringify(user)) },
      });
    } catch (e) {
      console.warn('Chat init failed', e);
    }
  }

  async sendChatMessage(message: string): Promise<string> {
    if (this.isDemoMode) return 'Demo Mode: Connect your Gemini API key for live chat.';
    if (!this.chatSession) return 'Connection not established.';
    try {
      const result = await this.chatSession.sendMessage({ message });
      return result.text;
    } catch (e) {
      return "I'm having trouble connecting right now. Please try again.";
    }
  }
}

export const deltaService = new DeltaService();
