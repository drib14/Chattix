import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ArrowLeft, Send } from 'lucide-react';

const ChattixLogo = () => (
    <div className="flex flex-col items-center justify-center select-none">
        <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#aa3bff] to-[#06b6d4] rounded-3xl blur-xl opacity-30 group-hover:opacity-55 transition duration-500 scale-110"></div>
            
            <svg viewBox="0 0 100 100" className="w-20 h-20 transition-transform duration-300 group-hover:scale-105 relative z-10">
                <defs>
                    <linearGradient id="purpleCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#aa3bff" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <rect x="5" y="5" width="90" height="90" rx="24" fill="#0d0e12" stroke="url(#purpleCyanGrad)" strokeWidth="1.5" />
                <path d="M 50 15 C 27 15 15 27 15 48 C 15 62 21 72 32 78 L 28 88 L 40 84 C 43 85 47 85 50 85 C 73 85 85 73 85 48 C 85 27 73 15 50 15 Z" 
                      fill="none" stroke="url(#purpleCyanGrad)" strokeWidth="4.5" filter="url(#neonGlow)" />
                <path d="M 62 38 C 58 34 53 32 46 32 C 34 32 28 41 28 50 C 28 59 34 68 46 68 C 53 68 58 66 62 62" 
                      fill="none" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" filter="url(#neonGlow)" />
                <circle cx="58" cy="50" r="5" fill="#06b6d4" filter="url(#neonGlow)" />
            </svg>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent animate-pulse">
            Chattix
        </h1>
        <p className="mt-1 text-sm text-neutral-400 font-medium">Be together, whenever.</p>
    </div>
);

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useAuthStore((state) => state.login);

    // Forgot password wizard state
    const [view, setView] = useState('login'); // 'login' | 'forgot_email' | 'forgot_otp'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: { 'Content-type': 'application/json' },
                withCredentials: true,
            };

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                { email, password },
                config
            );

            toast.success('Welcome back to Chattix!');
            login(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const config = {
                headers: { 'Content-type': 'application/json' },
                withCredentials: true,
            };

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
                { email },
                config
            );

            toast.success(data.message || 'Verification code sent to your email!');
            setView('forgot_otp');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error('Please enter the 6-digit security code');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const config = {
                headers: { 'Content-type': 'application/json' },
                withCredentials: true,
            };

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
                { email, otp, newPassword },
                config
            );

            toast.success(data.message || 'Password reset successfully!');
            setView('login');
            setPassword('');
            setOtp('');
            setNewPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed. Incorrect/expired OTP.');
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
                    <ChattixLogo />
                </div>

                <AnimatePresence mode="wait">
                    {view === 'login' && (
                        <motion.div
                            key="login-view"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="space-y-3">
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

                                <div className="flex justify-end pr-1">
                                    <button
                                        type="button"
                                        onClick={() => setView('forgot_email')}
                                        className="text-xs font-semibold text-[#0099ff] hover:text-[#33adff] hover:underline transition cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3 px-4 rounded-2xl text-white font-semibold text-sm bg-gradient-to-r from-[#0099ff] via-[#6633ff] to-[#a033ff] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#0099ff]/20 disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </div>
                            </form>

                            <div className="text-center mt-6">
                                <Link to="/register" className="text-sm font-semibold text-neutral-400 hover:text-white transition">
                                    Don't have an account? <span className="text-[#0099ff]">Create one</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {view === 'forgot_email' && (
                        <motion.div
                            key="forgot-email-view"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white">Reset password</h3>
                                <p className="text-xs text-neutral-400 mt-1">Enter your registered email to get a security verification code.</p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSendOTP}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-800/40 text-white placeholder-neutral-500 border border-white/5 focus:outline-none focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/20 transition-all sm:text-sm"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3 px-4 rounded-2xl text-white font-semibold text-sm bg-gradient-to-r from-[#0099ff] to-[#a033ff] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#0099ff]/10"
                                    >
                                        {loading ? 'Sending code...' : 'Send Verification Code'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>Back to Sign In</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {view === 'forgot_otp' && (
                        <motion.div
                            key="forgot-otp-view"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white">Enter security code</h3>
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                    We sent a 6-digit verification code to <span className="text-[#0099ff] font-medium">{email}</span>. Please verify your email inbox or check server console outputs.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleResetPassword}>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000 000"
                                            className="w-full py-3 rounded-2xl bg-neutral-800/40 text-white placeholder-neutral-600 border border-white/5 focus:outline-none focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/20 text-center tracking-[8px] text-lg font-bold transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                                            <KeyRound size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-800/40 text-white placeholder-neutral-500 border border-white/5 focus:outline-none focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/20 transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3 px-4 rounded-2xl text-white font-semibold text-sm bg-gradient-to-r from-[#0099ff] to-[#a033ff] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#0099ff]/10"
                                    >
                                        {loading ? 'Resetting password...' : 'Reset Password'}
                                    </button>

                                    <div className="flex justify-between items-center px-1">
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot_email')}
                                            className="text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                                        >
                                            Change email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setView('login')}
                                            className="text-xs font-semibold text-[#0099ff] hover:text-[#33adff] hover:underline transition cursor-pointer"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LoginPage;
