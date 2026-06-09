const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/ChatList.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  "import { MessageSquare, MoreVertical, Archive, ArchiveRestore } from 'lucide-react';",
  "import { MessageSquare, MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react';"
);

content = content.replace(
  "import { setSelectedChat, clearUnread } from '../redux/slices/chatSlice';",
  "import { setSelectedChat, clearUnread, removeRecentChat } from '../redux/slices/chatSlice';"
);

if (!content.includes('import { messageService }')) {
  content = content.replace(
    "import { userService } from '../services/userService';",
    "import { userService } from '../services/userService';\nimport { messageService } from '../services/messageService';"
  );
}

// 2. Add handleDelete
if (!content.includes('const handleDelete =')) {
  const formatTimeIdx = content.indexOf('const formatTime = (date) =>');
  const handleDeleteStr = `
  const handleDelete = async (e, chat) => {
    e.stopPropagation();
    const chatId = chat._id?._id || chat._id;
    if (window.confirm(t('deleteConversationConfirm', language) || 'Are you sure you want to delete this conversation?')) {
      try {
        await messageService.deleteConversation(chatId);
        dispatch(removeRecentChat(chatId));
        if (selectedChat?._id === chatId) {
          navigate('/messages');
        }
        toast.success(t('conversationDeleted', language) || 'Conversation deleted');
        setMenuOpenId(null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete conversation');
      }
    }
  };\n\n  `;
  content = content.slice(0, formatTimeIdx) + handleDeleteStr + content.slice(formatTimeIdx);
}

// 3. DisplayChats logic
content = content.replace(
  `  const displayChats = showArchived
    ? (Array.isArray(recentChats) ? recentChats : []).filter(c => archivedIds.has(c._id?._id?.toString()))
    : (activeTab === 'requests' ? requestsChats : (activeTab === 'blocked' ? blockedChats : messagesChats));`,
  `  const displayChats = activeTab === 'archived'
    ? (Array.isArray(recentChats) ? recentChats : []).filter(c => archivedIds.has(c._id?._id?.toString()))
    : (activeTab === 'requests' ? requestsChats : (activeTab === 'blocked' ? blockedChats : messagesChats));`
);

// 4. Update activeTab === 'messages' to activeTab === 'archived' for Archive state logic
content = content.replace(
  `{showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}`,
  `{activeTab === 'archived' ? <ArchiveRestore size={16} /> : <Archive size={16} />}`
);
content = content.replace(
  `{showArchived ? t('unarchiveChat', language) : t('archiveChat', language)}`,
  `{activeTab === 'archived' ? t('unarchiveChat', language) : t('archiveChat', language)}`
);
content = content.replace(
  `onClick={(e) => handleArchive(e, chat, showArchived)}`,
  `onClick={(e) => handleArchive(e, chat, activeTab === 'archived')}`
);

// 5. Add Delete button to menu
const archiveMenuEndIdx = content.indexOf('</button>', content.indexOf('handleArchive')) + 9;
if (!content.includes('handleDelete(e, chat)')) {
  const deleteBtnStr = `
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, chat)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            {t('delete', language) || 'Delete'}
                          </button>`;
  content = content.slice(0, archiveMenuEndIdx) + deleteBtnStr + content.slice(archiveMenuEndIdx);
}

// 6. Replace showArchived button with actual Tab
content = content.replace(
  `{archivedChats.length > 0 && activeTab === 'messages' && (
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
              <Archive size={16} />
              {t('archivedChats', language)}
            </div>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {archivedChats.length}
            </span>
          </button>
        )}`,
  ``
);

// 7. Add Archived Tab
const requestsTabEnd = content.indexOf('</button>', content.indexOf("setActiveTab('requests')")) + 9;
if (!content.includes("setActiveTab('archived')")) {
  const archivedTabStr = `
        <button
          onClick={() => setActiveTab('archived')}
          className={\`font-medium text-sm pb-1 border-b-2 transition-colors flex items-center gap-1.5 \${
            activeTab === 'archived' ? 'border-chattix-primary text-chattix-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }\`}
        >
          {t('archivedChats', language) || 'Archived'}
          {archivedChats.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold">
              {archivedChats.length}
            </span>
          )}
        </button>`;
  content = content.slice(0, requestsTabEnd) + archivedTabStr + content.slice(requestsTabEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('ChatList patched successfully');
