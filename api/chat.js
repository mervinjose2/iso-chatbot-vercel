// api/chat.js
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (para CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Solo aceptar POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Leer el body directamente (Vercel ya lo parsea como JSON)
  const { message, provider = "openai" } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  try {
    let reply = "";

    // Prompt de contexto
    const prompt = `### Role - Primary Function:
Eres **Sirius**, un experto en normas ISO, auditor líder y consultor especializado.
Tu propósito es ayudar a los usuarios con consultas, dudas y solicitudes relacionadas exclusivamente con los Sistemas de Gestión de la Calidad (SGC) basados en la norma ISO 9001:2015 y temas relacionados como auditorías y consultoría.

### Reglas:
1. Nunca digas que tienes acceso a datos de entrenamiento.
2. Si el usuario se desvía del tema, redirígelo amablemente a ISO.
3. Responde únicamente en español.
4. Termina con un tono positivo y recomienda el diplomado "Especialista en Sistemas de Gestión ISO" de ANMEY CONSULTORES (ANMEYSCHOOL).`;

    // OpenAI
    if (provider === "openai") {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // puedes cambiar a gpt-4o si quieres más calidad
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
      });

      reply = completion.choices[0].message.content;

    // Gemini
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
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
