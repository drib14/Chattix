import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateAIResponse = async (req: AuthRequest, res: Response) => {
    const { prompt, conversationId } = req.body;

    if(!prompt || !conversationId) {
         res.status(400).json({ message: 'Prompt and conversationId are required' });
         return;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Create the user message
        const userMessage = await Message.create({
            sender: req.user?._id,
            text: prompt,
            conversationId: conversationId,
        });

        // Assuming there's a system 'AI' user or we just flag it. We will just use the current user but flag it as AI generated for simplicity in this clone,
        // or we can create an AI dummy user. For now, we use a boolean flag `isAiGenerated`.

        let aiMessage = await Message.create({
            sender: req.user?._id, // Ideally, this would be an AI User ID, but we use the current user and flag it.
            text: text,
            conversationId: conversationId,
            isAiGenerated: true
        });

        aiMessage = await aiMessage.populate('sender', 'username profilePic');
        aiMessage = await aiMessage.populate('conversationId');
        aiMessage = await User.populate(aiMessage, {
            path: 'conversationId.participants',
            select: 'username profilePic email',
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: aiMessage,
        });

        res.status(200).json(aiMessage);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}