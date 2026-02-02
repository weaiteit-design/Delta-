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
  "ChatGPT (GPT-5.2)",
  "Claude (Opus 4.5)",
  "Gemini 3 Pro",
  "Perplexity Pro",
  "Cursor",
  "GitHub Copilot",
  "Notion AI",
  "Zapier AI",
  "Midjourney v6",
  "Microsoft Copilot"
];

export const AGENT_PROMPTS = {
  DISCOVERY: (currentDate: string) => `
    Act as the "Update Discovery Agent". Your goal is to find the latest, real-world AI changes.
    
    Current Date: ${currentDate}
    
    Use Google Search to find 5-6 significant AI updates from the **last 7 days ONLY**.
    
    STRICT TIME CONSTRAINT:
    - Do NOT include any news older than 7 days from ${currentDate}.
    - Prioritize updates from the last 24 hours.
    
    SEARCH TARGETS:
    - DeepSeek (R1 updates), Google (Gemini 2.5/3, Veo), OpenAI (o3, Sora, Operator), Anthropic (Claude 3.7/Opus), xAI (Grok 3).
    - Coding Agents: Cursor, Windsurf, Bolt.new, Lovable.
    - Image/Video: Midjourney v6.1/v7, Runway Gen-3, Luma Ray 2, Sora.
    
    Return a JSON array wrapped in markdown code blocks.
    Structure:
    [
      {
        "id": "string",
        "rawContent": "string (detailed technical description)",
        "sourceId": "string (Source Name)",
        "url": "string",
        "detectedAt": "string (ISO date)"
      }
    ]
  `,
  
  RELEVANCE: (userJson: string) => `
    Act as the "Relevance & Classification Agent". 
    
    Input User Profile: ${userJson}
    
    For each provided update signal, analyze it against the user profile.
    Return a JSON array of "VerifiedUpdate" objects:
    - id: string (match input)
    - title: string (Editorial style, short, punchy)
    - shortSummary: string (Max 120 chars, extremely concise)
    - updateType: "New Capability" | "Limit Change" | "Workflow Shift" | "Fix / Deprecation"
    - difficultyLevel: number (1-5, based on technical complexity)
    - relevanceScore: number (0-100, how much this user cares)
    - lessonEligible: boolean (true if it introduces a new feature one can learn)
    - source: string (from input sourceId)
    - url: string (from input url)
    - date: string
    
    Sort by relevanceScore descending. Output valid JSON only.
  `,

  LESSON_GENERATION: (updateJson: string, userJson: string) => `
    Act as the "Microlesson Generation Agent".
    
    Update Context: ${updateJson}
    User Context: ${userJson}
    
    Generate a high-quality, specialized micro-lesson.
    
    IMPORTANT: Provide a "visualConcept". This is a prompt used to generate a 3D abstract header image for the lesson.
    The concept should be abstract, futuristic, and metaphorically related to the update.
    Example: "A golden key forming from digital dust, cinematic lighting, 8k, dark background" for a security update.
    
    Return a single JSON object (MicroLesson). Output valid JSON only.
    Structure:
    {
      "id": "string",
      "updateId": "string",
      "title": "string",
      "duration": "string",
      "whyItMatters": "string",
      "whatChanged": "string",
      "steps": ["string"],
      "mentalModel": "string",
      "practiceTask": "string",
      "visualConcept": "string"
    }
  `,

  TOOL_DISCOVERY: (userJson: string, currentDate: string) => `
    Act as the "Real-Time Tool Discovery Engine" (similar to 'There's an AI for That').
    
    User Context: ${userJson}
    Current Snapshot: ${currentDate}
    
    Your goal is to identify the absolute latest and most impactful AI tools.
    
    SEARCH STRATEGY (Execute these searches via Google Search):
    1. "New AI tools launched ${currentDate}"
    2. "Trending AI Github repositories last 24 hours"
    3. "Top trending tools on Vercel AI SDK / Product Hunt this week"
    4. "Underrated AI tools for [User Role] ${currentDate}"
    
    CRITERIA:
    - Focus on "breaking" tools or major updates released in the last 48 hours to 1 month.
    - Include Full-Stack builders (Bolt.new, Lovable), Reasoning models (DeepSeek R1 apps), and niche productivity tools.
    
    Return a JSON array of "ToolSuggestion" objects (**Generate 20 items**).
    IMPORTANT: Wrap output in \`\`\`json code blocks.
    
    Structure:
    [
      {
        "id": "string",
        "name": "string",
        "category": "string",
        "collection": "Major" | "New" | "Underrated",
        "description": "string",
        "useCases": ["string"],
        "bestFor": ["string"],
        "matchScore": number,
        "learningCurve": "Low" | "Medium" | "High",
        "deltaAnalysis": "string",
        "trending": boolean,
        "url": "string"
      }
    ]
  `,

  TOOL_LESSON_GENERATION: (toolJson: string, userJson: string) => `
    Act as the "Tool Tutor Agent".
    Tool Context: ${toolJson}
    User Context: ${userJson}

    Generate a MicroLesson to help this user get started with this tool immediately.
    
    IMPORTANT: Provide a "visualConcept". This is a prompt used to generate a 3D abstract header image for the lesson.
    
    Return JSON (MicroLesson structure). Output valid JSON only.
    Structure:
    {
      "id": "string",
      "updateId": "string",
      "title": "string",
      "duration": "string",
      "whyItMatters": "string",
      "whatChanged": "string",
      "steps": ["string"],
      "mentalModel": "string",
      "practiceTask": "string",
      "visualConcept": "string"
    }
  `,

  LIFE_HACK: (userJson: string, updatesJson: string) => `
    Act as the "Daily Integration Agent".
    User: ${userJson}
    Recent Updates/Tools: ${updatesJson}

    Select the SINGLE most impactful update or tool from the list and create a "Daily Life Hack" for this specific user.
    It should be a non-technical, lifestyle-oriented tip.
    
    Return valid JSON (DailyLifeHack). Wrap in \`\`\`json blocks.
    Structure:
    {
      "id": "string",
      "title": "string",
      "toolName": "string",
      "context": "string",
      "action": "string",
      "impact": "string"
    }
  `,

  MODEL_GUIDE: (modelName: string, currentDate: string) => `
    Act as the "Master Guide Agent".
    Model: ${modelName}
    Date: ${currentDate}

    Create a "Cheat Sheet" or Master Guide for this specific AI model.
    Use Google Search to find the latest capabilities, hidden features, and best prompting strategies as of today.

    Return valid JSON (ModelGuide). Wrap in \`\`\`json blocks.
    Structure:
    {
      "id": "string",
      "modelName": "string",
      "tagline": "string",
      "bestUseCases": ["string"],
      "hiddenFeatures": ["string"],
      "promptTemplates": ["string"],
      "weaknesses": "string",
      "updatedAt": "string",
      "visualConcept": "string"
    }
  `,

  CHAT_SYSTEM: (userJson: string) => `
    Act as "Delta", a personalized AI Intelligence Consultant.
    
    User Profile: ${userJson}
    
    Mission:
    - You are not just a chatbot; you are a proactive guide to the AI ecosystem.
    - Your goal is to help this specific user (based on their role and goals) navigate recent AI updates and tools.
    - When asked about tools, recommend ones that fit their 'UserRole' and 'UserGoal'.
    - When asked about news, summarize it in a way that highlights the impact on their specific job.
    - Adjust your technical depth based on their 'AIFamiliarity' (Beginner vs Advanced).
    - Be concise, professional, and forward-looking.
    
    Style:
    - Cyber-futuristic but clean and accessible.
    - Use formatting (bullet points) for readability.
  `
};