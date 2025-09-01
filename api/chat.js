// api/chat.js
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Añadir cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Manejar solicitudes OPTIONS (preflight requests)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { message, provider = "openai" } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  try {
    let reply = "";

    if (provider === "openai") {
      // Cliente OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // puedes cambiar a gpt-4o o gpt-3.5
        messages: [
          { role: "system", content: "Eres un experto en normas ISO y solo hablas de ese tema." },
          { role: "user", content: message },
        ],
      });

      reply = completion.choices[0].message.content;

    } else if (provider === "gemini") {
      // Cliente Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        { role: "user", parts: [{ text: message }] }
      ]);

      reply = result.response.text();
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
