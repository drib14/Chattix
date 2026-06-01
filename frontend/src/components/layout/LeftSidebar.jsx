import { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useGroupModalStore from '../../store/groupModalStore';
import useSettingsDrawerStore from '../../store/settingsDrawerStore';
import { Search, Edit, MoreHorizontal, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChatSkeleton } from './Skeletons';

const LeftSidebar = ({ activeTab, setActiveTab }) => {
    const { user } = useAuthStore();
    const { chats, setChats, setSelectedChat, selectedChat } = useChatStore();
    const { openModal } = useGroupModalStore();
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

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
            
            // Extract online users from chats
            const online = [];
            data.forEach(c => {
                if (!c.isGroup) {
                    const other = c.participants.find(p => p._id !== user._id);
                    if (other && other.isOnline) {
                        online.push(other);
                    }
                }
            });
            // De-duplicate
            const uniqueOnline = online.filter((v, i, a) => a.findIndex(t => t._id === v._id) === i);
            setOnlineUsers(uniqueOnline);
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

    // Periodically sync online statuses or when activeTab changes
    useEffect(() => {
        if (user) {
            const interval = setInterval(() => {
                fetchChats();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [user, chats]);

    const handleSearch = async (e) => {
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
            // Don't show ourselves in user search
            setSearchResults(data.filter(u => u._id !== user._id));
        } catch (error) {
            toast.error('Search query failed');
        }
    };

    const accessChat = async (userId) => {
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/conversations`, { userId }, config);
            if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data);
            setSearchResults([]);
            setSearch('');
            setActiveTab('chats');
        } catch (error) {
            toast.error('Unable to establish conversation');
        }
    };

    const getOtherUser = (users) => {
        return users[0]._id === user._id ? users[1] : users[0];
    };

    const displayChats = activeTab === 'people' 
        ? chats.filter(c => !c.isGroup && getOtherUser(c.participants)?.isOnline)
        : chats;

    return (
        <div className="w-80 md:w-96 h-full border-r border-white/5 bg-[#12131a] flex flex-col flex-shrink-0 select-none">
            {/* Title / Action bar */}
            <div className="p-4 pt-6 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white tracking-tight">
                    {activeTab === 'people' ? 'Active Now' : 'Chats'}
                </h2>
                <div className="flex items-center space-x-1">
                    <button className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition cursor-pointer">
                        <MoreHorizontal size={20} />
                    </button>
                    <button onClick={openModal} className="p-2.5 text-[#0099ff] hover:text-[#33adff] hover:bg-white/5 rounded-full transition cursor-pointer">
                        <Edit size={20} className="stroke-[2.2]" />
                    </button>
                </div>
            </div>

            {/* Search Input bar */}
            <div className="px-4 pb-2">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Chattix"
                        value={search}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full bg-neutral-800/40 border border-white/5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:bg-neutral-800/80 focus:border-[#0099ff] transition-all"
                    />
                </div>
            </div>

            {/* Main scroll list */}
            <div className="flex-1 overflow-y-auto">
                {search.length > 0 ? (
                    /* Search results view */
                    <div className="p-2 space-y-1">
                        <div className="px-3 py-1.5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                            Contacts Found
                        </div>
                        {searchResults.length > 0 ? (
                            searchResults.map((searchUser) => (
                                <div
                                    key={searchUser._id}
                                    onClick={() => accessChat(searchUser._id)}
                                    className="flex items-center px-3 py-3 hover:bg-white/5 rounded-2xl cursor-pointer transition duration-200"
                                >
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-neutral-700 to-neutral-800 text-white font-bold text-lg">
                                        {searchUser.profilePic ? (
                                            <img src={searchUser.profilePic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            searchUser.username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h4 className="text-white font-semibold text-sm">{searchUser.username}</h4>
                                        <p className="text-neutral-500 text-xs truncate mt-0.5">{searchUser.email}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-neutral-500">
                                No users found matching "{search}"
                            </div>
                        )}
                    </div>
                ) : (
                    /* Default lists */
                    <div className="flex flex-col">
                        {/* Horizontal Active Now bubbles - only show in chats list if there are online users */}
                        {activeTab === 'chats' && onlineUsers.length > 0 && (
                            <div className="py-3 border-b border-white/5 mb-2">
                                <div className="px-4 pb-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                    Active Now
                                </div>
                                <div className="flex space-x-4 overflow-x-auto px-4 py-1 no-scrollbar scroll-smooth">
                                    {onlineUsers.map((onlineUser) => (
                                        <div
                                            key={onlineUser._id}
                                            onClick={() => accessChat(onlineUser._id)}
                                            className="flex flex-col items-center flex-shrink-0 cursor-pointer space-y-1.5 group"
                                        >
                                            <div className="relative w-14 h-14 rounded-full p-[3px] border border-white/5 group-hover:border-[#0099ff] bg-[#12131a] flex items-center justify-center transition duration-300">
                                                <div className="w-full h-full rounded-full overflow-hidden border border-white/10 bg-neutral-800 flex items-center justify-center text-white font-bold text-lg">
                                                    {onlineUser.profilePic ? (
                                                        <img src={onlineUser.profilePic} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        onlineUser.username[0].toUpperCase()
                                                    )}
                                                </div>
                                                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#12131a] rounded-full shadow-lg"></span>
                                            </div>
                                            <span className="text-[11px] text-neutral-400 group-hover:text-white transition truncate max-w-[64px] font-medium">
                                                {onlineUser.username.split(' ')[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent conversation list */}
                        <div className="p-2 space-y-1">
                            <div className="px-3 py-1.5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                Recent Chats
                            </div>

                            {loadingChats && chats.length === 0 ? (
                                <div>
                                    <ChatSkeleton />
                                    <ChatSkeleton />
                                    <ChatSkeleton />
                                    <ChatSkeleton />
                                </div>
                            ) : displayChats.length > 0 ? (
                                displayChats.map((chat) => {
                                    const otherUser = !chat.isGroup ? getOtherUser(chat.participants) : null;
                                    const chatName = chat.isGroup ? chat.groupName : otherUser?.username;
                                    const chatPic = chat.isGroup ? chat.groupAvatar : otherUser?.profilePic;
                                    const isOnline = !chat.isGroup && otherUser?.isOnline;
                                    const isSelected = selectedChat?._id === chat._id;

                                    return (
                                        <div
                                            key={chat._id}
                                            onClick={() => setSelectedChat(chat)}
                                            className={`flex items-center px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-[#0099ff]/10 text-white'
                                                    : 'hover:bg-white/5 text-neutral-300 hover:text-white'
                                            }`}
                                        >
                                            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-neutral-800 rounded-full border border-white/5 font-bold text-lg text-white overflow-hidden shadow-md">
                                                {chatPic ? (
                                                    <img src={chatPic} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    chatName?.[0]?.toUpperCase()
                                                )}
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#12131a] rounded-full shadow-lg"></span>
                                                )}
                                            </div>
                                            
                                            <div className="ml-3 flex-1 overflow-hidden">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="text-sm font-semibold truncate text-white">{chatName}</h4>
                                                    {chat.lastMessage && (
                                                        <span className="text-[10px] text-neutral-500 whitespace-nowrap ml-2">
                                                            {new Date(chat.lastMessage.createdAt || chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-neutral-500 text-xs truncate mt-0.5 font-medium">
                                                    {chat.lastMessage ? (
                                                        chat.lastMessage.text || (chat.lastMessage.image ? '📷 Sent a photo' : chat.lastMessage.gifUrl ? '🎬 Sent a GIF' : '📍 Shared location')
                                                    ) : (
                                                        'No messages yet'
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500">
                                    <UserPlus className="text-neutral-600 mb-2" size={32} />
                                    <p className="text-sm font-medium">No active contacts found.</p>
                                    <p className="text-xs text-neutral-600 mt-1">Search for a username above to start chatting!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeftSidebar;
