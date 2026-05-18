import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth helpers ──────────────────────────────────────────────────────────────

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// ── User profile ──────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};

export const upsertUserProfile = async (profile: Partial<UserProfile> & { id: string }) => {
  const { data, error } = await supabase
    .from("users")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Meal scans ────────────────────────────────────────────────────────────────

export const saveMealScan = async (scan: Omit<MealScan, "id" | "created_at">) => {
  const { data, error } = await supabase
    .from("meal_scans")
    .insert(scan)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMealScans = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from("meal_scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const deleteMealScan = async (id: string) => {
  const { error } = await supabase.from("meal_scans").delete().eq("id", id);
  if (error) throw error;
};

// ── Glucose logs ──────────────────────────────────────────────────────────────

export const saveGlucoseLog = async (log: Omit<GlucoseLog, "id" | "created_at">) => {
  const { data, error } = await supabase
    .from("glucose_logs")
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getGlucoseLogs = async (userId: string, days = 7) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("glucose_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

// ── Chat history ──────────────────────────────────────────────────────────────

export const saveChatMessage = async (msg: Omit<ChatMessage, "id" | "created_at">) => {
  const { data, error } = await supabase
    .from("chat_history")
    .insert(msg)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getChatHistory = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const clearChatHistory = async (userId: string) => {
  const { error } = await supabase.from("chat_history").delete().eq("user_id", userId);
  if (error) throw error;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  diabetes_type: "type1" | "type2" | "gestational" | "prediabetes";
  carb_ratio: number;
  correction_factor: number;
  target_glucose: number;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface MealScan {
  id: string;
  user_id: string;
  image_url?: string;
  food_name: string;
  calories: number;
  carbohydrates: number;
  sugar: number;
  protein: number;
  fats: number;
  glycemic_index: number;
  insulin_dose: number;
  notes?: string;
  created_at: string;
}

export interface GlucoseLog {
  id: string;
  user_id: string;
  value: number;
  unit: "mg/dL" | "mmol/L";
  notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
