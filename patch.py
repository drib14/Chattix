import re
import os

path = r"c:\Users\jhond\Documents\Chattix\frontend\src\components\ChatBubble.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Story Mention (Messenger style + Layout)
# We find the block for story_mention
story_mention_pattern = r"(if \(message\.systemMessageType === 'story_mention'\) \{\s*const storyObj = .*?\s*const isStoryActive = !!storyObj;\s*)(return \([\s\S]*?;\s*\n\s*\})"
story_mention_replacement = r"""\1return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col mb-2 group relative min-w-0 ${showMenu || showReactions ? 'z-50' : 'z-10'}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={`flex items-end gap-1 ${isOwn ? 'justify-end flex-row-reverse' : 'justify-start flex-row'}`}>
            <div className={`flex gap-2 max-w-[min(85%,300px)] sm:max-w-[80%] min-w-0 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 self-end mb-1">
                <img src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.fullName || 'User')}&background=3B82F6&color=fff&bold=true`} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              </div>
              
              <div className="relative min-w-0 flex flex-col">
                <div 
                  className={`rounded-2xl overflow-hidden shadow-sm flex flex-col w-56 cursor-pointer border ${isOwn ? 'bg-chattix-primary border-chattix-primary rounded-br-sm text-white' : 'bg-gray-100 border-gray-200 rounded-bl-sm text-black'}`}
                  onClick={() => isStoryActive && setSearchParams(prev => { prev.set('story', message.storyId); return prev; })}
                >
                  {isStoryActive ? (
                    <>
                      <div className="h-48 relative bg-black/10 overflow-hidden flex items-center justify-center">
                        {(!storyObj.textMode && storyObj.mediaUrl) && (
                          <div 
                            className="absolute inset-0 blur-lg scale-110 opacity-60" 
                            style={{ backgroundImage: `url(${storyObj.mediaUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
                          />
                        )}
                        {!storyObj.textMode && storyObj.mediaUrl ? (
                          storyObj.mediaType === 'video' ? (
                            <>
                              <video src={storyObj.mediaUrl} className="relative z-10 w-full h-full object-contain" />
                              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                                <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white pl-1 border border-white/40">
                                  ▶
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={storyObj.mediaUrl} className="relative z-10 w-full h-full object-contain" alt="" />
                          )
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center p-4 ${storyObj.backgroundColor}`}>
                            <p className={`text-center text-sm font-bold truncate px-2 ${storyObj.fontColor} ${storyObj.fontFamily}`}>
                              {storyObj.caption}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5 flex flex-col">
                        <p className="text-[13px] font-semibold leading-tight">
                          Mentioned you in their story
                        </p>
                        <p className={`text-[11px] mt-0.5 uppercase tracking-wider font-bold ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                          View Story
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center p-4 text-center bg-gray-100 border-b border-gray-200">
                      <Star size={20} className="text-gray-400 mb-2" />
                      <p className="text-[13px] font-semibold text-gray-500 leading-tight">Story Unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hover Tool Strip */}
            <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-0'} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <button
                type="button"
                onClick={() => { setShowReactions((v) => !v); setShowMenu(false); }}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors bg-white shadow-sm"
                title="React"
              >
                <Smile size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowMenu(true); }}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors bg-white shadow-sm"
                title="More"
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden flex ${isOwn ? 'justify-end pr-8' : 'justify-start pl-8'}`}
              >
                <span className="text-[10px] text-gray-500 whitespace-nowrap block pt-1">
                  {formatTime(message.createdAt)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );}"""
content = re.sub(story_mention_pattern, story_mention_replacement, content, flags=re.MULTILINE)

# 2. Update Normal Message Layout
normal_msg_start = r"className={`flex mb-1 group relative \${isOwn \? 'justify-end' : 'justify-start'} min-w-0 \${showMenu \|\| showReactions \? 'z-50' : 'z-10'}`}\s*onMouseEnter=\{\(\) => setIsHovered\(true\)\}\s*onMouseLeave=\{\(\) => setIsHovered\(false\)\}\s*>\s*<div className={`flex gap-2 max-w-\[min\(85%,280px\)\] sm:max-w-\[80%\] min-w-0 \${isOwn \? 'flex-row-reverse' : 'flex-row'}`}"
normal_msg_start_rep = r"""className={`flex flex-col mb-1 group relative min-w-0 ${showMenu || showReactions ? 'z-50' : 'z-10'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-end gap-1 ${isOwn ? 'justify-end flex-row-reverse' : 'justify-start flex-row'}`}>
        <div className={`flex gap-2 max-w-[min(85%,280px)] sm:max-w-[80%] min-w-0 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}"""
content = re.sub(normal_msg_start, normal_msg_start_rep, content, flags=re.MULTILINE)

# 3. Remove old timestamp formatting
old_timestamp = r"<AnimatePresence>\s*\{isHovered && \(\s*<motion\.span\s*initial=\{\{ opacity: 0, y: -5 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*exit=\{\{ opacity: 0, y: -5 \}\}\s*className=\"text-\[10px\] bg-black/60 text-white px-1\.5 py-0\.5 rounded shadow-sm absolute -top-5 whitespace-nowrap\"\s*>\s*\{formatTime\(message\.createdAt\)\}\s*</motion\.span>\s*\)\}\s*</AnimatePresence>"
content = re.sub(old_timestamp, "", content)

# 4. Modify Hover Tool Strip
hover_tool_strip = r"className={`hidden sm:flex items-center gap-1 transition-opacity duration-200 \${isHovered \? 'opacity-100' : 'opacity-0'} \${isOwn \? 'mr-1 flex-row-reverse' : 'ml-1 flex-row'}`}"
hover_tool_strip_rep = r"className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-0'} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}"
content = re.sub(hover_tool_strip, hover_tool_strip_rep, content)

# 5. Add timestamp at the bottom (replace final closing tags)
end_tags = r"(</AnimatePresence>\s*</div>\s*</div>\s*)(</motion\.div>\s*);\s*\};)"
end_tags_rep = r"""\1</div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden flex ${isOwn ? 'justify-end pr-10' : 'justify-start pl-10'}`}
          >
            <span className="text-[10px] text-gray-500 whitespace-nowrap block pt-1">
              {formatTime(message.createdAt)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    \2"""
content = re.sub(end_tags, end_tags_rep, content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied.")
