import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, dangerouslyAllowBrowser: true }) : null;

export interface AIResponse {
  feedback: string;
  hints: string[];
  isCorrect: boolean;
  stage: 'understanding' | 'reasoning' | 'coding' | 'review';
  visualizationData?: any;
  simulationSteps?: any[];
  isQuotaExceeded?: boolean;
  roadmap?: {
    steps: {
      title: string;
      description: string;
      visualState: any;
    }[];
    currentStepIndex: number;
  };
  mistakes?: string[];
  complexity?: { time: string; space: string };
  patternInfo?: {
    name: string;
    description: string;
    relatedProblems: string[];
  };
}

export async function getDSAGuidance(
  problem: any,
  userCode: string,
  lastAction: string,
  currentStage: string,
  chatHistory: { role: 'user' | 'ai', content: string }[],
  testData: any
): Promise<AIResponse> {
  // 1. Try Groq FIRST if available
  if (groq) {
    try {
      console.log("Using Groq as primary provider...");
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are "DSA Buddy", a proactive and highly interactive expert mentor. 
            Use ONLY ASCII art/diagrams in your 'feedback' to explain concepts.
            DO NOT generate 'roadmap' or 'simulationSteps'. Focus on raw intuition.
            Return ONLY a JSON object matching this schema:
            {
              "feedback": "string (include ASCII art diagram)",
              "hints": ["string"],
              "isCorrect": boolean,
              "stage": "understanding" | "reasoning" | "coding" | "review",
              "visualizationData": object,
              "patternInfo": { "name": "string", "description": "string", "relatedProblems": ["string"] },
              "mistakes": ["string"],
              "complexity": { "time": "string", "space": "string" }
            }`
          },
          {
            role: "user",
            content: `Problem: ${problem.title}. Code: ${userCode}. Action: ${lastAction}. Stage: ${currentStage}. Test Data: ${JSON.stringify(testData)}.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (groqError) {
      console.error("Groq API Error:", groqError);
      // If Groq fails, we'll fall through to Gemini
    }
  }

  // 2. Fallback to Gemini if Groq is not available or failed
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are "DSA Buddy", a proactive and highly interactive expert mentor. 
              The user is working on: "${problem.title}".
              
              CRITICAL: You are watching the user type in REAL-TIME. 
              Use ONLY ASCII art/diagrams in your 'feedback' to explain concepts.
              DO NOT generate 'roadmap' or 'simulationSteps'. Focus on raw intuition.
              
              TEST DATA: ${JSON.stringify(testData)}
              
              GUIDELINES:
              1. ASCII INTUITION: Your feedback MUST include a small ASCII diagram explaining the current state or logic.
              2. BE PROACTIVE: Comment on their current code every time.
              3. INTUITION FIRST: Explain WHY a choice is good or bad.
              4. TRACE: In 'visualizationData', include a 'trace' object with current variable values.
              5. PATTERN: Provide 'patternInfo' with the core pattern name.
              
              Return JSON with:
              - feedback: 1-2 sentence nudge + ASCII diagram.
              - hints: 3-5 progressive hints.
              - isCorrect: boolean.
              - stage: current stage.
              - visualizationData: current state for ASCII visualizer.
              - patternInfo: { name, description, relatedProblems }.
              - mistakes: array of strings.
              - complexity: { time, space }.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            hints: { type: Type.ARRAY, items: { type: Type.STRING } },
            isCorrect: { type: Type.BOOLEAN },
            stage: { type: Type.STRING, enum: ['understanding', 'reasoning', 'coding', 'review'] },
            visualizationData: { type: Type.OBJECT },
            mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            complexity: { 
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                space: { type: Type.STRING }
              }
            }
          },
          required: ["feedback", "hints", "isCorrect", "stage"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    
    // Improved quota error detection
    const errorStr = JSON.stringify(e);
    const isQuotaError = 
      errorStr.includes("quota") || 
      errorStr.includes("429") || 
      e?.message?.includes("quota") || 
      e?.message?.includes("429") ||
      e?.status === "RESOURCE_EXHAUSTED" ||
      e?.error?.status === "RESOURCE_EXHAUSTED" ||
      e?.error?.code === 429;

    const staticRoadmaps: Record<string, any> = {
      "Two Sum": {
        steps: [
          {
            title: "1. The Complement Concept",
            description: "For every number 'x', we are looking for 'y' such that x + y = target. This means y = target - x.",
            visualState: { items: [2, 7, 11, 15], target: 9, activeIndex: 0, complement: 7 }
          },
          {
            title: "2. Memory for Speed",
            description: "Instead of nested loops (O(n²)), we use a Hash Map to remember numbers we've already seen.",
            visualState: { items: [2, 7, 11, 15], target: 9, activeIndex: 1, map: { "2": 0 } }
          },
          {
            title: "3. The Instant Match",
            description: "When we reach 7, we check if its complement (2) is in our map. It is! We return [0, 1].",
            visualState: { items: [2, 7, 11, 15], target: 9, activeIndex: 1, found: [0, 1] }
          }
        ],
        currentStepIndex: 0
      },
      "Contains Duplicate": {
        steps: [
          {
            title: "1. Tracking Uniqueness",
            description: "We need a way to track numbers we've seen. A Hash Set is perfect for O(1) lookups.",
            visualState: { items: [1, 2, 3, 1], activeIndex: 0, set: [] }
          },
          {
            title: "2. Building the Set",
            description: "As we iterate, we add each number to the set if it's not already there.",
            visualState: { items: [1, 2, 3, 1], activeIndex: 2, set: [1, 2, 3] }
          },
          {
            title: "3. Detecting the Duplicate",
            description: "When we see '1' again, we check the set. It's already there! Return true.",
            visualState: { items: [1, 2, 3, 1], activeIndex: 3, duplicateFound: 1 }
          }
        ],
        currentStepIndex: 0
      },
      "Valid Anagram": {
        steps: [
          {
            title: "1. Length Check",
            description: "If the strings have different lengths, they can't be anagrams. Immediate exit.",
            visualState: { s: "anagram", t: "nagaram", lengthMatch: true }
          },
          {
            title: "2. Frequency Counting",
            description: "Count the occurrences of each character in string 's' using a Hash Map.",
            visualState: { map: { a: 3, n: 1, g: 1, r: 1, m: 1 } }
          },
          {
            title: "3. Verification",
            description: "Decrement counts using string 't'. If all counts hit zero, it's a valid anagram.",
            visualState: { map: { a: 0, n: 0, g: 0, r: 0, m: 0 }, isValid: true }
          }
        ],
        currentStepIndex: 0
      }
    };

    const fallbackResponse: AIResponse = {
      feedback: isQuotaError 
        ? "I've hit my thinking limit (Quota Exceeded), but I've activated the 'Static Blueprint Mode' for you. Follow these steps!" 
        : "I'm having connection issues, but I've loaded a pre-built strategy for this problem.",
      hints: [
        "Use a Hash Map or Set to optimize lookups to O(1).",
        "Think about what information you need to store as you iterate.",
        "Consider if sorting the input would help simplify the logic."
      ],
      isCorrect: false,
      isQuotaExceeded: isQuotaError,
      stage: currentStage as any || 'understanding',
      roadmap: staticRoadmaps[problem.title] || {
        steps: [
          {
            title: "Step 1: Analyze Input",
            description: "Look at the constraints and identify the core data structure needed.",
            visualState: { items: [1, 2, 3], stage: 'analysis' }
          },
          {
            title: "Step 2: Define Logic",
            description: "Plan your traversal and how you will handle each element.",
            visualState: { items: [1, 2, 3], stage: 'logic' }
          }
        ],
        currentStepIndex: 0
      }
    };

    return fallbackResponse;
  }
}
