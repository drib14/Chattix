import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, KeyRound } from 'lucide-react';

const MessengerLogo = () => (
    <div className="flex flex-col items-center justify-center select-none">
        <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0099FF] via-[#A033FF] to-[#FF7061] rounded-full blur-xl opacity-30 group-hover:opacity-55 transition duration-500 scale-110"></div>
            <svg viewBox="0 0 28 28" className="w-20 h-20 filter drop-shadow-[0_4px_12px_rgba(0,198,255,0.3)] transition-transform duration-300 group-hover:scale-105 relative z-10">
                <defs>
                    <linearGradient id="messengerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0099FF" />
                        <stop offset="30%" stopColor="#A033FF" />
                        <stop offset="60%" stopColor="#FF5280" />
                        <stop offset="90%" stopColor="#FF7061" />
                    </linearGradient>
                </defs>
                <path
                    fill="url(#messengerGrad)"
                    d="M14 2C7.373 2 2 6.942 2 13.031c0 3.486 1.745 6.586 4.477 8.571a.82.82 0 0 1 .284.648l-.008 1.956c-.004.88.948 1.458 1.714.996l2.257-1.358a.936.936 0 0 1 .593-.146c.866.12 1.76.184 2.683.184 6.627 0 12-4.942 12-11.031C26 6.942 20.627 2 14 2zm5.792 9.53-2.993 4.747a1.218 1.218 0 0 1-1.696.408l-2.482-1.654a.488.488 0 0 0-.542.007l-3.325 2.502c-.595.448-1.378-.26-.98-.893l2.993-4.748a1.218 1.218 0 0 1 1.696-.407l2.482 1.653c.17.114.394.112.562-.006l3.305-2.5c.594-.45 1.378.258.98.892z"
                />
            </svg>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
            Chattix
        </h1>
        <p className="mt-1 text-sm text-neutral-400 font-medium">Create a new Chattix account</p>
    </div>
);

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: { 'Content-type': 'application/json' },
                withCredentials: true,
            };

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                { username, email, password },
                config
            );

            toast.success('Registration successful! Welcome to Chattix.');
            login(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Try a different username/email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex w-full h-full min-h-screen justify-center items-center bg-[#090a0f] overflow-hidden px-4 select-none">
            {/* Animated backdrop gradient lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0099ff]/10 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#a033ff]/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md p-8 z-10 bg-neutral-900/60 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl relative">
                {/* Header logo area */}
                <div className="mb-8">
                    <MessengerLogo />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-800/40 text-white placeholder-neutral-500 border border-white/5 focus:outline-none focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/20 transition-all sm:text-sm"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-800/40 text-white placeholder-neutral-500 border border-white/5 focus:outline-none focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/20 transition-all sm:text-sm"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                                    <KeyRound size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-800/40 text-white placeholder-neutral-500 border border-white/5 focus:outline-none focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/20 transition-all sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 rounded-2xl text-white font-semibold text-sm bg-gradient-to-r from-[#0099ff] via-[#6633ff] to-[#a033ff] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#0099ff]/20 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-sm font-semibold text-neutral-400 hover:text-white transition">
                            Already have an account? <span className="text-[#0099ff]">Sign in</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;
