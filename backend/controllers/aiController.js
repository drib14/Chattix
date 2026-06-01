import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateAIResponse = async (req, res) => {
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

        let aiMessage = await Message.create({
            sender: req.user?._id,
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

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
