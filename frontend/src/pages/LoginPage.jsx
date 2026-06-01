import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

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
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                },
                withCredentials: true,
            };

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                { email, password },
                config
            );

            toast.success('Login Successful');
            login(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error Occurred');
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
                headers: {
                    'Content-type': 'application/json',
                },
                withCredentials: true,
            };

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
                { email },
                config
            );

            toast.success(data.message || 'OTP verification code sent!');
            setView('forgot_otp');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit verification code');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                },
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
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full h-full justify-center items-center bg-[var(--color-bg-dark)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-[var(--color-bg-dark-secondary)] rounded-xl shadow-lg border border-[var(--color-border-dark)]">
                {view === 'login' && (
                    <>
                        <div className="text-center flex flex-col items-center">
                            <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(170,59,255,0.25)] mb-3 bg-neutral-900/50 p-1 flex items-center justify-center">
                                <img src="/mascot.png" alt="Chattix Mascot" className="w-full h-full object-cover scale-110" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white">Chattix</h2>
                            <p className="mt-2 text-sm text-[var(--color-text-dark-secondary)]">Sign in to your account</p>
                        </div>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[var(--color-border-dark)] placeholder-[var(--color-text-dark-secondary)] text-white bg-[var(--color-bg-dark)] rounded-t-md focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:z-10 sm:text-sm"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[var(--color-border-dark)] placeholder-[var(--color-text-dark-secondary)] text-white bg-[var(--color-bg-dark)] rounded-b-md focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:z-10 sm:text-sm"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setView('forgot_email')}
                                    className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] cursor-pointer"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                        <div className="text-center mt-4">
                            <Link to="/register" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                                Don't have an account? Register
                            </Link>
                        </div>
                    </>
                )}

                {view === 'forgot_email' && (
                    <>
                        <div className="text-center">
                            <h2 className="mt-6 text-3xl font-extrabold text-white">Reset Password</h2>
                            <p className="mt-2 text-sm text-[var(--color-text-dark-secondary)]">Enter your registered email address</p>
                        </div>
                        <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
                            <div>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-[var(--color-border-dark)] placeholder-[var(--color-text-dark-secondary)] text-white bg-[var(--color-bg-dark)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="w-full text-center py-2 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {view === 'forgot_otp' && (
                    <>
                        <div className="text-center">
                            <h2 className="mt-6 text-3xl font-extrabold text-white">Enter Verification Code</h2>
                            <p className="mt-2 text-xs text-[var(--color-text-dark-secondary)] leading-relaxed">
                                A 6-digit security code was dispatched to <strong className="text-white">{email}</strong>. Please enter the code along with your new password.
                            </p>
                        </div>
                        <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-[var(--color-border-dark)] placeholder-[var(--color-text-dark-secondary)] text-white bg-[var(--color-bg-dark)] text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                                
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-[var(--color-border-dark)] placeholder-[var(--color-text-dark-secondary)] text-white bg-[var(--color-bg-dark)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setView('forgot_email')}
                                    className="w-full text-center py-1 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                                >
                                    Change Email
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
