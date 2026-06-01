import { useState, useEffect } from 'react';
import NavSidebar from '../components/layout/NavSidebar';
import LeftSidebar from '../components/layout/LeftSidebar';
import MainChat from '../components/layout/MainChat';
import RightSidebar from '../components/layout/RightSidebar';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';

const HomePage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'people'
    const [showSaveBanner, setShowSaveBanner] = useState(false);

    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem('chattix_saved_accounts');
            const parsed = saved ? JSON.parse(saved) : [];
            const exists = parsed.some(acc => acc._id === user._id && acc.token === user.token);
            const dismissed = sessionStorage.getItem(`chattix_dismiss_save_${user._id}`);
            
            if (!exists && !dismissed) {
                // Give it a brief delay for transition feel
                const timer = setTimeout(() => {
                    setShowSaveBanner(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [user]);

    const handleSaveAccount = () => {
        if (!user) return;
        const saved = localStorage.getItem('chattix_saved_accounts');
        const parsed = saved ? JSON.parse(saved) : [];
        
        const accData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic || '',
            token: user.token,
        };

        const existsIdx = parsed.findIndex(acc => acc._id === user._id);
        if (existsIdx > -1) {
            parsed[existsIdx] = accData;
        } else {
            parsed.push(accData);
        }

        localStorage.setItem('chattix_saved_accounts', JSON.stringify(parsed));
        setShowSaveBanner(false);
        toast.success('Account successfully registered for quick switching!');
    };

    const handleDismiss = () => {
        if (user) {
            sessionStorage.setItem(`chattix_dismiss_save_${user._id}`, 'true');
        }
        setShowSaveBanner(false);
    };

    return (
        <div className="flex w-full h-full text-white bg-[#0e0f14] overflow-hidden relative">
            {/* Top Prompt Banner to save account */}
            <AnimatePresence>
                {showSaveBanner && (
                    <motion.div
                        initial={{ y: -70, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -70, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
                    >
                        <div className="bg-[#12131a]/90 backdrop-blur-xl border border-white/5 shadow-2xl p-4 rounded-2xl flex items-center justify-between space-x-4 shadow-[#0099ff]/5">
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-[#0099ff]/10 flex items-center justify-center text-[#0099ff] flex-shrink-0">
                                    <ShieldCheck size={20} className="stroke-[2.2]" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Enable Fast Switching?</h4>
                                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate leading-relaxed">
                                        Save your session to this browser to switch accounts instantly next time.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button
                                    onClick={handleSaveAccount}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0099ff] to-[#a033ff] text-white font-bold text-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center space-x-1"
                                >
                                    <Check size={12} className="stroke-[2.5]" />
                                    <span>Save Session</span>
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Narrow far-left sidebar */}
            <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* Chats list or People list primary sidebar */}
            <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* Central chat interface */}
            <MainChat />
            
            {/* Right details sidebar (collapsible on smaller viewports) */}
            <RightSidebar />
        </div>
    );
};

export default HomePage;
