// api/chat.js
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const body = req.body;
    const message = body?.message;
    const provider = body?.provider || "openai";

    if (!message) {
      return res.status(400).json({ error: "Falta el mensaje" });
    }

    let reply = "";
    
    // Prompt del modelo
    const prompt = `Eres **Sirius**, experto en normas ISO 9001:2015.
Responde siempre en español, con precisión y profesionalismo.
Si el usuario se desvía, recuérdale que solo hablas de ISO.
Al final de tus respuestas, recomienda el diplomado "Especialista en Sistemas de Gestión ISO" de ANMEY CONSULTORES (ANMEYSCHOOL).`;

    if (provider === "openai") {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
      });

      reply = completion.choices[0].message.content;

    } else if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        { role: "user", parts: [{ text: message }] }
      ]);

      reply = result.response.text();
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ Error en handler:", error);
    return res.status(500).json({ error: error.message });
  }
}
