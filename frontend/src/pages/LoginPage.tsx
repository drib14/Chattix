import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
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
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error Occurred');
        }
    };

    return (
        <div className="flex w-full h-full justify-center items-center bg-[var(--color-bg-dark)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-[var(--color-bg-dark-secondary)] rounded-xl shadow-lg border border-[var(--color-border-dark)]">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-white">Chattix</h2>
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

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
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
            </div>
        </div>
    );
};

export default LoginPage;