import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2000); // 2 seconds splash screen

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-dark)]"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center"
                    >
                        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] rounded-3xl shadow-[0_0_40px_rgba(170,59,255,0.4)] flex items-center justify-center mb-6">
                            <span className="text-white font-bold text-4xl">C</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Chattix</h1>
                        <p className="text-[var(--color-text-dark-secondary)] mt-2">Connecting you securely</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;