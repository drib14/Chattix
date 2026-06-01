import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Utility to clean markdown JSON wrappers from Gemini responses
 */
const cleanJSONString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
};

// @desc    Summarize recent unread or long chat thread
// @route   POST /api/ai/summarize
// @access  Private
export const summarizeChat = async (req, res) => {
  const { conversationId } = req.body;

  try {
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    // Verify user is in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get last 50 messages
    const messages = await Message.find({ conversationId, isDeleted: false })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        summary: 'No messages to summarize in this conversation yet.',
      });
    }

    // Format chat transcript (chronological order)
    const transcript = messages
      .reverse()
      .map((msg) => `${msg.sender.username}: ${msg.content}`)
      .join('\n');

    const prompt = `
You are an expert AI productivity assistant. Review this chat log conversation transcript and provide a highly engaging, premium, and concise summary.
Format the output professionally using markdown:
- Provide a summary under 80 words.
- List "Key Decisions" (if any) as bullet points.
- List "Pending Questions / Actions" (if any) as bullet points.

Chat Transcript:
"""
${transcript}
"""
`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('[AI Summarize Error]:', error);
    res.status(500).json({ success: false, message: 'AI failed to generate conversation summary.' });
  }
};

// @desc    Generate Smart Replies based on recent context
// @route   POST /api/ai/smart-replies
// @access  Private
export const getSmartReplies = async (req, res) => {
  const { conversationId } = req.body;

  try {
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Fetch last 10 messages
    const messages = await Message.find({ conversationId, isDeleted: false })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        replies: ['Hello!', 'How can I help?', 'Hey there!'],
      });
    }

    // Format history
    const transcript = messages
      .reverse()
      .map((msg) => `${msg.sender.username}: ${msg.content}`)
      .join('\n');

    const prompt = `
You are a chat communication assistant. Below is the recent chat history.
Analyze the context of the conversation. Generate exactly 3 relevant, highly natural, friendly, and context-aware quick responses (smart replies) that the CURRENT user could click to reply instantly.
Output format MUST be a plain JSON array of strings containing exactly 3 reply suggestions. Do not include markdown ticks, just raw JSON.

Chat history:
"""
${transcript}
"""
`;

    const result = await model.generateContent(prompt);
    const text = cleanJSONString(result.response.text());

    let replies = [];
    try {
      replies = JSON.parse(text);
    } catch (e) {
      console.warn('[AI Smart Reply JSON Parse Failed]:', text);
      // Fallback in case Gemini formatted it incorrectly
      replies = ['Got it, thanks!', 'I will check it out.', 'Sounds good!'];
    }

    res.status(200).json({ success: true, replies });
  } catch (error) {
    console.error('[AI Smart Replies Error]:', error);
    res.status(500).json({ success: false, message: 'AI failed to generate smart replies.' });
  }
};

// @desc    Translate a message
// @route   POST /api/ai/translate
// @access  Private
export const translateMessage = async (req, res) => {
  const { text, targetLanguage } = req.body;

  try {
    if (!text || !targetLanguage) {
      return res.status(400).json({ success: false, message: 'Text and target language are required' });
    }

    const prompt = `
Translate the following chat message into "${targetLanguage}".
- Preserve the exact tone, emojis, markdown formatting, and punctuation.
- Output ONLY the translated message text, nothing else. No introductions, no explanations, no wrapping code blocks.

Message to translate:
"""
${text}
"""
`;

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();

    res.status(200).json({ success: true, translatedText });
  } catch (error) {
    console.error('[AI Translation Error]:', error);
    res.status(500).json({ success: false, message: 'AI failed to translate message.' });
  }
};

// @desc    Writing Assistant (Rewrite / Grammar)
// @route   POST /api/ai/write-assist
// @access  Private
export const writeAssist = async (req, res) => {
  const { text, tone } = req.body; // tone: professional, casual, shorten, expand, grammar

  try {
    if (!text || !tone) {
      return res.status(400).json({ success: false, message: 'Text and tone are required' });
    }

    let dynamicPrompt = '';
    switch (tone) {
      case 'professional':
        dynamicPrompt = 'Rewrite the following message to sound professional, polished, polite, and grammatically perfect for business communication. Maintain the core meaning.';
        break;
      case 'casual':
        dynamicPrompt = 'Rewrite the following message to sound highly casual, friendly, warm, and conversational, perfect for close friends or team members.';
        break;
      case 'shorten':
        dynamicPrompt = 'Condense and shorten the following message to make it concise and straight to the point, while keeping all crucial details.';
        break;
      case 'expand':
        dynamicPrompt = 'Slightly expand the following message to make it sound complete, polite, and detailed, keeping the original core message intact.';
        break;
      case 'grammar':
      default:
        dynamicPrompt = 'Correct any spelling, punctuation, or grammatical errors in the following message. If it is already correct, return it unchanged.';
        break;
    }

    const prompt = `
You are a professional editor. ${dynamicPrompt}
- Do not add introductions or explanations.
- Output ONLY the rewritten text.
- Preserve emojis if appropriate.

Text to rewrite:
"""
${text}
"""
`;

    const result = await model.generateContent(prompt);
    const rewrittenText = result.response.text().trim();

    res.status(200).json({ success: true, rewrittenText });
  } catch (error) {
    console.error('[AI Writing Assistant Error]:', error);
    res.status(500).json({ success: false, message: 'AI writing assistant failed to process text.' });
  }
};

// @desc    AI Semantic Search of message history
// @route   POST /api/ai/semantic-search
// @access  Private
export const semanticSearch = async (req, res) => {
  const { conversationId, query } = req.body;

  try {
    if (!conversationId || !query) {
      return res.status(400).json({ success: false, message: 'Conversation ID and search query are required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get last 100 messages in conversation to analyze
    const messages = await Message.find({ conversationId, isDeleted: false })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(100);

    if (messages.length === 0) {
      return res.status(200).json({ success: true, results: [] });
    }

    // Format list for Gemini scan
    const messageList = messages.map((msg) => ({
      id: msg._id,
      sender: msg.sender.username,
      content: msg.content,
      date: msg.createdAt,
    }));

    const prompt = `
You are an advanced search system. You will receive a list of chat messages and a semantic search query.
Analyze the meaning and context of the search query and find the messages in the list that match that meaning.
For example, a query of "database credentials" matches messages talking about "postgres config" or "mongo password" even if the literal words "database" and "credentials" are absent.

Search query: "${query}"

Message history to scan (formatted as JSON):
${JSON.stringify(messageList, null, 2)}

Return a JSON array containing the IDs of the matching messages, ordered from most relevant to least relevant.
- Return ONLY a plain JSON array of strings (the message IDs).
- Return at most 5 matches.
- Do not include markdown code fences (like \`\`\`json), just the plain array. If nothing is even remotely close to a match, return an empty array [].
`;

    const result = await model.generateContent(prompt);
    const text = cleanJSONString(result.response.text());

    let matchedIds = [];
    try {
      matchedIds = JSON.parse(text);
    } catch (e) {
      console.warn('[AI Semantic Search JSON Parse Failed]:', text);
      matchedIds = [];
    }

    // Fetch the actual populated matching messages in order of relevance
    let matchedMessages = [];
    if (matchedIds && matchedIds.length > 0) {
      const dbMessages = await Message.find({ _id: { $in: matchedIds } })
        .populate('sender', 'username email profilePhoto statusText')
        .populate({
          path: 'parentMessage',
          populate: { path: 'sender', select: 'username' },
        });

      // Sort matching messages according to the relevance array generated by Gemini
      matchedMessages = matchedIds
        .map((id) => dbMessages.find((m) => m._id.toString() === id.toString()))
        .filter(Boolean);
    }

    res.status(200).json({ success: true, results: matchedMessages });
  } catch (error) {
    console.error('[AI Semantic Search Error]:', error);
    res.status(500).json({ success: false, message: 'AI semantic search failed.' });
  }
};
