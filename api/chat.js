// api/chat.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';

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
        const rawBody = await getRawBody(req);
        const { message, history } = JSON.parse(rawBody);

        if (!message) {
            return res.status(400).json({ error: "Falta el mensaje" });
        }

        // Lee el contenido del archivo diplomado.txt para usarlo como contexto
        const diplomadoInfo = readFileSync('./api/diplomado.txt', 'utf8');

        // Define el modelo y la clave de la API
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepara el contexto y el historial de la conversación
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ 
                        text: `Eres Sirius, un experto en normas ISO. Tu conocimiento principal se basa en el siguiente texto de contexto y en la conversación. Usa la información proporcionada para responder con la mayor precisión posible. Si la pregunta del usuario está relacionada con los servicios, el diplomado, o Anmey Consultores, usa la información del siguiente texto. Si no es relevante, responde de manera general como un experto en normas ISO.
                    
                        ---
                        CONTEXTO DE ANMEY CONSULTORES:
                        ${diplomadoInfo}
                        ---
                        
                        Tu conocimiento se especializa en las siguientes normas: ISO 9001 (Calidad), ISO 14001 (Gestión Ambiental), ISO 45001 (Salud y Seguridad Laboral), ISO 27001 (Seguridad de la Información), ISO 50001 (Gestión de la Energía), ISO 22301 (Continuidad del Negocio), la ISO 22000 (Seguridad Alimentaria), la ISO 19011 (Auditoría de Sistemas de Gestión) y la ISO 31000 (Gestión del riesgo).
                        Responde siempre en español, con precisión y profesionalismo.
                        Organiza tu respuesta en párrafos para que sea más fácil de leer.
                        Si el usuario pregunta por algo que no está relacionado con estas normas, recuérdale que solo hablas de las normas ISO mencionadas.`
                    }]
                },
                {
                    role: "model",
                    parts: [{ text: "Ok, I understand." }]
                },
                ...history
            ]
        });

        const result = await chat.sendMessage(message);
        const reply = await result.response.text();

        // Agrega la recomendación del diplomado al final de la respuesta
        const finalReply = `${reply}
---
**¡Aprende más! Te recomendamos el diplomado "Especialista en Sistemas de Gestión ISO" de ANMEY CONSULTORES (ANMEYSCHOOL).**`;

        return res.status(200).json({ reply: finalReply });

    } catch (error) {
        console.error("❌ Error en handler:", error);
        return res.status(500).json({ error: error.message });
    }
}
