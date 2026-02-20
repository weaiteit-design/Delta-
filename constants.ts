export const APP_NAME = "Delta";

export const LEVEL_SYSTEM = [
  { level: 1, xp: 0, title: "Observer", color: "text-neutral-400", border: "border-neutral-700" },
  { level: 2, xp: 100, title: "Explorer", color: "text-blue-400", border: "border-blue-500/50" },
  { level: 3, xp: 300, title: "Builder", color: "text-green-400", border: "border-green-500/50" },
  { level: 4, xp: 600, title: "Architect", color: "text-orange-400", border: "border-orange-500/50" },
  { level: 5, xp: 1000, title: "Visionary", color: "text-purple-400", border: "border-purple-500/50" },
  { level: 6, xp: 1500, title: "Oracle", color: "text-yellow-400", border: "border-yellow-500/50" }
];

export const XP_PER_LESSON = 50;

export const TOP_MODELS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "DeepSeek",
  "Perplexity",
  "Sora",
  "Midjourney",
  "Cursor",
  "Llama",
  "Suno"
];

export const AGENT_PROMPTS = {
  DISCOVERY: (currentDate: string) => `
    Act as the "Update Discovery Agent". 
    Current Date: ${currentDate}
    
    Goal: Find 8 granular, breaking AI news items from the **last 24-48 hours**.
    
    CRITERIA:
    - MUST be from the last 48 hours.
    - Focus on: Minor version updates, pricing changes, new features, and ecosystem news (e.g. "OpenAI drops prices", "DeepSeek adds API").
    - Style: "Live Feed" / Ticker style.
    
    Return a JSON array wrapped in markdown code blocks.
    Structure:
    [
      {
        "id": "string",
        "rawContent": "string (specific detail)",
        "sourceId": "string",
        "url": "string",
        "detectedAt": "string (ISO date)"
      }
    ]
  `,

  RELEVANCE: (userJson: string) => `
    Act as the "Personal Curation Agent". 
    Input User Profile: ${userJson}
    
    Task: Format these updates for a clean, mobile feed.
    
    CRITICAL INSTRUCTIONS:
    - TITLE RULE: Use the BRAND NAME ONLY, no version numbers.
    - SCORE STRICTLY:
      * 90-100: ESSENTIAL for a ${JSON.parse(userJson).role}. (e.g. Coding tools for Devs, Design tools for Creatives).
      * 70-89: Important Industry News (e.g. "OpenAI drops price", "Gemini 2.0").
      * 50-69: General Awareness.
      * STRICTLY DOWN-RANK: If news is for Devs (APIs, Python, Models) and user is NOT technical -> Max Score 65.
      * < 50: REJECT.
    - Rewrite titles to be short and punchy.
    
    Return verified JSON array of "VerifiedUpdate".
  `,

  LESSON_GENERATION: (updateJson: string, userJson: string) => `
    Act as a "Friendly Mentor".
    Update: ${updateJson}
    User: ${userJson}
    
    Generate a micro-lesson that is **Not Scary** and **Immediately Useful**.
    
    TONE GUIDE:
    - Use simple, plain English. No jargon.
    - Be encouraging. "You can do this."
    - Focus on the 'Magic Moment' - the specific cool thing they can do.
    
    Structure the 'steps' as if talking to a friend sitting next to you.
    
    Return JSON (MicroLesson).
    {
      "id": "string",
      "title": "string (Simple, Actionable)",
      "duration": "2 min",
      "whyItMatters": "string (Why this saves time/energy)",
      "whatChanged": "string (One sentence summary)",
      "steps": ["string"],
      "mentalModel": "string (Simple analogy)",
      "practiceTask": "string (A fun, easy 2-minute task)",
      "taskPrompt": "string (A ready-to-copy prompt the user can paste directly. Must be a real prompt, not instructions. Example: 'Summarize this article in 3 bullet points' or 'Generate 5 creative names for a coffee shop')",
      "visualConcept": "string"
    }
  `,

  TOOL_DISCOVERY: (userJson: string, currentDate: string) => `
    Act as "Trend Scout". 
    User: ${userJson} 
    Date: ${currentDate}
    
    Goal: Find 5 "Hidden Gem" or "Trending" AI tools.
    
    CRITERIA:
    - SOURCE: Look for tools popping up on Twitter (X), Reddit (r/LocalLLaMA, r/OpenAI), and Product Hunt in the last 7 days.
    - TYPE: "Underrated" but powerful. (e.g. specialized coding agents, new voice clones, video generators).
    - EXCLUDE: The obvious ones (ChatGPT, Gemini) - we already have those.
    - FOCUS: Web-based, immediate utility.
    
    Return JSON array of ToolSuggestion. Add a "collection" field: "New" or "Underrated".
  `,

  TOOL_LESSON_GENERATION: (toolJson: string, userJson: string) => `
    Act as "Tool Tutor".
    Tool: ${toolJson}
    User: ${userJson}

    Create a "Quick Start" MicroLesson.
    Tone: "Look how cool & easy this is."
    Focus: One specific "Magic Moment" the user can try in 2 minutes.
    
    Return JSON (MicroLesson).
  `,

  LIFE_HACK: (userJson: string, updatesJson: string) => `
    Act as "Productivity Coach".
    Create one simple "Life Hack" using AI for this user today.
    It should be surprising but easy.
    Return JSON (DailyLifeHack).
  `,

  MASTER_GUIDE: (toolJson: string, userJson: string) => `
You are a friendly AI teacher. Explain this tool in simple terms anyone can understand.

TOOL INFO: ${toolJson}
USER: ${userJson}

Return ONLY valid JSON (no markdown, no extra text):
{
  "id": "lesson-1",
  "title": "Your First Steps with [Tool Name]",
  "duration": "3 min",
  "whyItMatters": "A friendly one-sentence hook about why this matters",
  "whyUseThisTool": "2-3 sentences explaining WHO should use this tool and WHAT problems it solves. Be specific.",
  "whatChanged": "What the tool does in simple terms",
  "steps": [
    "Step 1: A simple, clear action anyone can follow",
    "Step 2: The next logical step",
    "Step 3: Something to try that shows value",
    "Step 4: How to explore more"
  ],
  "mentalModel": "A simple analogy or concept to remember",
  "practiceTask": "One easy task to try right now (takes < 2 minutes)",
  "taskPrompt": "A ready-to-copy prompt the user can paste directly into the tool. Example: 'Write me a professional email declining a meeting politely' or 'Create a 30-day workout plan for beginners'. This should be specific and immediately usable."
}

RULES:
- Write like you're explaining to a smart friend who's never used AI before
- No jargon - if you must use a technical term, explain it in parentheses
- Steps should be specific and actionable, not vague
- Keep it encouraging and practical
- The taskPrompt MUST be a real, copy-paste ready prompt (not instructions about what to do)
  `,

  CHAT_SYSTEM: (userJson: string) => `
    You are Delta, a helpful, encouraging AI coach.
    User Profile: ${userJson}
    
    Your goal is to make AI feel safe and accessible.
    - Never use complex jargon without explaining it.
    - If the user feels overwhelmed, reassure them.
    - Always suggest the *simplest* tool for the job.
    - Keep answers short and actionable.
  `,

  PATH_GENERATION: (category: string) => `
     Act as "Curriculum Designer for Beginners".
     Category: ${category}
     
     Generate a learning path of 3 modules.
     
     RULES:
     - Titles must be non-technical and inviting. (e.g. "Writing emails faster" instead of "LLM Text Generation").
     - Progression: Easy -> Medium -> Cool.
     - Avoid "Introduction to..." - make it specific.
     
     Return JSON Array of strings.
     Example: ["Fixing your grammar", "Brainstorming ideas", "Writing in your voice"]
  `
};