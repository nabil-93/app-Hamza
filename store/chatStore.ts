import { create } from "zustand";
import type { ChatMessage } from "@services/supabase";

export interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatState {
  messages: LocalMessage[];
  isTyping: boolean;
  isLoading: boolean;

  setMessages: (messages: LocalMessage[]) => void;
  addMessage: (message: LocalMessage) => void;
  updateLastMessage: (content: string) => void;
  setTyping: (typing: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  fromSupabase: (msgs: ChatMessage[]) => LocalMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  isLoading: false,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
          isTyping: false,
        };
      }
      return { messages };
    }),

  setTyping: (typing) => set({ isTyping: typing }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),

  fromSupabase: (msgs) =>
    msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
    })),
}));
