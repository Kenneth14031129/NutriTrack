import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Lightbulb,
  Target,
  TrendingUp,
  Heart,
  Apple,
  Activity,
  Calendar,
  Award,
  MessageCircle,
  Sparkles,
  User,
  ChevronDown,
  Clock,
  Bookmark,
  Share2,
  MoreVertical,
  Menu,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const Coach = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hi there! I'm your AI nutrition coach. I'm here to help you achieve your health goals. What would you like to discuss today?",
      timestamp: new Date(Date.now() - 5 * 60000),
      suggestions: [
        "My daily nutrition",
        "Meal planning help",
        "Weight loss tips",
        "Workout recommendations",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickPrompts = [
    "Create a meal plan for weight loss",
    "What should I eat post-workout?",
    "Help me track my calories",
    "Suggest healthy snack options",
    "Plan my weekly workouts",
    "How can I improve my metabolism?",
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "52px";
    }

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        suggestions: generateSuggestions(inputMessage),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (input) => {
    const responses = {
      nutrition:
        "Based on your current goals, I recommend focusing on whole foods with a good balance of proteins, healthy fats, and complex carbohydrates. Would you like me to create a personalized meal plan for you?",
      workout:
        "Great question! For optimal results, I suggest combining cardiovascular exercise with strength training. Let's design a workout plan that fits your schedule and fitness level.",
      weight:
        "Weight management is about creating a sustainable caloric deficit while maintaining proper nutrition. I can help you calculate your daily caloric needs and suggest meal timing strategies.",
      meal: "Meal planning is key to success! I recommend preparing your meals 2-3 days in advance and focusing on nutrient-dense foods. Would you like some specific recipe suggestions?",
      default:
        "That's an interesting question! Let me provide you with some personalized advice based on your profile and goals. I'm here to help you make informed decisions about your health and nutrition.",
    };

    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("nutrition") || lowerInput.includes("eat"))
      return responses.nutrition;
    if (lowerInput.includes("workout") || lowerInput.includes("exercise"))
      return responses.workout;
    if (lowerInput.includes("weight") || lowerInput.includes("lose"))
      return responses.weight;
    if (lowerInput.includes("meal") || lowerInput.includes("plan"))
      return responses.meal;
    return responses.default;
  };

  const generateSuggestions = () => {
    const suggestions = [
      "Tell me more about this",
      "Create a detailed plan",
      "Show me examples",
      "Track my progress",
    ];
    return suggestions.slice(0, Math.floor(Math.random() * 3) + 2);
  };

  const handleQuickPrompt = (prompt) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
    // Trigger resize after setting the message
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
    // Trigger resize after setting the message
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "52px";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  const toggleVoiceRecording = () => {
    setIsListening(!isListening);
    // Voice recording logic would go here
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="ai-coach"
      />
      <div className="flex flex-col flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-400" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  AI Nutrition Coach
                </h1>
                <p className="text-sm text-gray-400">
                  Your personal health companion
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <Bookmark className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <Share2 className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-3xl ${
                  message.type === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 ${
                    message.type === "user" ? "ml-3" : "mr-3"
                  }`}
                >
                  {message.type === "user" ? (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex flex-col ${
                    message.type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-2xl ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-800/90 backdrop-blur-sm text-white shadow-sm border border-gray-700"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>

                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.type === "bot" && (
                      <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                        <MessageCircle className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 bg-gray-700/60 backdrop-blur-sm border border-gray-600 rounded-full text-xs text-gray-300 hover:bg-gray-600 hover:shadow-sm transition-all duration-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex mr-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/40 backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-300 mb-3">
              Quick prompts to get started:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="p-3 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-600 hover:shadow-md transition-all duration-200 text-left"
                >
                  <Sparkles className="w-4 h-4 text-yellow-500 mb-1" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 px-6 py-4">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about nutrition, workouts, or wellness..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 bg-gray-700/90 backdrop-blur-sm border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400 overflow-hidden"
                  style={{
                    minHeight: "52px",
                    maxHeight: "120px",
                    height: "52px",
                  }}
                />
                <button
                  onClick={toggleVoiceRecording}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                    isListening
                      ? "bg-red-500 text-white"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-[52px] h-[52px] bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coach;
