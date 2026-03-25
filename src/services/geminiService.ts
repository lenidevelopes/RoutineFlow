/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Routine } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const routineSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the routine (e.g., Morning Routine)" },
    type: { type: Type.STRING, enum: ["morning", "school", "evening", "custom"] },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          mode: { type: Type.STRING, enum: ["fixed", "duration"] },
          start_time: { type: Type.STRING, description: "12h format: HH:MM AM/PM (e.g., 07:00 AM)" },
          end_time: { type: Type.STRING, description: "12h format: HH:MM AM/PM (e.g., 07:30 AM)" },
          duration_minutes: { type: Type.NUMBER },
        },
        required: ["title", "mode", "duration_minutes"]
      }
    }
  },
  required: ["name", "type", "tasks"]
};

export async function generateRoutine(userInput: string): Promise<Partial<Routine>> {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert productivity coach. Create a structured routine based on this input: "${userInput}".
    
    RULES:
    - Use ONLY 12-hour format for times (e.g., 07:00 AM, 06:30 PM).
    - Each task must have a 'mode': 'fixed' (if a specific time is mentioned) or 'duration' (if only duration is mentioned).
    - If no specific time is mentioned, use 'duration' and the system will sequence them.
    - Default durations if not specified: Quick tasks (10-15m), Study (45-60m), Workout (30-60m), Meals (20-30m).
    - Ensure start_time < end_time for fixed tasks.
    - Return a clean, logical sequence.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: routineSchema,
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate routine");
  }

  return JSON.parse(response.text);
}

export async function getWeeklyFeedback(stats: any): Promise<string> {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze the following weekly productivity stats and provide intelligent, actionable feedback: ${JSON.stringify(stats)}.
  Rules:
  - Keep it short (2-4 lines).
  - No generic quotes.
  - Be direct, specific, and actionable.
  - Detect failure patterns and suggest fixes.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || "Keep up the good work!";
}
