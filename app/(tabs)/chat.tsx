import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatWithAI } from "@services/openai";
import { saveChatMessage, getChatHistory } from "@services/supabase";
import { useChatStore, type LocalMessage } from "@store/chatStore";
import { useAuthStore } from "@store/authStore";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const SUGGESTED_PROMPTS = [
  "What foods are best for Type 2 diabetes?",
  "How does exercise affect blood sugar?",
  "Explain the glycemic index",
  "Tips for managing dawn phenomenon",
  "What snacks won't spike my glucose?",
  "How to read a CGM graph?",
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, addMessage, updateLastMessage, setMessages, isTyping, setTyping } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const history = await getChatHistory(user.id, 50);
      if (history && history.length > 0) {
        setMessages(
          history.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
          }))
        );
      }
    } catch {}
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    await Haptics.selectionAsync();

    const userMsg: LocalMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    addMessage(userMsg);

    if (user) {
      saveChatMessage({ user_id: user.id, role: "user", content: trimmed }).catch(() => {});
    }

    // Add typing placeholder
    const typingId = (Date.now() + 1).toString();
    addMessage({ id: typingId, role: "assistant", content: "", timestamp: new Date(), isTyping: true });
    setTyping(true);
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = messages
        .filter((m) => !m.isTyping)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatWithAI([...history, { role: "user", content: trimmed }]);
      updateLastMessage(response);

      if (user) {
        saveChatMessage({ user_id: user.id, role: "assistant", content: response }).catch(() => {});
      }
    } catch {
      updateLastMessage("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setTyping(false);
      setIsLoading(false);
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const isEmpty = messages.length === 0;

  return (
    <LinearGradient colors={["#060912", "#0A0E1A", "#070C18"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={["#00FF88", "#00B4FF"]} style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color="#000" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>GlucoAI Assistant</Text>
              <View style={styles.statusRow}>
                <OnlineIndicator />
                <Text style={styles.statusText}>Powered by GPT-4o</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color="#444" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isEmpty ? (
          <EmptyChat onSuggestPress={sendMessage} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.messageList, { paddingBottom: 20 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <MessageBubble message={item} isFirst={index === 0 || messages[index - 1]?.role !== item.role} />
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Suggested prompts strip (when not empty) */}
        {!isEmpty && messages.length < 4 && (
          <FlatList
            horizontal
            data={SUGGESTED_PROMPTS.slice(0, 3)}
            keyExtractor={(i) => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestStrip}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => sendMessage(item)}
                style={styles.suggestChip}
              >
                <Text style={styles.suggestChipText} numberOfLines={1}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything about diabetes..."
              placeholderTextColor="#333"
              style={styles.input}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(input)}
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          >
            <LinearGradient
              colors={input.trim() && !isLoading ? ["#00FF88", "#00B4FF"] : ["#1A1A2E", "#1A1A2E"]}
              style={styles.sendBtnGrad}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={input.trim() && !isLoading ? "#000" : "#333"}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function MessageBubble({ message, isFirst }: { message: LocalMessage; isFirst: boolean }) {
  const isUser = message.role === "user";

  return (
    <Animated.View
      entering={isUser ? FadeInRight.duration(300) : FadeInLeft.duration(300)}
      style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}
    >
      {!isUser && isFirst && (
        <LinearGradient colors={["#00FF88", "#00B4FF"]} style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={12} color="#000" />
        </LinearGradient>
      )}
      {!isUser && !isFirst && <View style={{ width: 28 }} />}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI, { maxWidth: width * 0.75 }]}>
        {message.isTyping ? (
          <TypingIndicator />
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {message.content}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.typingDots}>
      {[0, 1, 2].map((i) => <TypingDot key={i} delay={i * 150} />)}
    </View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    setTimeout(() => {
      y.value = withRepeat(
        withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1,
        false
      );
    }, delay);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

function OnlineIndicator() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.onlineDot, style]} />;
}

function EmptyChat({ onSuggestPress }: { onSuggestPress: (text: string) => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyIcon}>
        <LinearGradient colors={["#00FF8830", "#00B4FF30"]} style={styles.emptyIconBg}>
          <LinearGradient colors={["#00FF88", "#00B4FF"]} style={styles.emptyIconInner}>
            <Ionicons name="sparkles" size={28} color="#000" />
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).springify()} style={{ alignItems: "center", gap: 8 }}>
        <Text style={styles.emptyTitle}>GlucoAI Assistant</Text>
        <Text style={styles.emptySubtitle}>Your AI-powered diabetes expert</Text>
        <Text style={styles.emptyDescription}>
          Ask me anything about blood glucose management, nutrition, insulin dosing, or diabetes lifestyle tips.
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.suggestGrid}>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onSuggestPress(prompt)}
            style={styles.suggestCard}
          >
            <Text style={styles.suggestCardText}>{prompt}</Text>
            <Ionicons name="arrow-forward-circle" size={16} color="#333" />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,255,136,0.1)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiBadge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00FF88" },
  statusText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#444" },
  clearBtn: { padding: 8 },
  messageList: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 2 },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAI: { justifyContent: "flex-start" },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: {
    backgroundColor: "rgba(0,212,168,0.15)",
    borderBottomRightRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,212,168,0.3)",
  },
  bubbleAI: {
    backgroundColor: "#111827",
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,255,136,0.15)",
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  bubbleTextUser: { fontFamily: "Inter_400Regular", color: "#E2E8F0" },
  bubbleTextAI: { fontFamily: "Inter_400Regular", color: "#CBD5E1" },
  typingDots: { flexDirection: "row", gap: 4, paddingVertical: 4, paddingHorizontal: 2 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#00FF88" },
  suggestStrip: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  suggestChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 0.5,
    borderColor: "rgba(0,255,136,0.2)",
    backgroundColor: "rgba(0,255,136,0.05)",
    marginRight: 8,
  },
  suggestChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#00FF88", maxWidth: 200 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,255,136,0.08)",
    backgroundColor: "rgba(6,9,18,0.95)",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#0F1629",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#E2E8F0", maxHeight: 80 },
  sendBtn: { marginBottom: 2 },
  sendBtnDisabled: {},
  sendBtnGrad: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 20 },
  emptyIcon: { alignItems: "center" },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  emptyIconInner: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#00FF88" },
  emptyDescription: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4A5568", textAlign: "center", lineHeight: 20 },
  suggestGrid: { width: "100%", gap: 8 },
  suggestCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#0F1629", borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: "rgba(0,255,136,0.1)",
  },
  suggestCardText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8B9DB5", flex: 1, marginRight: 8 },
});
