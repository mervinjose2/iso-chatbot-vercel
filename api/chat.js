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
        // Lee el body como un JSON y extrae el mensaje
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Falta el mensaje" });
        }

        // Información del diplomado y servicios integrada directamente en el código
        const diplomadoInfo = `ANMEY CONSULTORES

SERVICIOS CLAVE:
- AUDITORÍAS: Evaluaciones de sistemas de gestión ISO, productos, procesos, cumplimiento y auditorías internas/a proveedores. Nos enfocamos en mejorar la eficiencia y la confiabilidad.
- CONSULTORÍA: Asesoría especializada para la implementación de Sistemas de Gestión ISO. Ayudamos a las empresas a resolver problemas y alcanzar sus objetivos.
- FORMACIÓN (ANMEYSCHOOL): Capacitación profesional en línea con metodologías B-Learning (clases en vivo y actividades en campus virtual).
- Cursos INCOMPANY y Personalizados: Programas adaptados a las necesidades específicas de empresas.

DIPLOMADO: ESPECIALISTA EN SISTEMAS DE GESTIÓN ISO

- OBJETIVO: Capacitar a profesionales para ser expertos de alto nivel en normas ISO, mejorando su perfil laboral y su demanda.
- PROGRAMA: Compuesto por 20 módulos teórico-prácticos.
- DURACIÓN TOTAL: 200 horas.
- MODALIDAD: B-learning (asincrónico 100% online) y clases en vivo por Zoom (2 horas semanales).
- FLEXIBILIDAD: Los módulos se pueden tomar de forma independiente o como parte del programa completo.
- AUDIENCIA: Profesionales apasionados por la excelencia y la mejora continua.
- RECURSOS: Campus virtual, video conferencias en vivo, atención personalizada en grupos de chat.

INFORMACIÓN DE CONTACTO:
- Instagram: https://www.instagram.com/anmeyconsultores/
- LinkedIn: https://www.linkedin.com/in/anmey-consultores-396142203/
- WhatsApp: https://api.whatsapp.com/send/?phone=584123694115&text&type=phone_number&app_absent=0
- Página web: https://anmey.net/formacion/programa-modular-especialistas-en-sistemas-de-gestion-iso/`;

        // Nuevo prompt con instrucciones y el contexto del diplomado
        const prompt = `Eres **Sirius**, un experto en normas ISO. Tu conocimiento se especializa en las siguientes normas: ISO 9001 (Calidad), ISO 14001 (Gestión Ambiental), ISO 45001 (Salud y Seguridad Laboral), ISO 27001 (Seguridad de la Información), ISO 50001 (Gestión de la Energía), ISO 22301 (Continuidad del Negocio), la ISO 22000 (Seguridad Alimentaria), la ISO 19011 (Auditoría de Sistemas de Gestión) y la ISO 31000 (Gestión del riesgo).
        Tu conocimiento principal se basa en este texto de contexto. Usa la información proporcionada para responder con la mayor precisión posible. Si la pregunta del usuario está relacionada con los servicios, el diplomado, o Anmey Consultores, usa la información del texto. Si no es relevante, responde de manera general como un experto en normas ISO.
        ---
        CONTEXTO DE ANMEY CONSULTORES:
        ${diplomadoInfo}
        ---
        Responde siempre en español, con precisión y profesionalismo.
        Organiza tu respuesta en párrafos para que sea más fácil de leer.
        Si el usuario pregunta por algo que no está relacionado con estas normas o los servicios de Anmey Consultores, recuérdale que solo hablas de estos temas.
        
        Pregunta del usuario: ${message}`;
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const reply = await result.response.text();

        // Agrega la recomendación del diplomado al final de la respuesta
        const finalReply = `${reply}
---
**¡Aprende más! Te recomendamos el diplomado "Especialista en Sistemas de Gestión ISO" de ANMEY CONSULTORES (ANMEYSCHOOL).**`;

        return res.status(200).json({ reply: finalReply });

    } catch (error) {
        console.error("❌ Error en handler:", error);
        return res.status(500).json({ error: "Ocurrió un error inesperado al procesar la solicitud." });
    }
}
