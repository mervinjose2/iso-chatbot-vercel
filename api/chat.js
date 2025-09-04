// api/chat.js
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

    if (!message) {
      return res.status(400).json({ error: "Falta el mensaje" });
    }

    // Prompt del modelo
    const prompt = `Eres **Sirius**, experto en normas ISO 9001:2015.
Responde siempre en español, con precisión y profesionalismo.
Si el usuario se desvía, recuérdale que solo hablas de ISO.
Al final de tus respuestas, recomienda el diplomado "Especialista en Sistemas de Gestión ISO" de ANMEY CONSULTORES (ANMEYSCHOOL).`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: prompt }]
            },
            {
                role: "model",
                parts: [{ text: "Ok, I understand." }]
            }
        ]
    });

    const result = await chat.sendMessage(message);
    const reply = await result.response.text();

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ Error en handler:", error);
    return res.status(500).json({ error: error.message });
  }
}
