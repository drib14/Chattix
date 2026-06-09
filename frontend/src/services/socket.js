import { io } from 'socket.io-client';

const isNetwork = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const SOCKET_URL = isNetwork ? import.meta.env.VITE_MOBILE_SOCKET_URL : import.meta.env.VITE_SOCKET_URL;

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('connect_error', (error) => {
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  joinRoom(roomId) {
    this.emit('join_room', roomId);
  }

  leaveRoom(roomId) {
    this.emit('leave_room', roomId);
  }

  sendMessage(data) {
    this.emit('send_message', data);
  }

  sendGroupMessage(data) {
    this.emit('send_group_message', data);
  }

  sendTyping(receiverId, isTyping) {
    if (isTyping) {
      this.emit('typing', { receiverId, isTyping: true });
    } else {
      this.emit('stop_typing', { receiverId });
    }
  }

  sendGroupTyping(groupId, isTyping) {
    if (isTyping) {
      this.emit('group_typing', { groupId, isTyping: true });
    } else {
      this.emit('stop_group_typing', { groupId });
    }
  }

  // Poll methods
  onPollUpdated(callback) {
    this.on('poll_updated', callback);
  }

  offPollUpdated(callback) {
    this.off('poll_updated', callback);
  }

  // Online status methods
  onUserStatusUpdate(callback) {
    this.on('user_status_update', callback);
  }

  offUserStatusUpdate(callback) {
    this.off('user_status_update', callback);
  }

  onUserOffline(callback) {
    this.on('user_offline', callback);
  }

  offUserOffline(callback) {
    this.off('user_offline', callback);
  }
}

export default new SocketService();
