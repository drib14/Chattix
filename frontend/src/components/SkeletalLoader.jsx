import { motion } from 'framer-motion';

export default function SkeletalLoader() {
  return (
    <div className="flex h-screen bg-chattix-bg p-4 gap-4">
      {/* Sidebar Skeleton */}
      <div className="w-80 glass clay-card flex flex-col p-4">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-6 p-2">
          <motion.div
            className="w-12 h-12 rounded-full bg-gray-200"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div
            className="h-6 w-32 bg-gray-200 rounded-md"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
          />
        </div>

        {/* Search Skeleton */}
        <motion.div
          className="h-10 w-full bg-gray-200 rounded-xl mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        />

        {/* Chat List Skeleton */}
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <motion.div
                className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              />
              <div className="flex-1">
                <motion.div
                  className="h-4 w-24 bg-gray-200 rounded mb-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 + 0.1 }}
                />
                <motion.div
                  className="h-3 w-40 bg-gray-200 rounded"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 + 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Skeleton */}
      <div className="flex-1 glass clay-card flex flex-col">
        {/* Chat Header Skeleton */}
        <div className="h-20 border-b border-gray-100/50 p-4 flex items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-full bg-gray-200"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div
            className="h-5 w-32 bg-gray-200 rounded-md"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
          />
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-6 flex flex-col gap-6 justify-end">
          <motion.div
            className="h-12 w-1/3 bg-gray-200 rounded-2xl rounded-tl-sm self-start"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div
            className="h-16 w-1/2 bg-gray-200 rounded-2xl rounded-tr-sm self-end"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
          />
          <motion.div
            className="h-10 w-1/4 bg-gray-200 rounded-2xl rounded-tl-sm self-start"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
          />
        </div>

        {/* Input Skeleton */}
        <div className="p-4 border-t border-gray-100/50">
          <motion.div
            className="h-12 w-full bg-gray-200 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}
