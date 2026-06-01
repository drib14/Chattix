import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useConfirmStore from '../../store/confirmStore';
import { Bell, Search, LogOut, ChevronDown, ChevronUp, Palette, Image as ImageIcon, ShieldAlert, Heart } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GRADIENTS = [
    { name: 'blue', label: 'Classic Messenger', class: 'bg-[#0084FF]' },
    { name: 'candy', label: 'Candy Crush', class: 'bg-gradient-to-r from-[#ec008c] to-[#fc6767]' },
    { name: 'lavender', label: 'Lavender Sunset', class: 'bg-gradient-to-r from-[#8a2387] via-[#e94057] to-[#f27121]' },
    { name: 'sea', label: 'Emerald Sea', class: 'bg-gradient-to-r from-[#11998e] to-[#38ef7d]' },
    { name: 'cyberpunk', label: 'Cyberpunk Spark', class: 'bg-gradient-to-r from-[#f12711] to-[#f5af19]' },
];

const RightSidebar = () => {
    const { user, logout } = useAuthStore();
    const { selectedChat, setSelectedChat, chats, setChats } = useChatStore();
    const { showConfirm } = useConfirmStore();
    const navigate = useNavigate();

    // Accordion states
    const [openSection, setOpenSection] = useState('customize'); // 'info' | 'customize' | 'media' | 'privacy'

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? '' : section);
    };

    const handleLogout = () => {
        showConfirm({
            title: 'Log Out of Messenger',
            message: 'Are you sure you want to sign out?',
            type: 'warning',
            confirmText: 'Log Out',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
                    logout();
                    navigate('/login');
                } catch (error) {
                    toast.error('Logout failed');
                }
            }
        });
    };

    // Update conversation theme
    const changeChatTheme = async (themeName) => {
        if (!selectedChat) return;

        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };

            const { data } = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/conversations/theme`,
                { conversationId: selectedChat._id, theme: themeName },
                config
            );

            // Update local store
            const updatedChats = chats.map((c) => (c._id === data._id ? data : c));
            setChats(updatedChats);
            setSelectedChat(data);
            toast.success(`Chat theme updated to ${themeName}!`);
        } catch (error) {
            toast.error('Failed to change chat theme');
        }
    };

    if (!selectedChat) {
        return (
            <div className="w-80 h-full hidden lg:flex flex-col bg-[#12131a] items-center justify-between p-6 flex-shrink-0 select-none">
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
                    <Heart size={36} className="text-neutral-700 animate-pulse mb-3" />
                    <p className="text-sm font-semibold">No Active Chat details</p>
                    <p className="text-xs text-neutral-600 mt-1">Select a friend to view info</p>
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
        <div className="w-80 h-full hidden lg:flex flex-col bg-[#12131a] border-l border-white/5 flex-shrink-0 select-none">
            {/* Header info */}
            <div className="flex flex-col items-center p-6 border-b border-white/5">
                <div className="relative w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center text-white text-3xl mb-3 overflow-hidden shadow-lg border-2 border-white/5">
                    {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover" /> : chatName?.[0]?.toUpperCase()}
                    {!selectedChat.isGroup && otherUser?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#12131a] rounded-full"></span>
                    )}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{chatName}</h3>
                {!selectedChat.isGroup && (
                    <p className="text-xs text-neutral-500 truncate max-w-full mt-0.5">{otherUser?.email}</p>
                )}
            </div>

            {/* Quick Actions */}
            <div className="flex justify-around py-4 border-b border-white/5 text-neutral-400">
                <div className="flex flex-col items-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition duration-200">
                    <Bell size={20} />
                    <span className="text-[10px] mt-1 font-semibold">Mute</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition duration-200">
                    <Search size={20} />
                    <span className="text-[10px] mt-1 font-semibold">Search</span>
                </div>
            </div>

            {/* Accordion Menu list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {/* Chat Info Accordion */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-neutral-900/35">
                    <button
                        onClick={() => toggleSection('info')}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition"
                    >
                        <span>Chat Info</span>
                        {openSection === 'info' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openSection === 'info' && (
                        <div className="px-4 pb-3.5 pt-1.5 text-xs text-neutral-400 space-y-2 border-t border-white/5 animate-slide-down">
                            <div>
                                <span className="font-semibold text-neutral-500">Conversation ID: </span>
                                <span className="font-mono">{selectedChat._id}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-neutral-500">Participants Count: </span>
                                <span>{selectedChat.participants.length}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Customize Chat Theme Accordion */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-neutral-900/35">
                    <button
                        onClick={() => toggleSection('customize')}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition"
                    >
                        <div className="flex items-center space-x-2">
                            <Palette size={16} className="text-[#0099ff]" />
                            <span>Customize Chat</span>
                        </div>
                        {openSection === 'customize' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openSection === 'customize' && (
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 animate-slide-down">
                            <p className="text-xs text-neutral-500 font-semibold mb-3.5 uppercase tracking-wider">
                                Select Chat Accent theme
                            </p>
                            <div className="grid grid-cols-5 gap-3">
                                {GRADIENTS.map((grad) => (
                                    <button
                                        key={grad.name}
                                        onClick={() => changeChatTheme(grad.name)}
                                        title={grad.label}
                                        className={`w-10 h-10 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center relative ${grad.class} ${
                                            (selectedChat.theme || 'default') === grad.name
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12131a]'
                                                : 'ring-1 ring-white/10'
                                        }`}
                                    >
                                        {(selectedChat.theme || 'default') === grad.name && (
                                            <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Media & Files Accordion */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-neutral-900/35">
                    <button
                        onClick={() => toggleSection('media')}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition"
                    >
                        <div className="flex items-center space-x-2">
                            <ImageIcon size={16} className="text-emerald-500" />
                            <span>Media, Files and Links</span>
                        </div>
                        {openSection === 'media' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openSection === 'media' && (
                        <div className="px-4 pb-4 pt-2 text-xs text-neutral-500 border-t border-white/5 animate-slide-down text-center">
                            No shared documents or media files found in this chat.
                        </div>
                    )}
                </div>

                {/* Support Accordion */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-neutral-900/35">
                    <button
                        onClick={() => toggleSection('privacy')}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition"
                    >
                        <div className="flex items-center space-x-2">
                            <ShieldAlert size={16} className="text-red-500" />
                            <span>Privacy & Support</span>
                        </div>
                        {openSection === 'privacy' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openSection === 'privacy' && (
                        <div className="px-4 pb-3.5 pt-1.5 border-t border-white/5 animate-slide-down space-y-1.5">
                            <button className="w-full text-left py-2 px-3 hover:bg-white/5 rounded-xl text-xs font-semibold text-red-500 transition cursor-pointer">
                                Block Contact
                            </button>
                            <button className="w-full text-left py-2 px-3 hover:bg-white/5 rounded-xl text-xs font-semibold text-red-500/80 transition cursor-pointer">
                                Report User
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout bottom footer */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center space-x-2 w-full py-3 text-sm font-bold text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 transition cursor-pointer"
                >
                    <LogOut size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default RightSidebar;
