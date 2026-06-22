import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { Reply, Share, Trash2 } from 'lucide-react';
import { setReplyingTo, openForwardModal, openDeleteModal } from '../../store/uiSlice';

export default function MessageBubble({ message, isOwn, showAvatar, isConsecutive }) {
  const dispatch = useDispatch();

  const handleReply = () => dispatch(setReplyingTo(message));
  const handleForward = () => dispatch(openForwardModal(message._id));
  const handleDelete = () => dispatch(openDeleteModal(message._id));

  const renderContent = () => {
    if (message.deleted) {
      return <p className="italic text-gray-500">This message was deleted</p>;
    }

    switch (message.type) {
      case 'image':
        return <img src={message.content} alt="Upload" className="max-w-[250px] rounded-lg cursor-pointer hover:opacity-90" />;
      case 'video':
        return <video src={message.content} controls className="max-w-[250px] rounded-lg" />;
      case 'audio':
        return <audio src={message.content} controls className="w-[250px]" />;
      case 'gif':
        return <img src={message.content} alt="GIF" className="max-w-[200px] rounded-lg" />;
      case 'file':
        return (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
            📄 Download File
          </a>
        );
      case 'location':
        return (
          <div className="flex flex-col">
            <img src={message.content} alt="Location Map" className="max-w-[250px] rounded-lg cursor-pointer hover:opacity-90 mb-2" />
            {message.linkPreview && (
              <a href={message.linkPreview.url} target="_blank" rel="noopener noreferrer" className="block bg-white/50 rounded-lg p-2 hover:bg-white/80 transition border border-gray-200 text-gray-800">
                <h5 className="font-bold text-xs truncate">{message.linkPreview.title}</h5>
                {message.linkPreview.description && <p className="text-[10px] text-gray-500 line-clamp-2">{message.linkPreview.description}</p>}
              </a>
            )}
          </div>
        );
      default:
        return (
          <div className="flex flex-col">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.linkPreview && (
              <a href={message.linkPreview.url} target="_blank" rel="noopener noreferrer" className="mt-2 block bg-white/50 rounded-lg p-2 hover:bg-white/80 transition border border-gray-200">
                {message.linkPreview.image && <img src={message.linkPreview.image} alt="Preview" className="w-full h-24 object-cover rounded-md mb-2" />}
                <h5 className="font-bold text-xs truncate text-gray-800">{message.linkPreview.title}</h5>
                {message.linkPreview.description && <p className="text-[10px] text-gray-500 line-clamp-2">{message.linkPreview.description}</p>}
              </a>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex w-full group ${isConsecutive ? 'mb-1' : 'mb-4'} ${isOwn ? 'justify-end' : 'justify-start'}`}>

      {!isOwn && (
        <div className="w-8 h-8 mr-2 self-end flex-shrink-0">
          {showAvatar && (
            <img
              src={message.senderId?.profileImageUrl || '/chattix-logo.png'}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover shadow-sm"
            />
          )}
        </div>
      )}

      <div className={`flex flex-col relative max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Reply Context Banner */}
        {message.replyTo && (
          <div className={`text-xs mb-1 p-1.5 rounded-md bg-white/50 border-l-2 border-chattix-teal text-gray-500 line-clamp-1`}>
            Replying to {message.replyTo.senderId?.firstName}: {message.replyTo.content}
          </div>
        )}

        {/* Forwarded Banner */}
        {message.forwarded && (
          <div className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1 italic">
            <Share className="w-3 h-3" /> Forwarded
          </div>
        )}

        <div className={`relative px-4 py-2 text-[15px] leading-relaxed shadow-sm ${
          isOwn
            ? `bg-chattix-teal text-white rounded-2xl ${isConsecutive ? 'rounded-br-2xl' : 'rounded-br-sm'}`
            : `bg-white text-gray-800 rounded-2xl shadow-clay-card border border-transparent ${isConsecutive ? 'rounded-bl-2xl' : 'rounded-bl-sm'}`
        }`}>
          {renderContent()}

          <span className={`text-[9px] block mt-1 text-right ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>

        {/* Action Menu (Hover) */}
        {!message.deleted && (
          <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${
            isOwn ? 'right-full mr-2' : 'left-full ml-2'
          }`}>
            <button onClick={handleReply} className="p-1.5 bg-white rounded-full shadow-md text-gray-500 hover:text-chattix-teal">
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleForward} className="p-1.5 bg-white rounded-full shadow-md text-gray-500 hover:text-chattix-teal">
              <Share className="w-3.5 h-3.5" />
            </button>
            {isOwn && (
              <button onClick={handleDelete} className="p-1.5 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
