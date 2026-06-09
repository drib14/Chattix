import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, Plus, Loader } from 'lucide-react';
import { groupService } from '../services/groupService';
import { addGroup } from '../redux/slices/chatSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GroupsList = ({ searchQuery = '' }) => {
  const { groups } = useSelector((state) => state.chat);
  const friendList = useSelector((state) => state.friend.friends);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ groupName: '', description: '', memberIds: [] });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const groupList = Array.isArray(groups) ? groups : [];
  const availableFriends = Array.isArray(friendList) ? friendList : [];

  const filteredGroupList = groupList.filter(group => {
    if (!searchQuery) return true;
    return group.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (!form.memberIds || form.memberIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }
    setCreating(true);
    try {
      // Backend expects 'members' field, not 'memberIds'
      const group = await groupService.createGroup({
        name: form.groupName,
        members: form.memberIds,
        description: form.description,
      });
      dispatch(addGroup(group));
      setShowForm(false);
      setForm({ groupName: '', description: '', memberIds: [] });
      toast.success('Group created successfully!');
    } catch (error) {
      console.error('Group creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const toggleMember = (id) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Groups</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="p-2 rounded-full bg-chattix-primary text-white hover:bg-chattix-primary-dark"
        >
          <Plus size={18} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-3 sm:p-4 border-b border-gray-100 space-y-3 bg-chattix-bg/50 shrink-0">
          <input
            type="text"
            placeholder="Group name"
            value={form.groupName}
            onChange={(e) => setForm({ ...form, groupName: e.target.value })}
            className="modern-input text-sm"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="modern-input text-sm resize-none"
            rows={2}
          />
          <p className="text-xs text-gray-500 font-medium">Add members</p>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {availableFriends.map((f) => (
              <label key={f._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(f._id)}
                  onChange={() => toggleMember(f._id)}
                />
                {f.fullName}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={creating}
            className="button-primary w-full text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {filteredGroupList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Users size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">{searchQuery ? 'No groups found' : 'No groups yet'}</p>
          </div>
        ) : (
          filteredGroupList.map((group) => (
            <button
              key={group._id}
              type="button"
              onClick={() => navigate(`/messages/${group._id}`)}
              className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 text-left min-w-0"
            >
              <img
                src={group.groupAvatar || `https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true&name=${encodeURIComponent(group.groupName || 'G')}`}
                alt={group.groupName}
                className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-gray-900 truncate">{group.groupName}</p>
                <p className="text-xs text-gray-500">{group.members?.length || 0} members</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupsList;
