import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { Send, Image as ImageIcon, Smile, MapPin, CreditCard, Sparkles, Phone, Video, X, Mic, MicOff, ThumbsUp, Volume2 } from 'lucide-react';
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

// Synth sound generators for offline premium feel
const playSendSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.error('Audio synth error:', e);
    }
};

const playReceiveSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(680, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.08);
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.08);

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(850, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.1);
            gain2.gain.setValueAtTime(0.06, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.1);
        }, 50);
    } catch (e) {
        console.error('Audio synth error:', e);
    }
};

// Dialing ringing tone synthesizer
let ringInterval;
const startRingingSynth = () => {
    try {
        const playRing = () => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.value = 440;
            
            osc2.type = 'sine';
            osc2.frequency.value = 480;
            
            gain.gain.setValueAtTime(0.0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime + 1.2);
            gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.4);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start();
            osc2.start();
            
            osc1.stop(ctx.currentTime + 1.5);
            osc2.stop(ctx.currentTime + 1.5);
        };
        
        playRing();
        ringInterval = setInterval(playRing, 3000);
    } catch (e) {
        console.error(e);
    }
};

const stopRingingSynth = () => {
    if (ringInterval) {
        clearInterval(ringInterval);
        ringInterval = null;
    }
};

const CONVERSATION_THEMES = {
    default: {
        bgStyle: { background: 'var(--chat-bg-gradient)' },
        bubbleStyle: 'rounded-[20px] rounded-br-sm bg-[#0084FF] text-white',
        incomingBubbleStyle: 'rounded-[20px] rounded-bl-sm bg-neutral-800 text-white border border-white/5',
        textStyle: 'text-[#0084FF]',
        fontClass: 'font-sans font-medium',
        quickAction: '👍',
        name: 'default'
    },
    blue: {
        bgStyle: { background: 'var(--chat-bg-gradient)' },
        bubbleStyle: 'rounded-[20px] rounded-br-sm bg-[#0084FF] text-white',
        incomingBubbleStyle: 'rounded-[20px] rounded-bl-sm bg-neutral-800 text-white border border-white/5',
        textStyle: 'text-[#0084FF]',
        fontClass: 'font-sans font-medium',
        quickAction: '👍',
        name: 'blue'
    },
    one_piece: {
        bgStyle: { 
            backgroundColor: '#050a14', 
            backgroundImage: 'radial-gradient(at top, #112240 0%, #020c1b 100%)',
        },
        bubbleStyle: 'rounded-[24px] rounded-br-[4px] bg-gradient-to-br from-[#f39c12] via-[#e67e22] to-[#d35400] text-white font-bold border border-[#f39c12]/50 shadow-[0_4px_15px_rgba(243,156,18,0.3)]',
        incomingBubbleStyle: 'rounded-[24px] rounded-bl-[4px] bg-[#1a2238] text-[#ecd8c6] border border-[#d4af37]/35 shadow-[0_2px_8px_rgba(212,175,55,0.15)]',
        textStyle: 'text-[#f39c12]',
        fontClass: 'font-serif tracking-wide',
        watermark: 'one_piece',
        quickAction: '🏴‍☠️',
        avatarClass: 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#020c1b]',
        name: 'one_piece'
    },
    minecraft: {
        bgStyle: { 
            backgroundColor: '#1b1b1b',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
        },
        bubbleStyle: 'rounded-none bg-[#4a7227] text-white border-2 border-t-[#85af5c] border-l-[#85af5c] border-b-[#2c4516] border-r-[#2c4516] shadow-[inset_1px_1px_0px_#85af5c,inset_-1px_-1px_0px_#2c4516] tracking-wider text-xs',
        incomingBubbleStyle: 'rounded-none bg-[#313233] text-[#dedede] border-2 border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111] shadow-[inset_1px_1px_0px_#555,inset_-1px_-1px_0px_#111] tracking-wider text-xs',
        textStyle: 'text-[#85af5c]',
        fontClass: 'font-mono uppercase text-[#dedede]',
        quickAction: '⛏️',
        watermark: 'minecraft',
        avatarClass: 'rounded-none border-2 border-[#555] scale-95',
        name: 'minecraft'
    },
    candy: {
        bgStyle: { backgroundColor: '#180a13', backgroundImage: 'linear-gradient(135deg, #2b0e22 0%, #180a13 100%)' },
        bubbleStyle: 'rounded-[20px] rounded-br-sm bg-gradient-to-r from-[#ec008c] to-[#fc6767] text-white font-bold',
        incomingBubbleStyle: 'rounded-[20px] rounded-bl-sm bg-neutral-800 text-white border border-white/5',
        textStyle: 'text-pink-400',
        fontClass: 'font-sans font-medium',
        quickAction: '🍬',
        name: 'candy'
    },
    lavender: {
        bgStyle: { backgroundColor: '#0f0a1d', backgroundImage: 'linear-gradient(135deg, #1f1235 0%, #0f0a1d 100%)' },
        bubbleStyle: 'rounded-[20px] rounded-br-sm bg-gradient-to-r from-[#8a2387] via-[#e94057] to-[#f27121] text-white font-bold',
        incomingBubbleStyle: 'rounded-[20px] rounded-bl-sm bg-neutral-800 text-white border border-white/5',
        textStyle: 'text-purple-400',
        fontClass: 'font-sans font-medium',
        quickAction: '💜',
        name: 'lavender'
    },
    sea: {
        bgStyle: { backgroundColor: '#051111', backgroundImage: 'linear-gradient(135deg, #0a2020 0%, #051111 100%)' },
        bubbleStyle: 'rounded-[20px] rounded-br-sm bg-gradient-to-r from-[#11998e] to-[#38ef7d] text-neutral-950 font-bold',
        incomingBubbleStyle: 'rounded-[20px] rounded-bl-sm bg-neutral-800 text-white border border-white/5',
        textStyle: 'text-teal-400',
        fontClass: 'font-sans font-medium',
        quickAction: '🌊',
        name: 'sea'
    },
};

const MainChat = () => {
    const { user } = useAuthStore();
    const { selectedChat, messages, setMessages, addMessage } = useChatStore();
    const [newMessage, setNewMessage] = useState('');
    const [, setSocketConnected] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    
    // Call States
    const [callActive, setCallActive] = useState(false);
    const [callType, setCallType] = useState('voice'); // 'voice' | 'video'
    const [callStatus, setCallStatus] = useState('dialing'); // 'dialing' | 'connected'
    const [callTimer, setCallTimer] = useState(0);
    const [micMuted, setMicMuted] = useState(false);
    const timerRef = useRef(null);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        socket = io(ENDPOINT, { withCredentials: true });
        socket.emit('setup', user);
        socket.on('connected', () => setSocketConnected(true));

        socket.on('typing', () => setOtherUserTyping(true));
        socket.on('stop typing', () => setOtherUserTyping(false));

        socket.on('message recieved', (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.conversationId._id) {
                // Background notification (soft synth pop)
                playReceiveSound();
            } else {
                addMessage(newMessageRecieved);
                playReceiveSound();
            }
        });

        return () => {
            socket.disconnect();
            stopRingingSynth();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const fetchMessages = async () => {
        if (!selectedChat) return;

        setLoadingMessages(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                withCredentials: true,
            };

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/messages/${selectedChat._id}`,
                config
            );
            setMessages(data);
            socket.emit('join chat', selectedChat._id);
        } catch (error) {
            toast.error('Failed to load conversation history');
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
        setOtherUserTyping(false);
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, otherUserTyping]);

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
            playSendSound();
        } catch (error) {
            toast.error('Unable to transmit message');
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
            playSendSound();

            const { data: aiData } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/ai`,
                { prompt: prompt, conversationId: selectedChat._id },
                config
            );
            socket.emit('new message', aiData);
            addMessage(aiData);
            playReceiveSound();
        } catch (error) {
            toast.error('AI query encountered an issue');
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (!socket) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', selectedChat._id);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop typing', selectedChat._id);
            setIsTyping(false);
        }, 2000);
    };

    const sendMessage = async (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket.emit('stop typing', selectedChat._id);
            setIsTyping(false);

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

    // Thumbs up / quick action trigger
    const sendThumbsUp = async () => {
        await sendDataMessage({ content: themeSettings.quickAction || '👍' });
    };

    // Calling triggers
    const initiateCall = (type) => {
        setCallType(type);
        setCallStatus('dialing');
        setCallActive(true);
        setCallTimer(0);
        startRingingSynth();
    };

    const answerCall = () => {
        stopRingingSynth();
        setCallStatus('connected');
        timerRef.current = setInterval(() => {
            setCallTimer((prev) => prev + 1);
        }, 1000);
    };

    const terminateCall = () => {
        stopRingingSynth();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setCallActive(false);
        setCallStatus('dialing');
        setCallTimer(0);
        toast.error('Call ended');
    };

    const formatCallTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!selectedChat) {
        return (
            <div className="flex-1 border-r border-white/5 h-full flex flex-col items-center justify-center bg-[#0e0f14] select-none px-4 text-center">
                <div className="max-w-sm">
                    <div className="w-28 h-28 bg-[#0099ff]/5 border border-[#0099ff]/10 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl relative">
                        {/* Custom pulsing graphic */}
                        <div className="absolute inset-0 bg-[#0099ff] opacity-10 rounded-full animate-ping scale-75"></div>
                        <Send size={44} className="text-[#0099ff] rotate-[-15deg] relative z-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Select a conversation</h3>
                    <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                        Send photos, share location sharing points, execute Paymongo checkout payments, or use the interactive Google Gemini AI assistant inside a chat.
                    </p>
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
    const activeTheme = selectedChat.theme || 'default';
    const themeSettings = CONVERSATION_THEMES[activeTheme] || CONVERSATION_THEMES.default;
    const bubbleStyle = themeSettings.bubbleStyle;

    return (
        <div className="flex-1 border-r border-white/5 h-full flex flex-col bg-[#0e0f14] relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between shadow-sm bg-[#12131a]/80 backdrop-blur z-20">
                <div className="flex items-center min-w-0">
                    <div className="relative w-10 h-10 bg-neutral-800 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden border border-white/5">
                        {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover" /> : chatName?.[0]?.toUpperCase()}
                        {!selectedChat.isGroup && otherUser?.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#12131a] rounded-full"></span>
                        )}
                    </div>
                    <div className="ml-3 min-w-0">
                        <h3 className="text-white font-bold text-sm truncate leading-tight">{chatName}</h3>
                        {!selectedChat.isGroup && (
                            <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                                {otherUser?.isOnline ? 'Active now' : 'Offline'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Call triggers */}
                <div className="flex items-center space-x-2 text-[#0099ff]">
                    <button onClick={() => initiateCall('voice')} className="p-2.5 hover:bg-white/5 rounded-full transition cursor-pointer">
                        <Phone size={20} className="stroke-[2.2]" />
                    </button>
                    <button onClick={() => initiateCall('video')} className="p-2.5 hover:bg-white/5 rounded-full transition cursor-pointer">
                        <Video size={20} className="stroke-[2.2]" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 select-text relative" 
                style={themeSettings.bgStyle}
            >
                {/* Visual Watermark Overlay for Special themes like One Piece */}
                {themeSettings.watermark && activeTheme === 'one_piece' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
                        <svg viewBox="0 0 100 100" className="w-80 h-80 fill-white">
                            <path d="M50 5C45 5 41 9 41 14C41 15 41 16 41.5 17L30 25C25 21 18 22 14 27C10 32 11 39 16 43L25 50L16 57C11 61 10 68 14 73C18 78 25 79 30 75L41.5 83C41 84 41 85 41 86C41 91 45 95 50 95C55 95 59 91 59 86C59 85 59 84 58.5 83L70 75C75 79 82 78 86 73C90 68 89 61 84 57L75 50L84 43C89 39 90 32 86 27C82 22 75 21 70 25L58.5 17C59 16 59 15 59 14C59 9 55 5 50 5 Z M 50 25 C 58 25 65 31 65 39 C 65 47 58 53 50 53 C 42 53 35 47 35 39 C 35 31 42 25 50 25 Z" />
                        </svg>
                    </div>
                )}
                {themeSettings.watermark && activeTheme === 'minecraft' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none z-0">
                        <svg viewBox="0 0 100 100" className="w-80 h-80 fill-white">
                            <path d="M 10 90 L 10 70 L 50 30 L 70 50 Z" />
                            <path d="M 60 40 L 70 20 L 90 10 L 80 30 L 60 40 Z" />
                            <path d="M 70 20 L 80 20 L 80 10 L 70 10 Z" />
                        </svg>
                    </div>
                )}
                {loadingMessages ? (
                    <div>
                        <MessageSkeleton />
                        <MessageSkeleton isOwn />
                        <MessageSkeleton />
                        <MessageSkeleton isOwn />
                    </div>
                ) : messages.map((m) => {
                    const isMyMessage = m.sender._id === user._id;
                    const senderPic = m.sender.profilePic;
                    const senderInitial = m.sender.username[0]?.toUpperCase() || '?';

                    return (
                        <div key={m._id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} items-end group`}>
                            {!isMyMessage && (
                                <div className={`w-7 h-7 bg-neutral-800 mr-2 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 text-[10px] font-bold text-white mb-0.5 ${themeSettings.avatarClass || 'rounded-full'}`}>
                                    {senderPic ? <img src={senderPic} alt="" className="w-full h-full object-cover" /> : senderInitial}
                                </div>
                            )}
                            <div className="flex flex-col max-w-[70%]">
                                <div className={`px-3.5 py-2.5 text-sm ${
                                    isMyMessage 
                                        ? `${bubbleStyle} rounded-br-sm shadow-md` 
                                        : `${themeSettings.incomingBubbleStyle || 'bg-neutral-800 text-white rounded-bl-sm border border-white/5'}`
                                } ${m.isAiGenerated ? 'border-2 border-fuchsia-500 shadow-lg shadow-fuchsia-500/10' : ''}`}>
                                    {m.text && <p className={`leading-relaxed break-words ${themeSettings.fontClass || 'font-sans font-medium'}`}>{m.text}</p>}
                                    {m.image && <img src={m.image} alt="attachment" className="rounded-2xl mt-1.5 max-w-full max-h-60 object-cover shadow border border-white/5" />}
                                    {m.gifUrl && <img src={m.gifUrl} alt="gif" className="rounded-2xl mt-1.5 max-w-full max-h-60 object-cover shadow border border-white/5" />}
                                    
                                    {/* Location details card */}
                                    {m.location && (
                                        <div className="mt-1.5 text-xs bg-black/35 backdrop-blur border border-white/5 p-3 rounded-2xl">
                                            <div className="flex items-center text-[#0099ff] font-bold mb-1.5">
                                                <MapPin size={14} className="mr-1" />
                                                <span>Location Shared</span>
                                            </div>
                                            <div className="text-neutral-300 font-medium font-sans">
                                                Lat: {m.location.lat.toFixed(5)}, Lng: {m.location.lng.toFixed(5)}
                                            </div>
                                            {m.location.address && (
                                                <p className="text-neutral-400 mt-1 font-sans leading-tight border-t border-white/5 pt-1.5">
                                                    {m.location.address}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Payment checkout request details */}
                                    {m.paymentIntentId && (
                                        <div className="mt-1.5 text-xs bg-black/35 backdrop-blur border border-white/5 p-3 rounded-2xl">
                                            <div className="flex items-center text-green-500 font-bold mb-1.5">
                                                <CreditCard size={14} className="mr-1" />
                                                <span>Paymongo Request</span>
                                            </div>
                                            <div className="text-neutral-300 font-medium font-mono text-[10px] leading-tight">
                                                Intent: {m.paymentIntentId.slice(0, 16)}...
                                            </div>
                                            <div className="text-[9px] bg-green-500/10 text-green-400 font-bold border border-green-500/20 px-2 py-0.5 rounded-full inline-block mt-2">
                                                Completed Checkout
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Jumping Typing indicator bubble */}
                {otherUserTyping && (
                    <div className="flex justify-start items-end">
                        <div className={`w-7 h-7 bg-neutral-800 mr-2 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 text-[10px] font-bold text-white mb-0.5 ${themeSettings.avatarClass || 'rounded-full'}`}>
                            {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover" /> : chatName?.[0]?.toUpperCase()}
                        </div>
                        <div className={`${activeTheme === 'minecraft' ? 'rounded-none bg-[#313233] border-2 border-t-[#555] border-l-[#555] border-b-[#111] border-r-[#111]' : 'bg-neutral-800 rounded-[20px] rounded-bl-sm'} text-neutral-400 px-4 py-3.5 flex items-center space-x-1 border border-white/5`}>
                            <span className={`${activeTheme === 'minecraft' ? 'w-2.5 h-2.5 bg-[#85af5c] rounded-none' : 'w-2 h-2 bg-neutral-500 rounded-full'} animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                            <span className={`${activeTheme === 'minecraft' ? 'w-2.5 h-2.5 bg-[#85af5c] rounded-none' : 'w-2 h-2 bg-neutral-500 rounded-full'} animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                            <span className={`${activeTheme === 'minecraft' ? 'w-2.5 h-2.5 bg-[#85af5c] rounded-none' : 'w-2 h-2 bg-neutral-500 rounded-full'} animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-[#12131a]/85 backdrop-blur z-20">
                <div className="flex items-end space-x-2">
                    {/* Media / popover bar */}
                    <div className="flex space-x-1 mb-1.5 text-[#0099ff] flex-shrink-0">
                        <ImageUploadPopover onImageUpload={(url) => sendDataMessage({ image: url })}>
                            <button className="p-2 hover:bg-white/5 rounded-full transition cursor-pointer"><ImageIcon size={20} className="stroke-[2.2]" /></button>
                        </ImageUploadPopover>

                        <GiphyPopover onGifSelect={(url) => sendDataMessage({ gifUrl: url })}>
                             <button className="p-2 hover:bg-white/5 rounded-full transition font-black text-[10px] tracking-wide flex items-center justify-center cursor-pointer">GIF</button>
                        </GiphyPopover>

                        <EmojiPopover onEmojiSelect={(emoji) => setNewMessage((prev) => prev + emoji)}>
                            <button className="p-2 hover:bg-white/5 rounded-full transition cursor-pointer"><Smile size={20} className="stroke-[2.2]" /></button>
                        </EmojiPopover>

                        <LocationPopover onLocationShare={(loc) => sendDataMessage({ location: loc })}>
                            <button className="p-2 hover:bg-white/5 rounded-full transition cursor-pointer"><MapPin size={20} className="stroke-[2.2]" /></button>
                        </LocationPopover>

                        <PaymongoPopover onPaymentSuccess={(id) => sendDataMessage({ paymentIntentId: id })}>
                            <button className="p-2 hover:bg-white/5 rounded-full transition cursor-pointer"><CreditCard size={20} className="stroke-[2.2]" /></button>
                        </PaymongoPopover>

                        <button onClick={() => setNewMessage((prev) => prev + '/chat ')} className="p-2 hover:bg-white/5 rounded-full transition cursor-pointer">
                            <Sparkles size={20} className="text-fuchsia-400 stroke-[2.2] animate-pulse" />
                        </button>
                    </div>

                    {/* Chat Text Input field */}
                    <div className="flex-1 bg-neutral-800/40 border border-white/5 rounded-3xl flex items-center pr-2">
                        <input
                            type="text"
                            placeholder="Type a message... (Use /chat to query Gemini)"
                            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white focus:outline-none placeholder-neutral-500 font-sans"
                            value={newMessage}
                            onChange={handleTyping}
                            onKeyDown={sendMessage}
                        />
                        
                        {/* Swapping Thumbs-Up / Send button based on text entry */}
                        {newMessage.trim() === '' ? (
                            <button onClick={sendThumbsUp} className="p-2 text-xl hover:bg-white/5 rounded-full transition active:scale-90 cursor-pointer flex items-center justify-center w-9 h-9 select-none">
                                {themeSettings.quickAction === '👍' ? (
                                    <ThumbsUp size={18} className="fill-[#0099ff] stroke-none" />
                                ) : (
                                    <span>{themeSettings.quickAction}</span>
                                )}
                            </button>
                        ) : (
                            <button onClick={sendMessage} className="p-2 text-[#0099ff] hover:bg-white/5 rounded-full transition cursor-pointer">
                                <Send size={18} className="stroke-[2.2]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CALL OVERLAY MODAL */}
            {callActive && (
                <div className="absolute inset-0 bg-[#090a0e]/95 backdrop-blur-md z-50 flex flex-col justify-between p-10 items-center select-none text-white animate-fade-in">
                    {/* Ringing / connection header */}
                    <div className="text-center mt-6">
                        <div className="flex items-center justify-center space-x-2 text-[#0099ff] mb-2">
                            {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
                            <span className="text-xs uppercase tracking-widest font-black">
                                Chattix {callType} Call
                            </span>
                        </div>
                        <h2 className="text-2xl font-black">{chatName}</h2>
                        
                        {callStatus === 'dialing' ? (
                            <p className="text-neutral-500 text-sm animate-pulse mt-1.5 font-medium">Contacting...</p>
                        ) : (
                            <p className="text-green-500 text-sm font-semibold mt-1.5 tracking-wider font-mono">
                                CONNECTED — {formatCallTime(callTimer)}
                            </p>
                        )}
                    </div>

                    {/* Ringing Visual animation circle */}
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute w-44 h-44 rounded-full bg-[#0099ff]/5 border border-[#0099ff]/10 ${callStatus === 'dialing' ? 'animate-ping' : ''}`}></div>
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 z-10 shadow-2xl bg-neutral-800 flex items-center justify-center font-bold text-3xl">
                            {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover" /> : chatName?.[0]?.toUpperCase()}
                        </div>
                        
                        {/* Audio wave waves overlay if active connected call */}
                        {callStatus === 'connected' && (
                            <div className="absolute inset-x-[-40px] flex justify-around items-center h-12 bottom-[-80px]">
                                <span className="w-1.5 h-6 bg-[#0099ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-10 bg-[#0099ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-8 bg-[#0099ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                <span className="w-1.5 h-12 bg-[#0099ff] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></span>
                                <span className="w-1.5 h-5 bg-[#0099ff] rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></span>
                            </div>
                        )}
                    </div>

                    {/* Calling Options controls toolbar */}
                    <div className="flex items-center space-x-6 mb-6">
                        {callStatus === 'dialing' ? (
                            <>
                                {/* Mock decline */}
                                <button onClick={terminateCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center shadow-lg transition cursor-pointer">
                                    <X size={26} className="stroke-[2.5]" />
                                </button>
                                
                                {/* Mock answer trigger */}
                                <button onClick={answerCall} className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 active:scale-95 flex items-center justify-center shadow-lg transition animate-bounce cursor-pointer">
                                    <Phone size={26} className="stroke-[2.5]" />
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Mic toggle */}
                                <button 
                                    onClick={() => {
                                        setMicMuted(!micMuted);
                                        toast.success(micMuted ? 'Microphone active' : 'Microphone muted');
                                    }}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 shadow-md border border-white/5 cursor-pointer ${
                                        micMuted ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>

                                {/* Red hang up trigger */}
                                <button onClick={terminateCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center shadow-lg transition cursor-pointer">
                                    <X size={26} className="stroke-[2.5]" />
                                </button>

                                {/* Voice Volume speaker trigger */}
                                <button 
                                    onClick={() => toast.success('Speaker toggle active')}
                                    className="w-14 h-14 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-750 flex items-center justify-center transition active:scale-95 shadow-md border border-white/5 cursor-pointer"
                                >
                                    <Volume2 size={20} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainChat;
