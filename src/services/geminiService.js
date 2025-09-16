import { GoogleGenerativeAI } from '@google/generative-ai';
import userContextService from './userContextService';

class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
      return false;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      return false;
    }
  }

  async generateResponse(userMessage, userContext = {}) {
    if (!this.initialized) {
      const initSuccess = await this.initialize();
      if (!initSuccess) {
        return this.getFallbackResponse(userMessage);
      }
    }

    try {
      // Create a nutrition-focused prompt
      const systemPrompt = `You are an expert AI nutrition coach and health advisor. Your role is to provide personalized, evidence-based nutrition and wellness guidance.

Key guidelines:
- For simple factual questions (like calorie counts), give direct, concise answers first
- Always prioritize health and safety
- Provide actionable, practical advice
- Only ask clarifying questions if the question is genuinely ambiguous
- Consider individual dietary restrictions and preferences
- Focus on sustainable, long-term health habits
- If medical advice is needed, recommend consulting healthcare professionals
- Be supportive and motivational
- Keep responses concise and direct - avoid unnecessary elaboration

User context: ${this.formatUserContext(userContext)}

User message: ${userMessage}

Please provide a helpful, personalized response as a nutrition coach. Use the user's name if available and reference their specific goals, preferences, and restrictions when relevant:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        suggestions: this.generateSuggestions(userMessage, text),
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  getFallbackResponse(userMessage) {
    const fallbackResponses = {
      nutrition: "I'd love to help you with your nutrition goals! While I'm having trouble connecting to my AI services right now, I can suggest focusing on whole foods, staying hydrated, and maintaining a balanced diet. What specific nutrition questions do you have?",
      workout: "Exercise is fantastic for your health! Even though I'm experiencing connectivity issues, I recommend starting with activities you enjoy - whether it's walking, dancing, or strength training. What type of exercise interests you most?",
      weight: "Weight management is about creating sustainable habits. While my AI services are temporarily unavailable, remember that small, consistent changes often lead to the best long-term results. What's your current approach to managing your weight?",
      meal: "Meal planning is such a great strategy! Even with my current technical limitations, I can suggest preparing simple, nutrient-dense meals in advance. What meals are you most interested in planning?",
      default: "I'm here to help with your nutrition and wellness journey! I'm experiencing some technical difficulties right now, but I'm still committed to supporting your health goals. What specific area would you like to focus on today?"
    };

    const lowerInput = userMessage.toLowerCase();
    let content;

    if (lowerInput.includes('nutrition') || lowerInput.includes('eat')) {
      content = fallbackResponses.nutrition;
    } else if (lowerInput.includes('workout') || lowerInput.includes('exercise')) {
      content = fallbackResponses.workout;
    } else if (lowerInput.includes('weight') || lowerInput.includes('lose')) {
      content = fallbackResponses.weight;
    } else if (lowerInput.includes('meal') || lowerInput.includes('plan')) {
      content = fallbackResponses.meal;
    } else {
      content = fallbackResponses.default;
    }

    return {
      content,
      suggestions: this.generateSuggestions(userMessage, content),
    };
  }

  formatUserContext(userContext) {
    if (!userContext) {
      return 'No user context available - provide general nutrition advice.';
    }

    const contextSummary = userContextService.getContextSummary(userContext);

    if (!contextSummary) {
      return 'Limited user context - provide general nutrition advice.';
    }

    return contextSummary;
  }

  generateSuggestions(userMessage, response) {
    const baseSuggestions = [
      "Tell me more about this",
      "Create a detailed plan",
      "Show me examples",
      "How do I get started?",
      "Track my progress",
      "What are the benefits?",
    ];

    const lowerInput = userMessage.toLowerCase();
    const contextualSuggestions = [];

    if (lowerInput.includes('nutrition') || lowerInput.includes('eat')) {
      contextualSuggestions.push("Calculate my daily calories", "Suggest healthy recipes");
    }

    if (lowerInput.includes('workout') || lowerInput.includes('exercise')) {
      contextualSuggestions.push("Create workout plan", "Exercise alternatives");
    }

    if (lowerInput.includes('weight') || lowerInput.includes('lose')) {
      contextualSuggestions.push("Weight loss strategies", "Track my weight");
    }

    if (lowerInput.includes('meal') || lowerInput.includes('plan')) {
      contextualSuggestions.push("Weekly meal prep", "Grocery list ideas");
    }

    // Combine and shuffle suggestions
    const allSuggestions = [...contextualSuggestions, ...baseSuggestions];
    const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3 + Math.floor(Math.random() * 2)); // Return 3-4 suggestions
  }

  async generateMealPlan(preferences = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const prompt = `Create a personalized weekly meal plan based on these preferences: ${JSON.stringify(preferences)}.
    Include breakfast, lunch, dinner, and snacks. Focus on balanced nutrition, variety, and practical preparation.
    Format the response in a clear, organized way with ingredient lists.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Meal plan generation error:', error);
      return "I'd be happy to help create a meal plan for you! Please let me know your dietary preferences, any restrictions, and your goals, and I'll provide personalized suggestions.";
    }
  }

  async analyzeNutrition(foodDescription) {
    if (!this.initialized) {
      await this.initialize();
    }

    const prompt = `Analyze the nutritional content of: ${foodDescription}.
    Provide estimated calories, macronutrients (protein, carbs, fats), and key vitamins/minerals.
    Also include health benefits and any considerations. Keep it practical and easy to understand.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Nutrition analysis error:', error);
      return "I'd be happy to analyze the nutritional content of your food! Please describe what you'd like me to analyze, and I'll provide detailed nutritional information.";
    }
  }
}

export default new GeminiService();