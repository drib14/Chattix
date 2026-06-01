import { motion } from 'framer-motion';

export const ChatSkeleton = () => {
    return (
        <div className="flex items-center p-3 w-full">
            <motion.div
                className="w-12 h-12 rounded-full bg-[var(--color-bg-dark-hover)] flex-shrink-0"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className="ml-3 flex-1">
                <motion.div
                    className="h-4 bg-[var(--color-bg-dark-hover)] rounded w-3/4 mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div
                    className="h-3 bg-[var(--color-bg-dark-hover)] rounded w-1/2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
            </div>
        </div>
    );
};

export const MessageSkeleton = ({ isOwn }: { isOwn?: boolean }) => {
    return (
        <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && (
                <motion.div
                    className="w-8 h-8 rounded-full bg-[var(--color-bg-dark-hover)] mr-2 flex-shrink-0"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}
            <motion.div
                className={`h-10 rounded-2xl w-48 bg-[var(--color-bg-dark-hover)] ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            />
        </div>
    );
};