import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckCircle } from 'lucide-react';
import { friendService } from '../services/friendService';
import { groupService } from '../services/groupService';
import { messageService } from '../services/messageService';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const ForwardModal = ({ isOpen, onClose, messageToForward }) => {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedIds([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, gData] = await Promise.all([
        friendService.getFriends(),
        groupService.getUserGroups()
      ]);
      setFriends(Array.isArray(fData) ? fData : []);
      setGroups(Array.isArray(gData) ? gData : []);
    } catch {
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    if (!selectedIds.length || !messageToForward?._id) return;
    setForwarding(true);
    let success = 0;
    try {
      for (const id of selectedIds) {
        try {
          await messageService.forwardMessage(messageToForward._id, id);
          success++;
        } catch { /* skip */ }
      }
      if (success > 0) toast.success(`Message forwarded to ${success} chat(s)`);
      else toast.error('Failed to forward message');
      onClose();
    } catch {
      toast.error('Forwarding failed');
    } finally {
      setForwarding(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filtered = [...friends, ...groups].filter(item => {
    const name = item.fullName || item.groupName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Forward Message</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends or groups..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-chattix-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No friends or groups found</div>
            ) : (
              <div className="space-y-1">
                {filtered.map((item) => {
                  const id = item._id;
                  const isSelected = selectedIds.includes(id);
                  const name = item.fullName || item.groupName;
                  const avatar = item.avatar || item.groupAvatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(name || 'U')}`;
                  
                  return (
                    <button
                      key={id}
                      onClick={() => toggleSelect(id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <span className="font-medium text-sm text-gray-900">{name}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-chattix-primary border-chattix-primary text-white' : 'border-gray-300'}`}>
                        {isSelected && <CheckCircle size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleForward}
              disabled={forwarding || selectedIds.length === 0}
              className="px-6 py-2 bg-chattix-primary text-white rounded-full font-medium text-sm disabled:opacity-50 transition-opacity hover:bg-chattix-primary-dark"
            >
              {forwarding ? 'Sending...' : 'Forward'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ForwardModal;
