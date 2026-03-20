import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, VocabularyWord, QuizQuestion } from '../types';

const API_KEY = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  public async generateVocabulary(scenario: string, nativeLanguage: string, history: Message[] = []): Promise<VocabularyWord[]> {
    try {
      const conversationContext = history.length > 0 
        ? `\n\n**CONVERSATION CONTEXT:**\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}`
        : '';

      const response = await this.ai.models.generateContent({
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
      console.error("Vocabulary generation error:", error);
      throw new Error(`Failed to generate vocabulary: ${error.message}`);
    }
  }

  public async generateQuiz(words: VocabularyWord[], nativeLanguage: string): Promise<QuizQuestion[]> {
    try {
      const wordsText = words.map(w => `${w.word}: ${w.definition}`).join('\n');
      const response = await this.ai.models.generateContent({
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
      console.error("Quiz generation error:", error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
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
      const geminiHistory = history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      this.chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
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
        message: `I am ready to start. My native language is ${nativeLanguage}. Please start the scenario: ${scenario}. Remember to provide translations for EVERYTHING you say.`
      });
      
      return response.text || "Hello! I'm ready to help you practice.";
    } catch (error: any) {
      console.error("Failed to initialize chat:", error);
      let errorMessage = "Failed to start session. Please check your connection.";
      
      if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key not valid')) {
        errorMessage = "Invalid API Key. Please check your configuration.";
      } else if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMessage = "Rate limit exceeded. Please wait a moment.";
      } else if (error?.message) {
        errorMessage = `Initialization Error: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  public async sendMessageStream(text: string, onChunk: (text: string) => void): Promise<string> {
    if (!this.chat) {
      throw new Error("Chat not initialized");
    }

    try {
      // Using standard sendMessage instead of stream to prevent "Ambiguous request" 404 errors
      // that can occur with StreamGenerateContent on specific model versions/environments.
      const result = await this.chat.sendMessage({ message: text });
      const fullText = result.text || '';
      
      // Simulate streaming behavior for the UI
      onChunk(fullText);
      
      return fullText;
    } catch (error: any) {
      console.error("Error sending message:", error);
      let errorMessage = "I encountered an error while processing your request.";
      
      if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key not valid')) {
        errorMessage = "Invalid API Key. Please check your configuration.";
      } else if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMessage = "Rate limit exceeded. Please wait a moment before sending another message.";
      } else if (error?.message?.includes('safety')) {
        errorMessage = "The message was flagged by safety filters. Please try rephrasing.";
      } else if (error?.message) {
        errorMessage = `Service Error: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  public async generateSummary(history: Message[], nativeLanguage: string): Promise<string> {
    try {
      const conversationText = history
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`)
        .join('\n\n');

      const response = await this.ai.models.generateContent({
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
        }
      });
      return response.text || "I couldn't generate a summary at this time.";
    } catch (error: any) {
      console.error("Summary generation error:", error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }
}

export const geminiService = new GeminiService();
