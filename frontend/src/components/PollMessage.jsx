import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Check, BarChart3 } from 'lucide-react';
import { messageService } from '../services/messageService';
import toast from 'react-hot-toast';

const PollMessage = ({ message, isGroup }) => {
  const { user } = useSelector((state) => state.auth);
  const [voting, setVoting] = useState(false);

  if (!message.poll) return null;

  const { question, options, totalVotes, allowMultipleVotes } = message.poll;

  const handleVote = async (index) => {
    if (voting) return;

    // Check if already voted for this option
    const option = options[index];
    const hasVoted = option.votes.some(
      (v) => v._id === user._id || v === user._id
    );

    setVoting(true);
    try {
      if (hasVoted) {
        await messageService.unvotePoll(message._id, index);
      } else {
        await messageService.votePoll(message._id, index);
      }
    } catch (error) {
      toast.error('Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const getVoteCount = (option) => {
    return option.votes?.length || 0;
  };

  const getVotePercentage = (option) => {
    if (totalVotes === 0) return 0;
    return Math.round((getVoteCount(option) / totalVotes) * 100);
  };

  const hasUserVoted = (option) => {
    return option.votes?.some(
      (v) => v._id === user._id || v === user._id
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-chattix-primary" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Poll
        </span>
        {allowMultipleVotes && (
          <span className="text-[10px] text-gray-400">(Multiple choice)</span>
        )}
      </div>

      <h4 className="font-semibold text-gray-900 mb-4">{question}</h4>

      <div className="space-y-2">
        {options.map((option, index) => {
          const voted = hasUserVoted(option);
          const percentage = getVotePercentage(option);
          const count = getVoteCount(option);

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={voting}
              className={`w-full relative overflow-hidden rounded-lg p-3 text-left transition-all ${
                voted
                  ? 'bg-chattix-primary/10 border-2 border-chattix-primary'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {/* Progress bar background */}
              {totalVotes > 0 && (
                <div
                  className="absolute inset-0 opacity-10 transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    background: voted
                      ? 'linear-gradient(90deg, #3B82F6, #2563EB)'
                      : 'linear-gradient(90deg, #6B7280, #4B5563)',
                  }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      voted
                        ? 'bg-chattix-primary text-white'
                        : 'border-2 border-gray-300'
                    }`}
                  >
                    {voted && <Check size={14} />}
                  </div>
                  <span className={`text-sm ${voted ? 'font-medium' : ''}`}>
                    {option.text}
                  </span>
                </div>

                {totalVotes > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{count}</span>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        {totalVotes === 0
          ? 'No votes yet'
          : `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'} • ${
              allowMultipleVotes ? 'Multiple choice' : 'Single choice'
            }`}
      </div>
    </div>
  );
};

export default PollMessage;