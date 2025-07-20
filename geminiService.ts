
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Question, Note } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizGenerationModel = 'gemini-2.5-flash';
const chatModel = 'gemini-2.5-flash';
const visionModel = 'gemini-2.5-flash'; // This model has vision capabilities

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "A list of 5 multiple-choice questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: {
                        type: Type.STRING,
                        description: "The question text."
                    },
                    options: {
                        type: Type.ARRAY,
                        description: "An array of 4 possible answers.",
                        items: { type: Type.STRING }
                    },
                    correctAnswerIndex: {
                        type: Type.INTEGER,
                        description: "The 0-based index of the correct answer in the options array."
                    }
                },
                required: ["question", "options", "correctAnswerIndex"]
            }
        }
    },
    required: ["questions"]
};

export const generateQuizFromNotes = async (notes: Note[]): Promise<Question[]> => {
    const allNotesContent = notes.map(note => `Note Title: ${note.title}\nContent:\n${note.content}`).join('\n\n---\n\n');
    
    if (allNotesContent.trim().length < 50) {
        throw new Error("Not enough content to generate a quiz. Please add more notes.");
    }
    
    try {
        const response = await ai.models.generateContent({
            model: quizGenerationModel,
            contents: `Based on the following notes, generate a 5-question multiple-choice quiz. The questions should test key concepts from the notes.\n\nCONTEXT:\n${allNotesContent}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            }
        });

        const jsonText = response.text;
        const result = JSON.parse(jsonText);
        
        if (!result.questions || result.questions.length === 0) {
            throw new Error("AI failed to generate quiz questions.");
        }
        
        return result.questions;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz from AI. The content might be too complex or the service is unavailable.");
    }
};

export const getChatResponseStream = async (notes: Note[], chatHistory: { role: 'user' | 'model', text: string }[]) => {
    const allNotesContent = notes.map(note => `Note Title: ${note.title}\nContent:\n${note.content}`).join('\n\n---\n\n');

    const contents = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await ai.models.generateContentStream({
            model: chatModel,
            contents: contents,
            config: {
                 systemInstruction: `You are a helpful study assistant called Note2Brain. Your sole purpose is to answer questions based ONLY on the provided context from the user's notes. Do not use any external knowledge. If the answer cannot be found in the provided notes, clearly state that the information is not available in the notes. Here is the context:\n\n${allNotesContent}`,
            }
        });
        return response;
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw new Error("Failed to get chat response from AI.");
    }
};

export const extractTextFromImage = async (mimeType: string, base64Image: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image,
            },
        };
        const textPart = {
            text: "Extract all text from this image. The text will be used as study notes. Present it in a clean, readable format."
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw new Error("Failed to extract text from image using AI.");
    }
};
