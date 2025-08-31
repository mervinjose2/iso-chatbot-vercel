import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { messages = [], provider = "openai" } = body;

    const last = messages[messages.length - 1]?.content || "";

    // Filtro: solo ISO
    if (!/iso|9001|14001|45001/i.test(last)) {
      return res.json({ text: "⚠️ Solo respondo sobre normas ISO." });
    }

    const SYSTEM_PROMPT = `Eres un asistente especializado en normas ISO. Responde solo sobre ISO.`;

    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: `${SYSTEM_PROMPT}\n\n${last}`
      });
      return res.json({ text: resp.output_text });
    }

    if (provider === "gemini") {
      const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genai.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
      });
      const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${last}`);
      return res.json({ text: result.response.text() });
    }

    return res.status(400).json({ error: "Proveedor no soportado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error generando respuesta" });
  }
}
