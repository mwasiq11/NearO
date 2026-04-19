import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentConversation,
  addMessage,
  setMessages,
  markAsRead,
  createConversation,
  setConversations,
} from '@/store/slices/chatSlice';
import { Conversation, Message, ServiceListing } from '@/models/types';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useSounds } from '@/hooks/useSounds';
import { toast } from 'sonner';

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { playMessageReceived } = useSounds();
  const { conversations, currentConversation, messages, isLoading } = useAppSelector(
    state => state.chat
  );
  const { user } = useAppSelector(state => state.auth);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  // Track which conversations have already been loaded to avoid redundant fetches
  const loadedConversationsRef = useRef<Set<string>>(new Set());

  const mapConversation = useCallback((conv: any): Conversation => {
    const defaultReputation = {
      overall: 0,
      totalReviews: 0,
      reliabilityScore: 0,
      responseRate: 100,
      completionRate: 100,
      badge: 'new' as const,
      recentTrend: 'stable' as const,
    };
    const buildUser = (id: string, name: string, email: string, picture?: string) => ({
      id,
      name,
      email,
      role: 'user' as const,
      isVerified: true,
      createdAt: new Date().toISOString(),
      reputation: defaultReputation,
      profilePicture: picture,
    });

    // Store additional fields from backend for easy access
    const conversationWithExtras = {
      id: conv.id,
      participants: [conv.seeker_id, conv.provider_id],
      participantDetails: [
        buildUser(conv.seeker_id, conv.seeker_name || 'Seeker', conv.seeker_email || '', conv.seeker_picture),
        buildUser(conv.provider_id, conv.provider_name || 'Provider', conv.provider_email || '', conv.provider_picture),
      ],
      unreadCount: conv.unread_count || 0, // Get unread count from backend
      listingId: conv.service_id || undefined,
      createdAt: conv.created_at || new Date().toISOString(),
      updatedAt: conv.updated_at || new Date().toISOString(),
      // Additional fields for UI (not in Conversation type but useful)
      seeker_id: conv.seeker_id,
      provider_id: conv.provider_id,
      seeker_name: conv.seeker_name,
      seeker_email: conv.seeker_email,
      seeker_picture: conv.seeker_picture,
      provider_name: conv.provider_name,
      provider_email: conv.provider_email,
      provider_picture: conv.provider_picture,
      service_title: conv.service_title,
      last_message_at: conv.last_message_at,
      last_message_preview: conv.last_message_preview,
    };

    return conversationWithExtras as any;
  }, []);

  const mapMessage = useCallback((msg: any): Message => {
    return {
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content || '',
      type: msg.message_type || 'text',
      isRead: msg.status === 'read',
      createdAt: msg.created_at || new Date().toISOString(),
      // Additional fields
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      fileSize: msg.file_size,
      fileType: msg.file_type,
      duration: msg.duration,
      senderName: msg.sender_name,
      senderPicture: msg.sender_picture,
    } as any;
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        const data = await api.get<{ conversations: any[] }>('/messages/conversations', { auth: true });
        dispatch(setConversations(data.conversations.map(mapConversation)));
      } catch {
        // Keep UI usable without blocking
      }
    };

    loadConversations();
  }, [dispatch, mapConversation, user]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socketRef.current = socket;

    const handleReceived = ({ message }: { message: any }) => {
      dispatch(addMessage(mapMessage(message)));
      // Play sound if message is incoming (not from self)
      if (message.sender_id !== user.id) {
        playMessageReceived();
      }
    };

    const handleUserStatus = ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    socket.on('message:received', handleReceived);
    socket.on('message:sent', handleReceived);
    socket.on('user:status', handleUserStatus);

    return () => {
      socket.off('message:received', handleReceived);
      socket.off('message:sent', handleReceived);
      socket.off('user:status', handleUserStatus);
    };
  }, [dispatch, mapMessage, user]);

  // Get unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  // Get messages for current conversation
  const currentMessages = useMemo(() => {
    if (!currentConversation) return [];
    return messages[currentConversation.id] || [];
  }, [currentConversation, messages]);

  // Get the other participant in a conversation
  const getOtherParticipant = useCallback((conversation: Conversation): string => {
    if (!user) return '';
    return conversation.participants.find(p => p !== user.id) || '';
  }, [user]);

  const openConversation = useCallback(async (conversation: Conversation) => {
    dispatch(setCurrentConversation(conversation));
    
    // Mark conversation as read on the backend
    if (conversation.unreadCount > 0) {
      try {
        await api.put(`/messages/${conversation.id}/read`, {}, { auth: true });
        dispatch(markAsRead(conversation.id));
      } catch (err) {
        console.error('Failed to mark conversation as read:', err);
      }
    }
    
    const socket = socketRef.current;
    if (socket) {
      socket.emit('conversation:join', { conversationId: conversation.id });
    }
  }, [dispatch]);

  const closeConversation = useCallback(() => {
    dispatch(setCurrentConversation(null));
  }, [dispatch]);

  const sendMessage = useCallback((content: string, type: Message['type'] = 'text') => {
    if (!user || !currentConversation) return;
    const socket = socketRef.current;
    if (!socket) return;

    const receiverId = currentConversation.participants.find(p => p !== user.id);
    socket.emit('message:send', {
      conversationId: currentConversation.id,
      receiverId,
      content,
      type,
    });
  }, [currentConversation, user]);

  const startConversation = useCallback((
    otherUserId: string,
    listing?: ServiceListing,
    initialMessage?: string
  ) => {
    if (!user) return null;
    
    // Check if conversation already exists
    const existing = conversations.find(
      c => c.participants.includes(user.id) && c.participants.includes(otherUserId)
    );
    
    if (existing) {
      dispatch(setCurrentConversation(existing));
      const socket = socketRef.current;
      if (socket) {
        socket.emit('conversation:join', { conversationId: existing.id });
      }
      if (initialMessage) {
        sendMessage(initialMessage);
      }
      return existing;
    }
    
    const socket = socketRef.current;
    if (!socket) return null;

    socket.emit('message:send', {
      receiverId: otherUserId,
      content: initialMessage || '',
      seekerId: user.id,
      providerId: listing?.providerId || otherUserId,
      serviceId: listing?.id,
    });

    const newConversation: Conversation = {
      id: `pending-${Date.now()}`,
      participants: [user.id, otherUserId],
      unreadCount: 0,
      listingId: listing?.id,
      listing,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(createConversation(newConversation));
    dispatch(setCurrentConversation(newConversation));
    socket.emit('conversation:join', { conversationId: newConversation.id });

    if (initialMessage) {
      dispatch(addMessage({
        id: `pending-msg-${Date.now()}`,
        conversationId: newConversation.id,
        senderId: user.id,
        content: initialMessage,
        type: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
      }));
    }

    return newConversation;
  }, [dispatch, user, conversations]);

  const getConversationById = useCallback((id: string): Conversation | undefined => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const loadMessages = useCallback(async (conversationId: string, force = false) => {
    // Skip if already loaded and not forced
    if (!force && loadedConversationsRef.current.has(conversationId)) {
      return;
    }
    try {
      const data = await api.get<{ messages: any[] }>(`/messages/${conversationId}`, { auth: true });
      // Use setMessages to replace all at once — avoids duplicate pushes
      dispatch(setMessages({
        conversationId,
        messages: data.messages.map(mapMessage),
      }));
      loadedConversationsRef.current.add(conversationId);
      const socket = socketRef.current;
      if (socket) {
        socket.emit('conversation:join', { conversationId });
      }
    } catch {
      toast.error('Failed to load messages');
    }
  }, [dispatch, mapMessage]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    conversations,
    currentConversation,
    currentMessages,
    isLoading,
    totalUnread,
    openConversation,
    closeConversation,
    sendMessage,
    startConversation,
    getOtherParticipant,
    getConversationById,
    loadMessages,
    isUserOnline,
  };
};
