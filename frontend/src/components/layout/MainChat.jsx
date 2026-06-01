import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { Send, Image as ImageIcon, Smile, MapPin, CreditCard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import ImageUploadPopover from '../chat/popovers/ImageUploadPopover';
import GiphyPopover from '../chat/popovers/GiphyPopover';
import EmojiPopover from '../chat/popovers/EmojiPopover';
import LocationPopover from '../chat/popovers/LocationPopover';
import PaymongoPopover from '../chat/popovers/PaymongoPopover';
import { MessageSkeleton } from './Skeletons';

const ENDPOINT = import.meta.env.VITE_API_URL;
var socket, selectedChatCompare;

const MainChat = () => {
    const { user } = useAuthStore();
    const { selectedChat, messages, setMessages, addMessage } = useChatStore();
    const [newMessage, setNewMessage] = useState('');
    const [, setSocketConnected] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        socket = io(ENDPOINT, { withCredentials: true });
        socket.emit('setup', user);
        socket.on('connected', () => setSocketConnected(true));

        socket.on('message recieved', (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.conversationId._id) {
                // notification
            } else {
                addMessage(newMessageRecieved);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchMessages = async () => {
        if (!selectedChat) return;

        setLoadingMessages(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/messages/${selectedChat._id}`,
                config
            );
            setMessages(data);
            socket.emit('join chat', selectedChat._id);
        } catch (error) {
            toast.error('Failed to Load Messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendDataMessage = async (payload) => {
        try {
             const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/messages`,
                { ...payload, conversationId: selectedChat._id },
                config
            );
            socket.emit('new message', data);
            addMessage(data);
        } catch (error) {
            toast.error('Failed to send the Message');
        }
    };

    const invokeAI = async (prompt) => {
         try {
             const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };

            const tempUserMessage = {
                _id: Date.now().toString(),
                text: prompt,
                sender: { _id: user._id, username: user.username, profilePic: user.profilePic },
                conversationId: selectedChat,
                isAiGenerated: false
            };
            addMessage(tempUserMessage);

            const { data: aiData } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/ai`,
                { prompt: prompt, conversationId: selectedChat._id },
                config
            );
            socket.emit('new message', aiData);
            addMessage(aiData);
        } catch (error) {
            toast.error('AI invocation failed');
        }
    };

    const sendMessage = async (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (newMessage) {
                const messageText = newMessage;
                setNewMessage('');

                if (messageText.startsWith('/chat ')) {
                    const prompt = messageText.replace('/chat ', '');
                    await invokeAI(prompt);
                } else {
                    await sendDataMessage({ content: messageText });
                }
            }
        }
    };

    if (!selectedChat) {
        return (
            <div className="flex-1 border-r border-[var(--color-border-dark)] h-full flex flex-col items-center justify-center bg-[var(--color-bg-dark)]">
                <div className="text-center text-[var(--color-text-dark-secondary)]">
                    <div className="w-24 h-24 bg-[var(--color-bg-dark-hover)] rounded-full mx-auto mb-4 flex items-center justify-center">
                       <Send size={48} className="text-[var(--color-primary)]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white">Your Messages</h2>
                    <p className="mt-2">Send private photos and messages to a friend or group.</p>
                </div>
            </div>
        );
    }

    const getOtherUser = (users) => {
        return users[0]._id === user._id ? users[1] : users[0];
    };

    const otherUser = !selectedChat.isGroup ? getOtherUser(selectedChat.participants) : null;
    const chatName = selectedChat.isGroup ? selectedChat.groupName : otherUser?.username;
    const chatPic = selectedChat.isGroup ? selectedChat.groupAvatar : otherUser?.profilePic;

    return (
        <div className="flex-1 border-r border-[var(--color-border-dark)] h-full flex flex-col bg-[var(--color-bg-dark)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border-dark)] flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                       {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover"/> : chatName?.[0]}
                    </div>
                    <div className="ml-3">
                        <h2 className="text-white font-semibold">{chatName}</h2>
                        {!selectedChat.isGroup && <p className="text-xs text-[var(--color-text-dark-secondary)]">{otherUser?.isOnline ? 'Active now' : 'Offline'}</p>}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--chat-bg-gradient)' }}>
                {loadingMessages ? (
                    <div>
                        <MessageSkeleton />
                        <MessageSkeleton isOwn />
                        <MessageSkeleton />
                        <MessageSkeleton isOwn />
                        <MessageSkeleton isOwn />
                    </div>
                ) : messages.map((m) => {
                    const isMyMessage = m.sender._id === user._id;
                    return (
                        <div key={m._id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            {!isMyMessage && (
                                <div className="w-8 h-8 rounded-full bg-gray-600 mr-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                     {m.sender.profilePic ? <img src={m.sender.profilePic} alt="" className="w-full h-full object-cover"/> : m.sender.username[0]}
                                </div>
                            )}
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMyMessage ? 'bg-[var(--color-primary)] text-white rounded-br-none' : 'bg-[var(--color-bg-dark-hover)] text-white rounded-bl-none'} ${m.isAiGenerated ? 'border border-[var(--color-secondary)]' : ''}`}>
                                {m.text && <p>{m.text}</p>}
                                {m.image && <img src={m.image} alt="attachment" className="rounded-lg mt-2 max-w-full" />}
                                {m.gifUrl && <img src={m.gifUrl} alt="gif" className="rounded-lg mt-2 max-w-full" />}
                                {m.location && (
                                    <div className="mt-2 text-sm bg-black/20 p-2 rounded">
                                        <div className="flex items-center"><MapPin size={16} className="mr-1"/> Location Shared</div>
                                        <div>Lat: {m.location.lat}, Lng: {m.location.lng}</div>
                                        {m.location.address && <div className="text-xs mt-1 text-gray-300">{m.location.address}</div>}
                                    </div>
                                )}
                                {m.paymentIntentId && (
                                    <div className="mt-2 text-sm bg-black/20 p-2 rounded">
                                        <div className="flex items-center"><CreditCard size={16} className="mr-1"/> Payment Request</div>
                                        <div className="text-xs mt-1">Intent ID: {m.paymentIntentId.slice(0, 10)}...</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--color-border-dark)]">
                <div className="flex items-end space-x-2">
                    <div className="flex space-x-1 mb-2 text-[var(--color-primary)]">
                        <ImageUploadPopover onImageUpload={(url) => sendDataMessage({ image: url })}>
                            <button className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full transition cursor-pointer"><ImageIcon size={20} /></button>
                        </ImageUploadPopover>

                        <GiphyPopover onGifSelect={(url) => sendDataMessage({ gifUrl: url })}>
                             <button className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full transition font-bold text-xs flex items-center justify-center cursor-pointer">GIF</button>
                        </GiphyPopover>

                        <EmojiPopover onEmojiSelect={(emoji) => setNewMessage((prev) => prev + emoji)}>
                            <button className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full transition cursor-pointer"><Smile size={20} /></button>
                        </EmojiPopover>

                        <LocationPopover onLocationShare={(loc) => sendDataMessage({ location: loc })}>
                            <button className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full transition cursor-pointer"><MapPin size={20} /></button>
                        </LocationPopover>

                        <PaymongoPopover onPaymentSuccess={(id) => sendDataMessage({ paymentIntentId: id })}>
                            <button className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full transition cursor-pointer"><CreditCard size={20} /></button>
                        </PaymongoPopover>

                        <button onClick={() => setNewMessage((prev) => prev + '/chat ')} className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full transition cursor-pointer"><Sparkles size={20} className="text-[var(--color-secondary)]" /></button>
                    </div>
                    <div className="flex-1 bg-[var(--color-bg-dark-secondary)] rounded-3xl flex items-center pr-2">
                        <input
                            type="text"
                            placeholder="Message... (Use /chat to invoke AI)"
                            className="flex-1 bg-transparent px-4 py-2 text-white focus:outline-none"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={sendMessage}
                        />
                        <button onClick={sendMessage} className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-bg-dark-hover)] rounded-full transition cursor-pointer">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainChat;
