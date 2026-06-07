export const translations = {
  en: {
    chats: 'Chats',
    groups: 'Groups',
    friends: 'Friends',
    settings: 'Settings',
    search: 'Search...',
    typeMessage: 'Message',
    typing: 'is typing...',
    online: 'Online',
    offline: 'Offline',
    lastSeen: 'Last seen',
    lastSeenToday: 'Last seen today at',
    lastSeenYesterday: 'Last seen yesterday at',
    justNow: 'Last seen just now',
    ago: 'ago',
    minutes: 'minutes',
    minute: 'minute',
    archiveChat: 'Archive Chat',
    unarchiveChat: 'Unarchive Chat',
    archivedChats: 'Archived Chats',
    forward: 'Forward',
    delete: 'Delete',
    reply: 'Reply',
    copy: 'Copy',
    star: 'Star',
    edit: 'Edit',
    pin: 'Pin',
    poll: 'Poll',
    createPoll: 'Create Poll',
    wallpapers: 'Chat Wallpaper',
    language: 'Language',
  },
};

export const t = (key, lang = 'en') => {
  return translations[lang]?.[key] || translations['en'][key] || key;
};
