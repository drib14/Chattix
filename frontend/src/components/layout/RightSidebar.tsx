import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { Bell, Image as ImageIcon, Search, LogOut } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RightSidebar = () => {
    const { user, logout } = useAuthStore();
    const { selectedChat } = useChatStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
            logout();
            navigate('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    if (!selectedChat) {
        return (
            <div className="w-1/4 h-full hidden lg:flex flex-col bg-[var(--color-bg-dark)] items-center justify-between p-6">
                <div className="w-full"></div>
                 <button onClick={handleLogout} className="flex items-center space-x-2 text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-[var(--color-bg-dark-hover)] w-full justify-center transition">
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        );
    }

    const getOtherUser = (users: any[]) => {
        return users[0]._id === user._id ? users[1] : users[0];
    };

    const otherUser = !selectedChat.isGroup ? getOtherUser(selectedChat.participants) : null;
    const chatName = selectedChat.isGroup ? selectedChat.groupName : otherUser?.username;
    const chatPic = selectedChat.isGroup ? selectedChat.groupAvatar : otherUser?.profilePic;

    return (
        <div className="w-1/4 min-w-[250px] h-full hidden lg:flex flex-col bg-[var(--color-bg-dark)] border-l border-[var(--color-border-dark)]">
            <div className="flex flex-col items-center p-6 border-b border-[var(--color-border-dark)]">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-white text-3xl mb-4 overflow-hidden shadow-lg border-2 border-[var(--color-bg-dark-secondary)]">
                    {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover"/> : chatName?.[0]}
                </div>
                <h2 className="text-xl font-bold text-white">{chatName}</h2>
                {!selectedChat.isGroup && <p className="text-sm text-[var(--color-text-dark-secondary)]">{otherUser?.email}</p>}
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex justify-around mb-6 border-b border-[var(--color-border-dark)] pb-4">
                    <div className="flex flex-col items-center cursor-pointer hover:bg-[var(--color-bg-dark-hover)] p-2 rounded-lg transition text-[var(--color-text-dark-secondary)] hover:text-white">
                        <Bell size={24} className="mb-1" />
                        <span className="text-xs">Mute</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer hover:bg-[var(--color-bg-dark-hover)] p-2 rounded-lg transition text-[var(--color-text-dark-secondary)] hover:text-white">
                        <Search size={24} className="mb-1" />
                        <span className="text-xs">Search</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="cursor-pointer flex items-center justify-between p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-lg transition">
                        <span className="text-white font-medium">Chat Info</span>
                    </div>
                    <div className="cursor-pointer flex items-center justify-between p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-lg transition">
                        <span className="text-white font-medium">Customize Chat</span>
                    </div>
                    <div className="cursor-pointer flex items-center justify-between p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-lg transition">
                        <span className="text-white font-medium">Media, Files and Links</span>
                        <ImageIcon size={18} className="text-[var(--color-text-dark-secondary)]" />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border-dark)]">
                 <button onClick={handleLogout} className="flex items-center space-x-2 text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-[var(--color-bg-dark-hover)] w-full justify-center transition">
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default RightSidebar;