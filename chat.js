import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  try {
    const { message } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [{ text: message }],
      },
    });

    res.status(200).json({ reply: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "AI error" });
  }
}
