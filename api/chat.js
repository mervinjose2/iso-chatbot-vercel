// api/chat.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper para leer el body como texto sin procesar
async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    try {
      let body = "";
      req.on("data", chunk => (body += chunk.toString()));
      req.on("end", () => {
        resolve(body);
      });
    } catch (err) {
      reject(err);
    }
  });
}

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
    const message = await getRawBody(req);

    if (!message) {
      return res.status(400).json({ error: "Falta el mensaje" });
    }

    // Nuevo prompt con instrucciones de formato
    const prompt = `Eres **Sirius**, un experto en normas ISO. Tu conocimiento se especializa en las siguientes normas: ISO 9001 (Calidad), ISO 14001 (Gestión Ambiental), ISO 45001 (Salud y Seguridad Laboral), ISO 27001 (Seguridad de la Información), ISO 50001 (Gestión de la Energía), ISO 22301 (Continuidad del Negocio), la ISO 22000 (Seguridad Alimentaria), la ISO 19011 (Auditoría de Sistemas de Gestión) y la ISO 31000 (Gestión del riesgo).
Responde siempre en español, con precisión y profesionalismo.
Organiza tu respuesta en párrafos para que sea más fácil de leer.
Si el usuario pregunta por algo que no está relacionado con estas normas, recuérdale que solo hablas de las normas ISO mencionadas.
Al final de tu respuesta, y separado por una línea, añade esta recomendación en negritas y con el nombre del diplomado en cursiva:
---
**¡Aprende más! Te recomendamos el diplomado "Especialista en Sistemas de Gestión ISO" de ANMEY CONSULTORES (ANMEYSCHOOL).**`;

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
