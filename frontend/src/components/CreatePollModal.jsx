import { useState } from 'react';
import { X, Plus, Trash2, BarChart3 } from 'lucide-react';
import { messageService } from '../services/messageService';
import toast from 'react-hot-toast';

const CreatePollModal = ({ isOpen, onClose, groupId, onSuccess }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());
    if (filledOptions.length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    setCreating(true);
    try {
      await messageService.createPoll(
        groupId,
        question.trim(),
        filledOptions.map((opt) => opt.trim()),
        allowMultipleVotes
      );
      toast.success('Poll created!');
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultipleVotes(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-chattix-primary" />
            <h3 className="font-semibold text-gray-900">Create Poll</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
              autoFocus
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-1 text-sm text-chattix-primary hover:text-chattix-secondary font-medium"
              >
                <Plus size={16} />
                Add option
              </button>
            )}
          </div>

          {/* Multiple votes */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="multipleVotes"
              checked={allowMultipleVotes}
              onChange={(e) => setAllowMultipleVotes(e.target.checked)}
              className="w-4 h-4 text-chattix-primary rounded border-gray-300 focus:ring-chattix-primary"
            />
            <label
              htmlFor="multipleVotes"
              className="text-sm text-gray-600 select-none cursor-pointer"
            >
              Allow multiple choices
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 bg-chattix-primary text-white rounded-lg text-sm font-medium hover:bg-chattix-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;