import OpenAI from "openai";
import * as FileSystem from "expo-file-system";
import type { NutritionResult } from "@store/mealStore";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const NUTRITION_PROMPT = `You are a professional nutritionist and medical AI assistant.
Analyze this food image and return ONLY a valid JSON object with these exact fields:
{
  "food_name": "descriptive name of the food",
  "calories": number (kcal per serving shown),
  "carbohydrates": number (grams),
  "sugar": number (grams),
  "protein": number (grams),
  "fats": number (grams),
  "glycemic_index": number (0-100 scale, estimate if unsure)
}

Be as accurate as possible. If multiple items are visible, estimate the combined total.
Return ONLY the JSON object, no explanation or markdown.`;

const DIABETES_SYSTEM_PROMPT = `You are GlucoAI, an expert AI assistant specializing in diabetes management, nutrition, and blood glucose control. You have comprehensive knowledge of:
- Type 1 and Type 2 diabetes management
- Carbohydrate counting and glycemic index
- Insulin therapy and dosing principles
- Nutrition science and meal planning
- Blood glucose monitoring and patterns
- Exercise effects on blood sugar
- Diabetes complications and prevention

Always:
- Be empathetic, professional, and supportive
- Provide evidence-based information
- Add medical disclaimers when discussing dosages or clinical decisions
- Encourage users to consult their healthcare team for personalized advice
- Format responses clearly with bullet points when helpful

Never:
- Provide specific insulin doses as prescriptions
- Replace professional medical advice
- Diagnose conditions`;

export const analyzeFood = async (imageUri: string): Promise<NutritionResult> => {
  let base64Image: string;

  if (imageUri.startsWith("http")) {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    base64Image = await blobToBase64(blob);
  } else {
    base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high",
            },
          },
          { type: "text", text: NUTRITION_PROMPT },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const result = JSON.parse(cleaned) as NutritionResult;

  return {
    food_name: result.food_name ?? "Unknown Food",
    calories: Number(result.calories) || 0,
    carbohydrates: Number(result.carbohydrates) || 0,
    sugar: Number(result.sugar) || 0,
    protein: Number(result.protein) || 0,
    fats: Number(result.fats) || 0,
    glycemic_index: Number(result.glycemic_index) || 0,
  };
};

export const chatWithAI = async (
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1000,
    messages: [
      { role: "system", content: DIABETES_SYSTEM_PROMPT },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
};

export const getAIInsight = async (context: {
  averageGlucose?: number;
  todayCarbs?: number;
  todayCalories?: number;
  recentMeals?: string[];
}): Promise<string> => {
  const prompt = `Based on this diabetes management data, provide a brief, personalized health insight (2-3 sentences max):
- Average glucose: ${context.averageGlucose ?? "N/A"} mg/dL
- Today's carbs: ${context.todayCarbs ?? 0}g
- Today's calories: ${context.todayCalories ?? 0} kcal
- Recent meals: ${context.recentMeals?.join(", ") ?? "none recorded"}

Be encouraging and specific. Focus on one actionable tip.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 150,
    messages: [
      { role: "system", content: DIABETES_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "Keep monitoring your glucose levels regularly!";
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
