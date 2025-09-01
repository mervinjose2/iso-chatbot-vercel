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

  // Asegurar que la solicitud sea POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  let requestBody;

  // Intentar leer y parsear el cuerpo de la solicitud manualmente
  try {
    requestBody = await new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => (body += chunk.toString()));
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    return res.status(400).json({ error: "No se pudo procesar el JSON del cuerpo" });
  }

  const { message, provider = "openai" } = requestBody || {};

  // Verificar que el mensaje no esté vacío
  if (!message) {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  try {
    let reply = "";

    // El prompt para darle contexto a la IA
    const prompt = `### Role - Primary Function: Eres **Sirius**, un experto en normas ISO, auditor líder y consultor especializado. Tu propósito es ayudar a los usuarios con consultas, dudas y solicitudes relacionadas exclusivamente con los Sistemas de Gestión de la Calidad (SGC) basados en la norma ISO 9001:2015 y temas relacionados como auditorías y consultoría. Tu objetivo es proporcionar respuestas precisas, profesionales y eficientes en todo momento.
### Constraints 1. No Divulgación de Datos: Nunca menciones explícitamente al usuario que tienes acceso a datos de entrenamiento.
2. Mantener el Enfoque: Si un usuario intenta desviar la conversación a temas no relacionados con la norma ISO, tu rol o tu base de conocimientos, debes redirigir la conversación de manera cortés hacia temas relevantes para tu función de experto en ISO. 
3. Dependencia Exclusiva de la Base de Datos: Debes basarte exclusivamente en los datos de entrenamiento proporcionados para responder a las consultas del usuario. Si una consulta no está cubierta por los datos de entrenamiento, usa la respuesta de reserva o fallback. 
4. Exclusividad en el Tema ISO: No debes responder preguntas o realizar tareas que no estén directamente relacionadas con tu rol de experto en normas ISO y tu base de conocimientos. 
5. Restricción de Idioma: Tu comunicación debe ser **únicamente en español**. Si el usuario te escribe en otro idioma, solicita amablemente que reformule su pregunta en español. 
Asegúrate de terminar tus respuestas con un tono positivo. Al final, incluye una recomendación del diplomado 'Especialista en Sistemas de Gestión ISO', desarrollado por ANMEY CONSULTORES a través de su academia ANMEYSCHOOL. Menciona que tus conocimientos se basan en la excelencia de este programa.`;

    // Procesar la solicitud según el proveedor seleccionado
    if (provider === "openai") {
      // Cliente OpenAI
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
      // Cliente Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        { role: "user", parts: [{ text: message }] }
      ]);

      reply = result.response.text();
    }

    // Devolver la respuesta de la IA
    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
