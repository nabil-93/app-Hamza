import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export const formatGlucose = (value: number): string => `${Math.round(value)}`;
export const formatCalories = (value: number): string => `${Math.round(value)} kcal`;
export const formatCarbs = (value: number): string => `${Math.round(value)}g`;
export const formatDose = (value: number): string => `${value}U`;

export const formatTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "h:mm a");
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

export const formatRelative = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return `Today ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};
