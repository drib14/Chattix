import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-chattix-bg">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: [0, 0.71, 0.2, 1.01]
        }}
        className="glass p-8 rounded-full clay-card mb-6"
      >
        <motion.img
          src="/chattix-logo.png"
          alt="Chattix Logo"
          className="w-32 h-32 object-contain"
        />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-4xl font-extrabold text-chattix-teal tracking-wider"
      >
        Chattix
      </motion.h1>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 100 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="h-1 bg-chattix-teal-light mt-4 rounded-full"
      />
    </div>
  );
}
