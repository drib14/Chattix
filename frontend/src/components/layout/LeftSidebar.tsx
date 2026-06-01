import { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useGroupModalStore from '../../store/groupModalStore';
import useSettingsDrawerStore from '../../store/settingsDrawerStore';
import { Search, MoreVertical, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChatSkeleton } from './Skeletons';

const LeftSidebar = () => {
    const { user } = useAuthStore();
    const { chats, setChats, setSelectedChat, selectedChat } = useChatStore();
    const { openModal } = useGroupModalStore();
    const { openDrawer } = useSettingsDrawerStore();
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);

    const fetchChats = async () => {
        setLoadingChats(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/conversations`, config);
            setChats(data);
        } catch (error) {
            toast.error('Failed to load chats');
        } finally {
            setLoadingChats(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    const handleSearch = async (e: any) => {
        setSearch(e.target.value);
        if (!e.target.value) {
            setSearchResults([]);
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?search=${e.target.value}`, config);
            setSearchResults(data);
        } catch (error) {
            toast.error('Failed to search users');
        }
    };

    const accessChat = async (userId: string) => {
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/conversations`, { userId }, config);
            if (!chats.find((c: any) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data);
            setSearchResults([]);
            setSearch('');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getOtherUser = (users: any[]) => {
        return users[0]._id === user._id ? users[1] : users[0];
    };

    return (
        <div className="w-1/4 min-w-[300px] border-r border-[var(--color-border-dark)] h-full bg-[var(--color-bg-dark)] flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-[var(--color-border-dark)]">
                <h1 className="text-2xl font-bold text-white">Chats</h1>
                <div className="flex space-x-2 text-[var(--color-text-dark-secondary)]">
                    <button className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full cursor-pointer"><MoreVertical size={20} /></button>
                    <button onClick={openModal} className="p-2 hover:bg-[var(--color-bg-dark-hover)] rounded-full cursor-pointer"><Edit size={20} /></button>
                </div>
            </div>

            <div className="p-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-[var(--color-text-dark-secondary)]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Messenger"
                        value={search}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--color-bg-dark-secondary)] text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder-[var(--color-text-dark-secondary)]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loadingChats ? (
                    <div>
                        <ChatSkeleton />
                        <ChatSkeleton />
                        <ChatSkeleton />
                        <ChatSkeleton />
                        <ChatSkeleton />
                    </div>
                ) : searchResults.length > 0 ? (
                    <div>
                        {searchResults.map((searchUser: any) => (
                            <div
                                key={searchUser._id}
                                onClick={() => accessChat(searchUser._id)}
                                className="flex items-center p-3 hover:bg-[var(--color-bg-dark-hover)] cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl overflow-hidden">
                                    {searchUser.profilePic ? <img src={searchUser.profilePic} alt="" className="w-full h-full object-cover"/> : searchUser.username[0]}
                                </div>
                                <div className="ml-3 flex-1 overflow-hidden">
                                    <h3 className="text-white font-medium truncate">{searchUser.username}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        {chats.map((chat: any) => {
                            const otherUser = !chat.isGroup ? getOtherUser(chat.participants) : null;
                            const chatName = chat.isGroup ? chat.groupName : otherUser?.username;
                            const chatPic = chat.isGroup ? chat.groupAvatar : otherUser?.profilePic;
                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`flex items-center p-3 cursor-pointer ${selectedChat?._id === chat._id ? 'bg-[var(--color-bg-dark-hover)]' : 'hover:bg-[var(--color-bg-dark-hover)]'}`}
                                >
                                    <div className="w-12 h-12 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl overflow-hidden">
                                       {chatPic ? <img src={chatPic} alt="" className="w-full h-full object-cover"/> : chatName?.[0]}
                                    </div>
                                    <div className="ml-3 flex-1 overflow-hidden">
                                        <h3 className="text-white font-medium truncate">{chatName}</h3>
                                        {chat.lastMessage && (
                                            <p className="text-[var(--color-text-dark-secondary)] text-sm truncate">
                                                {chat.lastMessage.text || (chat.lastMessage.image ? 'Sent an image' : 'Sent an attachment')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-[var(--color-border-dark)] flex items-center justify-between">
                <div onClick={openDrawer} className="flex items-center cursor-pointer hover:opacity-90 transition">
                    <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.profilePic ? <img src={user.profilePic} alt="" className="w-full h-full object-cover"/> : user.username[0]}
                    </div>
                    <span className="ml-3 text-white font-medium">{user.username}</span>
                </div>
            </div>
        </div>
    );
};

export default LeftSidebar;