import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { useAuth } from './AuthContext';
import { sounds } from '../utils/sound';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [channels, setChannels] = useState([]);
  const [activeType, setActiveType] = useState('channel'); // 'channel' | 'direct'
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeDirectUser, setActiveDirectUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { [userId]: username }
  const [unreadCounts, setUnreadCounts] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(sounds.isSoundEnabled());

  // Ref to track active state in socket listeners without stale closures
  const activeRef = useRef({ activeType, activeChannel, activeDirectUser });
  useEffect(() => {
    activeRef.current = { activeType, activeChannel, activeDirectUser };
  }, [activeType, activeChannel, activeDirectUser]);

  // Fetch channels list
  const fetchChannels = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/channels');
      setChannels(res.data);
      // If no active channel selected, select first channel
      if (!activeChannel && !activeDirectUser && res.data.length > 0) {
        setActiveType('channel');
        setActiveChannel(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  }, [user, activeChannel, activeDirectUser]);

  // Fetch all users for direct messaging
  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/users');
      setAllUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [user]);

  // Fetch messages for active channel or direct message
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      if (activeType === 'channel' && activeChannel) {
        const res = await axios.get(`/api/messages/channel/${activeChannel._id}`);
        setMessages(res.data);
        // Clear unread
        setUnreadCounts((prev) => ({ ...prev, [activeChannel._id]: 0 }));
      } else if (activeType === 'direct' && activeDirectUser) {
        const res = await axios.get(`/api/messages/direct/${activeDirectUser._id}`);
        setMessages(res.data);
        // Clear unread
        setUnreadCounts((prev) => ({ ...prev, [activeDirectUser._id]: 0 }));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [user, activeType, activeChannel, activeDirectUser]);

  // Initial data load when user logs in
  useEffect(() => {
    if (user) {
      fetchChannels();
      fetchUsers();
    } else {
      setChannels([]);
      setMessages([]);
      setActiveChannel(null);
      setActiveDirectUser(null);
      setTypingUsers({});
      setUnreadCounts({});
    }
  }, [user]);

  // Load messages whenever active chat changes
  useEffect(() => {
    fetchMessages();
    setTypingUsers({});
  }, [activeType, activeChannel?._id, activeDirectUser?._id]);

  // Join channel room on socket when active channel changes
  useEffect(() => {
    if (activeType === 'channel' && activeChannel?._id) {
      socket.emit('channel:join', { channelId: activeChannel._id });
      return () => {
        socket.emit('channel:leave', { channelId: activeChannel._id });
      };
    }
  }, [activeType, activeChannel?._id]);

  // Set up real-time Socket.IO event handlers
  useEffect(() => {
    if (!user) return;

    // Incoming new message
    const handleNewMessage = (newMsg) => {
      const { activeType: curType, activeChannel: curChannel, activeDirectUser: curDirect } = activeRef.current;
      const isSender = newMsg.sender?._id === user._id || newMsg.sender === user._id;

      let isCurrentChat = false;
      if (curType === 'channel' && curChannel && newMsg.channel === curChannel._id) {
        isCurrentChat = true;
      } else if (
        curType === 'direct' &&
        curDirect &&
        !newMsg.channel &&
        (newMsg.sender?._id === curDirect._id || newMsg.recipient?._id === curDirect._id || newMsg.recipient === curDirect._id)
      ) {
        isCurrentChat = true;
      }

      if (isCurrentChat) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      } else {
        // Increment unread count
        const key = newMsg.channel || (isSender ? newMsg.recipient : newMsg.sender?._id);
        if (key && !isSender) {
          setUnreadCounts((prev) => ({
            ...prev,
            [key]: (prev[key] || 0) + 1
          }));
        }
      }

      // Audio notification
      if (!isSender) {
        sounds.playIncoming();
      }
    };

    // Typing updates
    const handleTyping = (data) => {
      const { activeType: curType, activeChannel: curChannel, activeDirectUser: curDirect } = activeRef.current;

      const matchesChannel = curType === 'channel' && curChannel && data.channelId === curChannel._id;
      const matchesDirect = curType === 'direct' && curDirect && (data.fromUserId === curDirect._id || data.recipientId === curDirect._id);

      if (matchesChannel || matchesDirect) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (data.isTyping) {
            next[data.userId || data.fromUserId] = data.username;
          } else {
            delete next[data.userId || data.fromUserId];
          }
          return next;
        });
      }
    };

    // Reaction updates
    const handleReactionUpdated = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === data.messageId) {
            return { ...msg, reactions: data.reactions };
          }
          return msg;
        })
      );
    };

    // Message deleted
    const handleMessageDeleted = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === data.messageId) {
            return { ...msg, isDeleted: true, content: 'This message was deleted', attachment: undefined };
          }
          return msg;
        })
      );
    };

    // Online users list
    const handleOnlineList = (list) => {
      setOnlineUserIds(list);
    };

    // User status update
    const handleUserStatusUpdated = ({ userId, status }) => {
      setAllUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status } : u))
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:update', handleTyping);
    socket.on('message:reaction_updated', handleReactionUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('presence:online_list', handleOnlineList);
    socket.on('user:status_updated', handleUserStatusUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:update', handleTyping);
      socket.off('message:reaction_updated', handleReactionUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('presence:online_list', handleOnlineList);
      socket.off('user:status_updated', handleUserStatusUpdated);
    };
  }, [user]);

  // Actions
  const selectChannel = (channel) => {
    setActiveType('channel');
    setActiveChannel(channel);
    setActiveDirectUser(null);
  };

  const selectDirect = (targetUser) => {
    setActiveType('direct');
    setActiveDirectUser(targetUser);
    setActiveChannel(null);
  };

  const sendMessage = ({ content, attachment, replyToId }) => {
    if (!user) return;

    const payload = {
      senderId: user._id,
      content,
      attachment,
      replyToId,
      channelId: activeType === 'channel' ? activeChannel?._id : null,
      recipientId: activeType === 'direct' ? activeDirectUser?._id : null
    };

    socket.emit('message:send', payload, (res) => {
      if (res?.success) {
        sounds.playSent();
      }
    });
  };

  const sendTyping = (isTyping) => {
    if (!user) return;
    const eventName = isTyping ? 'typing:start' : 'typing:stop';
    socket.emit(eventName, {
      channelId: activeType === 'channel' ? activeChannel?._id : null,
      recipientId: activeType === 'direct' ? activeDirectUser?._id : null,
      username: user.username,
      userId: user._id
    });
  };

  const toggleReaction = (messageId, emoji) => {
    if (!user) return;
    socket.emit('message:react', {
      messageId,
      emoji,
      userId: user._id
    });
  };

  const deleteMessage = (messageId) => {
    if (!user) return;
    socket.emit('message:delete', {
      messageId,
      userId: user._id
    });
  };

  const createChannel = async (name, description, isPrivate) => {
    const res = await axios.post('/api/channels', { name, description, isPrivate });
    const newChan = res.data;
    setChannels((prev) => [...prev, newChan]);
    selectChannel(newChan);
    return newChan;
  };

  const toggleSound = () => {
    const next = sounds.toggleSound();
    setSoundEnabled(next);
  };

  return (
    <ChatContext.Provider
      value={{
        channels,
        activeType,
        activeChannel,
        activeDirectUser,
        messages,
        loadingMessages,
        onlineUserIds,
        allUsers,
        typingUsers,
        unreadCounts,
        soundEnabled,
        selectChannel,
        selectDirect,
        sendMessage,
        sendTyping,
        toggleReaction,
        deleteMessage,
        createChannel,
        toggleSound,
        fetchChannels,
        fetchUsers,
        fetchMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
