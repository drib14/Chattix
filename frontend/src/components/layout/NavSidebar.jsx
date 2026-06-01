import useAuthStore from '../../store/authStore';
import useSettingsDrawerStore from '../../store/settingsDrawerStore';
import { MessageSquare, Users, Settings, LogOut, ShieldAlert } from 'lucide-react';
import useConfirmStore from '../../store/confirmStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NavSidebar = ({ activeTab = 'chats', setActiveTab }) => {
    const { user, logout } = useAuthStore();
    const { openDrawer } = useSettingsDrawerStore();
    const { showConfirm } = useConfirmStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        showConfirm({
            title: 'Log Out of Messenger',
            message: 'Are you sure you want to log out of your account?',
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

    return (
        <div className="w-[72px] h-full bg-[#0b0c10] border-r border-white/5 flex flex-col items-center justify-between py-5 flex-shrink-0 select-none">
            {/* Top Navigation Icons */}
            <div className="flex flex-col items-center space-y-4 w-full">
                {/* Logo or Chats tab */}
                <button
                    onClick={() => setActiveTab('chats')}
                    className={`relative p-3 rounded-2xl transition duration-300 group cursor-pointer ${
                        activeTab === 'chats'
                            ? 'bg-[#0099ff]/10 text-[#0099ff]'
                            : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-white'
                    }`}
                >
                    <MessageSquare size={24} className="stroke-[2.2]" />
                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-white/5 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-55 shadow-xl">
                        Chats
                    </div>
                </button>

                {/* People tab */}
                <button
                    onClick={() => setActiveTab('people')}
                    className={`relative p-3 rounded-2xl transition duration-300 group cursor-pointer ${
                        activeTab === 'people'
                            ? 'bg-[#0099ff]/10 text-[#0099ff]'
                            : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-white'
                    }`}
                >
                    <Users size={24} className="stroke-[2.2]" />
                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-white/5 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-55 shadow-xl">
                        Active Now
                    </div>
                </button>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col items-center space-y-4 w-full">
                {/* Settings Button */}
                <button
                    onClick={openDrawer}
                    className="relative p-3 rounded-2xl text-neutral-400 hover:bg-neutral-800/40 hover:text-white transition duration-300 group cursor-pointer"
                >
                    <Settings size={24} className="stroke-[2.2]" />
                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-white/5 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-55 shadow-xl">
                        Settings
                    </div>
                </button>

                {/* Log out Button */}
                <button
                    onClick={handleLogout}
                    className="relative p-3 rounded-2xl text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition duration-300 group cursor-pointer"
                >
                    <LogOut size={24} className="stroke-[2.2]" />
                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-white/5 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-55 shadow-xl">
                        Log Out
                    </div>
                </button>

                {/* Profile Pic triggering Settings Drawer */}
                <div className="w-10 h-10 border-t border-white/5 pt-2 flex items-center justify-center">
                    <button
                        onClick={openDrawer}
                        className="relative w-9 h-9 rounded-full overflow-hidden hover:scale-105 active:scale-95 transition-transform duration-300 ring-2 ring-white/10 hover:ring-[#0099ff] cursor-pointer"
                    >
                        {user?.profilePic ? (
                            <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-[#0099ff] to-[#a033ff] flex items-center justify-center text-white text-xs font-bold font-sans uppercase">
                                {user?.username?.[0] || '?'}
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[#0b0c10] rounded-full"></span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavSidebar;
