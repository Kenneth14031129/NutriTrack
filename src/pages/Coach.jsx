import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  MessageCircle,
  Sparkles,
  User,
  Menu,
  Trash2,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import geminiService from "../services/geminiService";
import chatService from "../services/chatService";
import apiService from "../services/api";
import userContextService from "../services/userContextService";

const Coach = () => {
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userContext, setUserContext] = useState(null);
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

  // Load chat and user context on component mount
  useEffect(() => {
    loadActiveChat();
    loadUserContext();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadActiveChat = async () => {
    try {
      const token = sessionStorage.getItem("authToken");

      if (!apiService.isAuthenticated() || !token) {
        // Use fallback localStorage messages for unauthenticated users
        setMessages(chatService.getFallbackMessages());
        return;
      }

      chatService.setToken(token);

      // Load active chat from database
      const response = await chatService.getActiveChat();
      if (response.success) {
        // Convert timestamp strings to Date objects
        const messagesWithDates = (response.data.messages || []).map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
        setCurrentSessionId(response.data.sessionId);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
      // Fallback to localStorage
      setMessages(chatService.getFallbackMessages());
    }
  };

  const loadUserContext = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const context = await userContextService.getUserContext();
        setUserContext(context);
      }
    } catch (error) {
      console.error("Failed to load user context:", error);
      // Use default context for unauthenticated users
      setUserContext(userContextService.getDefaultContext());
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const clearChat = async () => {
    try {
      if (apiService.isAuthenticated() && currentSessionId) {
        const response = await chatService.clearChat(currentSessionId);
        if (response.success) {
          // Convert timestamp strings to Date objects
          const messagesWithDates = (response.data.messages || []).map(
            (msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })
          );
          setMessages(messagesWithDates);
        }
      } else {
        // Clear localStorage fallback
        const defaultMessages = [
          {
            id: Date.now().toString(),
            type: "bot",
            content:
              "Hi there! I'm your AI nutrition coach. I'm here to help you achieve your health goals. What would you like to discuss today?",
            timestamp: new Date(),
            suggestions: [
              "My daily nutrition",
              "Meal planning help",
              "Weight loss tips",
              "Workout recommendations",
            ],
          },
        ];
        setMessages(defaultMessages);
        chatService.saveFallbackMessages(defaultMessages);
      }
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "52px";
    }

    try {
      // Save user message to database if authenticated
      if (apiService.isAuthenticated() && currentSessionId) {
        await chatService.addMessage(currentSessionId, userMessage);
      } else {
        // Save to localStorage fallback
        const updatedMessages = [...messages, userMessage];
        chatService.saveFallbackMessages(updatedMessages);
      }

      // Get AI response from Gemini with user context
      const aiResponse = await geminiService.generateResponse(
        currentMessage,
        userContext
      );

      const botResponse = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
      };

      // Add bot response to UI
      setMessages((prev) => [...prev, botResponse]);

      // Save bot response to database if authenticated
      if (apiService.isAuthenticated() && currentSessionId) {
        await chatService.addMessage(currentSessionId, botResponse);
      } else {
        // Save to localStorage fallback
        const updatedMessages = [...messages, userMessage, botResponse];
        chatService.saveFallbackMessages(updatedMessages);
      }
    } catch (error) {
      console.error("Error in message handling:", error);

      // Fallback response if anything fails
      const fallbackResponse = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to ask your question in a different way.",
        timestamp: new Date(),
        suggestions: ["Try again", "Ask differently", "Contact support"],
      };

      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInputMessage(prompt);
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
    // Handle both Date objects and string timestamps from database
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], {
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
        <div className="bg-gray-900 text-white border-b border-gray-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <Bot className="text-green-400 w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="hidden sm:inline">AI Nutrition Coach</span>
                  <span className="sm:hidden">AI Coach</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  <span className="hidden sm:inline">
                    Your personal health companion
                  </span>
                  <span className="sm:hidden">Health assistant</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={clearChat}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white" />
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
