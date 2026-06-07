import { MessageSquare, Users, UserPlus, UsersRound } from 'lucide-react';

const MobileNav = ({ activeTab, setActiveTab, badges = {} }) => {
  const items = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'requests', icon: UserPlus, label: 'Req' },
    { id: 'groups', icon: UsersRound, label: 'Groups' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch justify-between max-w-lg mx-auto px-0.5">
        {items.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id;
          const badge = badges[id] || 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 max-w-[20%] transition-colors ${
                active ? 'text-chattix-primary' : 'text-gray-500'
              }`}
            >
              <span className="relative inline-flex">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium truncate max-w-full px-0.5">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
