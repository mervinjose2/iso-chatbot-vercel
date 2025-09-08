import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';

// Carga la clave de la API desde las variables de entorno de Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { message, history } = JSON.parse(req.body);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Lee el contenido del archivo diplomado.txt para usarlo como contexto
    const diplomadoInfo = readFileSync('./api/diplomado.txt', 'utf8');

    // Define el modelo a utilizar
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepara el contexto y el historial de la conversación
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: `Eres Sirius, un experto en normas ISO. Tu conocimiento principal se basa en el siguiente texto de contexto y en la conversación. Usa la información proporcionada para responder con la mayor precisión posible. Si la pregunta del usuario está relacionada con los servicios, el diplomado, o Anmey Consultores, usa la información del siguiente texto. Si no es relevante, responde de manera general como un experto en normas ISO.
                
                ---
                CONTEXTO:
                ${diplomadoInfo}
                ---`
            },
            ...history
        ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Devuelve la respuesta del modelo
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error al comunicarse con la API de Gemini:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado al procesar la solicitud.' });
  }
}
