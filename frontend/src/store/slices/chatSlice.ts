import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/models/types';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
      // Mark messages as read
      if (action.payload) {
        const conv = state.conversations.find(c => c.id === action.payload!.id);
        if (conv) {
          conv.unreadCount = 0;
        }
      }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(action.payload);
      
      // Update last message in conversation
      const conv = state.conversations.find(c => c.id === conversationId);
      if (conv) {
        conv.lastMessage = action.payload;
        conv.updatedAt = action.payload.createdAt;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find(c => c.id === action.payload);
      if (conv) {
        conv.unreadCount = 0;
      }
      const messages = state.messages[action.payload];
      if (messages) {
        messages.forEach(m => {
          m.isRead = true;
        });
      }
    },
    createConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
      state.messages[action.payload.id] = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setConversations,
  setCurrentConversation,
  addMessage,
  markAsRead,
  createConversation,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
