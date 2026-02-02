import { GoogleGenAI, Chat } from "@google/genai";
import { AGENT_PROMPTS } from "../constants";
import { 
  RawUpdateSignal, 
  VerifiedUpdate, 
  UserContext, 
  MicroLesson, 
  ToolSuggestion,
  DailyLifeHack,
  ModelGuide
} from "../types";

// Fallback data: Trending Tools in 2026 (Instant Load)
const FALLBACK_TOOLS: ToolSuggestion[] = [
  {
    id: 'fb-1',
    name: 'OpenClaw',
    category: 'Autonomous Agent',
    collection: 'Major',
    description: 'A viral autonomous AI assistant that integrates with WhatsApp/Telegram to perform tasks automatically.',
    useCases: ['Automating personal scheduling', 'Cross-app task execution', 'Background research'],
    bestFor: ['Early Adopters', 'Productivity Seekers'],
    matchScore: 98,
    learningCurve: 'Medium',
    deltaAnalysis: 'The next generation of "step change" agents. It does the work, you just supervise.',
    trending: true,
    url: 'https://github.com/openclaw'
  },
  {
    id: 'fb-2',
    name: 'DeepSeek V3.2',
    category: 'Reasoning',
    collection: 'Major',
    description: 'Open-source model series that rivals GPT-5.2 in reasoning, math, and coding tasks.',
    useCases: ['Complex logic puzzles', 'Offline secure coding', 'Advanced mathematical proofs'],
    bestFor: ['Developers', 'Researchers'],
    matchScore: 99,
    learningCurve: 'High',
    deltaAnalysis: 'Democratizing high-performance AI. Strongest open-source contender to proprietary giants.',
    trending: true,
    url: 'https://chat.deepseek.com'
  },
  {
    id: 'fb-3',
    name: 'Qwen3-Omni',
    category: 'Multimodal',
    collection: 'New',
    description: 'Scalable multimodal model family optimized for huge context windows and rich cross-modal inputs.',
    useCases: ['Analyzing long videos', 'Image-to-code pipelines', 'Mixed-media content creation'],
    bestFor: ['Creators', 'Enterprise'],
    matchScore: 95,
    learningCurve: 'Medium',
    deltaAnalysis: 'Leading the pack in multimodal throughput. Essential for video/audio workflows.',
    trending: true,
    url: 'https://qwenlm.ai'
  },
  {
    id: 'fb-4',
    name: 'Kimi K2.5 Thinking',
    category: 'Long-Context',
    collection: 'Underrated',
    description: 'Chatbot series with extremely long context handling, perfect for structured problem solving.',
    useCases: ['Legal document analysis', 'Codebase refactoring', 'Novel-length summarization'],
    bestFor: ['Engineers', 'Writers'],
    matchScore: 92,
    learningCurve: 'Low',
    deltaAnalysis: 'The "Infinite Context" king. Use this when your prompt exceeds standard token limits.',
    trending: true,
    url: 'https://kimi.ai'
  },
  {
    id: 'fb-5',
    name: 'LTX-2',
    category: 'Video Generation',
    collection: 'New',
    description: 'Generates synchronized audio-video at 4K resolution. The new standard for open generative video.',
    useCases: ['Marketing B-roll', 'Social media clips', 'Visual storytelling'],
    bestFor: ['Creators', 'Marketers'],
    matchScore: 96,
    learningCurve: 'Medium',
    deltaAnalysis: 'A massive leap in open-source video fidelity. Competes directly with Sora/Veo.',
    trending: true,
    url: 'https://github.com/ltx-video'
  }
];

class DeltaService {
  private ai: GoogleGenAI;
  private apiKey: string | undefined;
  private chatSession: Chat | null = null;

  constructor() {
    this.apiKey = process.env.API_KEY;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.warn("API_KEY is missing. Delta Service will not function correctly.");
      this.ai = new GoogleGenAI({ apiKey: "dummy" }); 
    }
  }

  /**
   * Helper: Manually clean and parse JSON from model output.
   * This is required because we cannot use `responseMimeType: 'application/json'`
   * combined with `tools` (search) without causing INVALID_ARGUMENT errors.
   */
  private cleanAndParseJSON<T>(text: string | undefined): T | null {
    if (!text) return null;
    try {
      // Remove markdown code blocks if present (e.g. ```json ... ```)
      const clean = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(clean) as T;
    } catch (e) {
      console.error("JSON Parse Failed on:", text, e);
      return null;
    }
  }

  // HELPER: GENERATE VISUALS (NanoBanana / Gemini 2.5 Flash Image)
  private async generateVisual(concept: string): Promise<string | undefined> {
    if (!concept) return undefined;
    try {
      const enhancedPrompt = `
        Render a high-quality 3D icon/illustration.
        Style: Claymorphism or soft 3D, similar to modern tech branding (Duolingo, Airbnb).
        Subject: ${concept}.
        Composition: Isometric or front-facing, floating in center.
        Lighting: Soft, warm studio lighting with rim light.
        Colors: Vibrant, saturated accents on a dark matte background (hex #101010).
        Quality: 4k, octane render, highly detailed.
      `;

      // gemini-2.5-flash-image is quota efficient and high quality for icons
      const imageResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
              aspectRatio: "16:9",
          }
        }
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
      }
    } catch (e: any) {
      if (e.toString().includes('403') || e.toString().includes('Permission denied')) {
        console.warn("Visual Generation Skipped: API Key issue. Using text fallback.");
      } else {
        console.error("Visual generation failed:", e);
      }
    }
    return undefined;
  }

  // AGENT 1: DISCOVERY
  async discoverUpdates(): Promise<RawUpdateSignal[]> {
    try {
      const today = new Date().toDateString();
      // FIX: Removed responseMimeType: "application/json" to prevent INVALID_ARGUMENT with tools
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: AGENT_PROMPTS.DISCOVERY(today),
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      const parsed = this.cleanAndParseJSON<RawUpdateSignal[]>(response.text);
      return parsed || [];
    } catch (e) {
      console.error("Discovery Agent Failed:", e);
      return [];
    }
  }

  // AGENT 2: CLASSIFICATION
  async classifyUpdates(signals: RawUpdateSignal[], user: UserContext): Promise<VerifiedUpdate[]> {
    try {
      if (signals.length === 0) return [];
      const prompt = AGENT_PROMPTS.RELEVANCE(JSON.stringify(user)) + `\n\nInput Signals: ${JSON.stringify(signals)}`;
      
      // Flash Lite is fine with JSON mime type as it has no tools here
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return this.cleanAndParseJSON<VerifiedUpdate[]>(response.text) || [];
    } catch (e) {
      console.error("Classification Agent Failed:", e);
      return [];
    }
  }

  // AGENT 3: LESSON GENERATION
  async generateLesson(update: VerifiedUpdate, user: UserContext): Promise<MicroLesson | null> {
    try {
      const prompt = AGENT_PROMPTS.LESSON_GENERATION(JSON.stringify(update), JSON.stringify(user));

      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const lesson = this.cleanAndParseJSON<MicroLesson>(response.text);
      if (!lesson) return null;

      if (lesson.visualConcept) {
         lesson.imageUrl = await this.generateVisual(lesson.visualConcept);
      }

      return lesson;
    } catch (e) {
      console.error("Lesson Agent Failed:", e);
      return null;
    }
  }

  // AGENT 4: TOOL DISCOVERY
  async discoverTools(user: UserContext): Promise<ToolSuggestion[]> {
    try {
      const today = new Date().toDateString();
      const prompt = AGENT_PROMPTS.TOOL_DISCOVERY(JSON.stringify(user), today);

      // FIX: Removed responseMimeType
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const parsed = this.cleanAndParseJSON<ToolSuggestion[]>(response.text);
      if (!parsed || parsed.length === 0) return FALLBACK_TOOLS;
      return parsed;
    } catch (e) {
      console.error("Tool Discovery Agent Failed:", e);
      return FALLBACK_TOOLS;
    }
  }

  // AGENT 4.5: TARGETED TOOL SEARCH (DYNAMIC FINDER)
  async findToolsForUseCase(query: string, user: UserContext): Promise<ToolSuggestion[]> {
    try {
      const prompt = `
        Act as the "Universal AI Tool Finder" (The "There's an AI for that" engine).
        User Role: ${user.role}
        User Query: "${query}"

        Task: Find the PERFECT AI tool for this specific request.
        
        Search Strategy:
        1. Search "Best AI tool for ${query} 2025"
        2. Search "AI alternative to [User's implied task]"
        3. Search on "There's an AI for that" or "Product Hunt" for this query.
        
        Return JSON array of 4-5 'ToolSuggestion' objects. 
        - If the user asks for a specific app (e.g. "Zoom"), find an AI wrapper or alternative (e.g. "Fathom").
        - MatchScore should reflect how well it solves the query.
        - 'DeltaAnalysis' should explain WHY this specific tool fits the query.
        
        Output valid JSON only.
      `;

      // FIX: Removed responseMimeType
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      return this.cleanAndParseJSON<ToolSuggestion[]>(response.text) || [];
    } catch (e) {
      console.error("Targeted Tool Search Failed:", e);
      return [];
    }
  }

  // AGENT 5: TOOL LESSON GENERATION
  async generateToolLesson(tool: ToolSuggestion, user: UserContext): Promise<MicroLesson | null> {
    try {
      const prompt = AGENT_PROMPTS.TOOL_LESSON_GENERATION(JSON.stringify(tool), JSON.stringify(user));

      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const lesson = this.cleanAndParseJSON<MicroLesson>(response.text);
      if (!lesson) return null;

      if (lesson.visualConcept) {
        lesson.imageUrl = await this.generateVisual(lesson.visualConcept);
      }

      return lesson;
    } catch (e) {
      console.error("Tool Lesson Agent Failed:", e);
      return null;
    }
  }

  // AGENT 6: DAILY LIFE HACK GENERATION
  async generateDailyLifeHack(updates: VerifiedUpdate[], tools: ToolSuggestion[], user: UserContext): Promise<DailyLifeHack | null> {
    try {
      const hasContext = (updates && updates.length > 0) || (tools && tools.length > 0);
      let prompt = "";
      
      const model = 'gemini-2.5-flash';
      const useTools = !hasContext;

      if (hasContext) {
         const contextData = JSON.stringify({
           recentUpdates: updates ? updates.slice(0, 5) : [],
           trendingTools: tools ? tools.slice(0, 5) : []
         });
         prompt = AGENT_PROMPTS.LIFE_HACK(JSON.stringify(user), contextData);
      } else {
         prompt = `
           Act as the "Daily Integration Agent".
           User Profile: ${JSON.stringify(user)}
           
           Goal: Find a specific, high-impact "Daily Life Hack" using an AI tool that helps this user.
           Use Google Search to find "trending AI productivity hacks 2024" or "AI workflows for ${user.role}".
           
           Select ONE simple, actionable hack.
           
           Return valid JSON (DailyLifeHack):
           {
             "id": "string",
             "title": "string",
             "toolName": "string",
             "context": "string",
             "action": "string",
             "impact": "string"
           }
         `;
      }

      // FIX: Removed responseMimeType when tools are used
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: useTools ? [{ googleSearch: {} }] : [],
        }
      });

      return this.cleanAndParseJSON<DailyLifeHack>(response.text);
    } catch (e) {
      console.error("Life Hack Agent Failed:", e);
      return null;
    }
  }

  // AGENT 7: MODEL MASTER GUIDE
  async generateModelGuide(modelName: string): Promise<ModelGuide | null> {
    try {
      const today = new Date().toDateString();
      const prompt = AGENT_PROMPTS.MODEL_GUIDE(modelName, today);

      // FIX: Removed responseMimeType
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const guide = this.cleanAndParseJSON<ModelGuide>(response.text);
      if (!guide) return null;

      if (guide.visualConcept) {
         guide.imageUrl = await this.generateVisual(guide.visualConcept);
      }

      return guide;
    } catch (e) {
      console.error("Model Guide Agent Failed:", e);
      return null;
    }
  }

  // Helper to expose fallback tools immediately for fast loading
  getFallbackTools(): ToolSuggestion[] {
    return FALLBACK_TOOLS;
  }

  // CHAT: INITIALIZATION
  initChat(user: UserContext) {
    if (this.chatSession) return;
    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash', // Stable Flash model for chat
      config: {
        systemInstruction: AGENT_PROMPTS.CHAT_SYSTEM(JSON.stringify(user)),
      }
    });
  }

  // CHAT: SEND MESSAGE
  async sendChatMessage(message: string): Promise<string> {
    if (!this.chatSession) throw new Error("Chat not initialized");
    try {
      const response = await this.chatSession.sendMessage({ message });
      return response.text || "";
    } catch (e) {
      console.error("Chat Error:", e);
      return "I'm having trouble connecting right now. Please try again.";
    }
  }
}

export const deltaService = new DeltaService();