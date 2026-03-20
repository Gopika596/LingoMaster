import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, VocabularyWord, QuizQuestion } from '../types';

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    // No longer throwing in the constructor to allow the app to load even if the key is missing.
    // We will check for the key when an API call is made.
  }

  private getAI(): GoogleGenAI {
    if (this.ai) return this.ai;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      throw new Error("API key is missing or invalid. Please add your GEMINI_API_KEY to the Secrets menu (⚙️ Settings -> Secrets).");
    }
    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const ai = this.getAI();
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: 'hi' }] }],
        config: { maxOutputTokens: 1 }
      });
      return true;
    } catch (error) {
      console.error("API Connection test failed:", error);
      return false;
    }
  }

  public async generateVocabulary(scenario: string, nativeLanguage: string, history: Message[] = []): Promise<VocabularyWord[]> {
    try {
      const ai = this.getAI();
      const conversationContext = history.length > 0 
        ? `\n\n**CONVERSATION CONTEXT:**\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}`
        : '';

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `Based on the English conversation scenario: "${scenario}" and the actual conversation below, 
            provide 5 relevant vocabulary words or phrases that the learner encountered or should master for this context.
            ${conversationContext}
            
            For each word, provide its definition in English, its translation in ${nativeLanguage}, 
            and a natural example sentence in English.
            Return the result as a JSON array of objects.` }
          ]
        },
        config: {
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                definition: { type: Type.STRING },
                translation: { type: Type.STRING },
                example: { type: Type.STRING }
              },
              required: ['word', 'definition', 'translation', 'example']
            }
          }
        }
      });

      const words = JSON.parse(response.text || '[]');
      return words.map((w: any, index: number) => ({
        ...w,
        id: `word-${Date.now()}-${index}`,
        mastery: 0
      }));
    } catch (error: any) {
      throw this.handleError(error, "Vocabulary Generation");
    }
  }

  public async generateQuiz(words: VocabularyWord[], nativeLanguage: string): Promise<QuizQuestion[]> {
    try {
      const ai = this.getAI();
      const wordsText = words.map(w => `${w.word}: ${w.definition}`).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `Create a 5-question English vocabulary quiz based on these words:
            ${wordsText}
            
            Each question should be either 'multiple-choice' or 'fill-in-the-blank'.
            For multiple-choice, provide 4 options.
            For fill-in-the-blank, provide the sentence with a blank (___) and the correct word.
            Provide a brief explanation in ${nativeLanguage} for each answer.
            Return the result as a JSON array of objects.` }
          ]
        },
        config: {
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['multiple-choice', 'fill-in-the-blank'] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                word: { type: Type.STRING, description: "The word from the list this question is testing" }
              },
              required: ['type', 'question', 'correctAnswer', 'explanation', 'word']
            }
          }
        }
      });

      const questions = JSON.parse(response.text || '[]');
      return questions.map((q: any, index: number) => {
        const wordId = words.find(w => w.word.toLowerCase() === q.word.toLowerCase())?.id || '';
        return {
          ...q,
          id: `quiz-${Date.now()}-${index}`,
          wordId
        };
      });
    } catch (error: any) {
      throw this.handleError(error, "Quiz Generation");
    }
  }

  private getSystemInstruction(nativeLanguage: string, scenario: string): string {
    return `
**SYSTEM INSTRUCTION:** You are 'LingoMaster', a specialized, bilingual English Language Tutor.

**YOUR GOAL:** Help the user (a non-native speaker) practice conversational English in a specific scenario.
**CORE BEHAVIOR:** You must act as the **roleplay partner** (e.g., the Interviewer, the Waiter, the Doctor).

**CRITICAL SETTINGS:**
- **User's Native Language (L1):** ${nativeLanguage}
- **Scenario:** ${scenario}

**MANDATORY RULES FOR EVERY RESPONSE:**
1.  **Bilingual Output:** You must provide **EVERY** response in this exact format:
    *   **English:** [The roleplay response in English]
    *   **${nativeLanguage} Translation:** [The exact translation of the above English text]
    *   **Feedback:** [Only if user made a mistake, provide correction here in ${nativeLanguage}]

2.  **Translation Quality:** Prioritize **nuanced and contextually accurate translations**, especially for advanced vocabulary, idioms, or industry-specific terms. Avoid literal translations if they lose the original English meaning or tone. The translation should reflect how a native speaker of ${nativeLanguage} would naturally express the same sentiment in that specific context.

3.  **Roleplay Logic:**
    *   Stay in character.
    *   Keep the English simple and clear (B1/B2 level).
    *   Do NOT be the "teacher" in the main text. Be the character (e.g., "Here is your menu."). The "teacher" part only happens in the "Feedback" section.

4.  **Correction Protocol:**
    *   If the user makes a grammar mistake, do NOT stop the roleplay.
    *   Add a specific section at the bottom: "**Correction:** [Show the better phrase] explanation in ${nativeLanguage}."

5.  **First Message Protocol:**
    *   **Step 1:** Greet the user warmly in **${nativeLanguage}**.
    *   **Step 2:** Explain the chosen scenario (${scenario}) and the roleplay context clearly in **${nativeLanguage}**.
    *   **Step 3:** Begin the actual roleplay with your first line in **English**.
    *   **Step 4:** Provide the **${nativeLanguage} translation** for that first English line.

**EXAMPLE OUTPUT:**
"**English:** Hello, welcome to our company. May I have your resume?
**${nativeLanguage} Translation:** こんにちは、当社へようこそ。履歴書をいただけますか？"
`;
  }

  public async initializeChat(nativeLanguage: string, scenario: string, history: Message[] = []): Promise<string> {
    try {
      const ai = this.getAI();
      const geminiHistory = history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      this.chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: this.getSystemInstruction(nativeLanguage, scenario),
        },
        history: geminiHistory
      });

      // If we have history, we don't need to trigger the first message
      if (history.length > 0) {
        return history[history.length - 1].text;
      }

      // We trigger the first message to start the roleplay based on the instruction
      const response = await this.chat.sendMessage({
        message: `I am ready to start. My native language is ${nativeLanguage}. Please start the scenario: ${scenario}. Remember to provide translations for EVERYTHING you say.`,
        config: { maxOutputTokens: 2048 }
      });
      
      return response.text || "Hello! I'm ready to help you practice.";
    } catch (error: any) {
      throw this.handleError(error, "Chat Initialization");
    }
  }

  private handleError(error: any, context: string): Error {
    console.error(`${context} error:`, error);
    let errorMessage = `I encountered an error during ${context}.`;
    
    const msg = error?.message?.toLowerCase() || "";
    
    if (msg.includes('api_key_invalid') || msg.includes('api key not valid') || msg.includes('invalid api key')) {
      errorMessage = "Invalid API Key. Please check your configuration in Settings -> Secrets.";
    } else if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      errorMessage = "Rate limit exceeded or quota reached. Please wait a moment before trying again.";
    } else if (msg.includes('safety')) {
      errorMessage = "The content was flagged by safety filters. Please try rephrasing your request.";
    } else if (msg.includes('max tokens') || msg.includes('exceeded max tokens')) {
      errorMessage = "The response was too long for the current limit. I've adjusted the settings, please try again.";
    } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      errorMessage = "Network error. Please check your internet connection and try again.";
    } else if (error?.message) {
      errorMessage = `${context} Error: ${error.message}`;
    }
    
    return new Error(errorMessage);
  }

  public async sendMessageStream(text: string, onChunk: (text: string) => void): Promise<string> {
    if (!this.chat) {
      throw new Error("Chat not initialized");
    }

    try {
      // Using standard sendMessage instead of stream to prevent "Ambiguous request" 404 errors
      // that can occur with StreamGenerateContent on specific model versions/environments.
      const result = await this.chat.sendMessage({ 
        message: text,
        config: { maxOutputTokens: 2048 }
      });
      const fullText = result.text || '';
      
      // Simulate streaming behavior for the UI
      onChunk(fullText);
      
      return fullText;
    } catch (error: any) {
      throw this.handleError(error, "Message Sending");
    }
  }

  public async generateSummary(history: Message[], nativeLanguage: string): Promise<string> {
    try {
      const ai = this.getAI();
      const conversationText = history
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `You are an expert English Language Tutor. 
            Please provide a concise summary of the following conversation between a student and a tutor.
            
            **CONVERSATION:**
            ${conversationText}
            
            **YOUR TASK:**
            1. Summarize the main dialogue and scenario.
            2. Highlight 3-5 key vocabulary words or phrases learned, with their meanings in ${nativeLanguage}.
            3. List 2-3 key grammar or conversational learning points.
            4. Provide a brief encouraging closing statement in ${nativeLanguage}.
            
            Format the output using clear Markdown headers and bullet points.` }
          ]
        },
        config: { maxOutputTokens: 2048 }
      });
      return response.text || "I couldn't generate a summary at this time.";
    } catch (error: any) {
      throw this.handleError(error, "Summary Generation");
    }
  }
}

export const geminiService = new GeminiService();
