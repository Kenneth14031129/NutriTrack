const API_BASE_URL = 'http://localhost:5000/api';

class ChatService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getAuthHeaders() {
    // Always get fresh token from sessionStorage (like your apiService does)
    const currentToken = sessionStorage.getItem('authToken');

    return {
      'Content-Type': 'application/json',
      ...(currentToken && { Authorization: `Bearer ${currentToken}` })
    };
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Chat API request failed:', error);
      throw error;
    }
  }

  // Get or create active chat session
  async getActiveChat() {
    return await this.makeRequest('/chat/active');
  }

  // Get all user's chat conversations
  async getConversations() {
    return await this.makeRequest('/chat/conversations');
  }

  // Get specific chat session
  async getChat(sessionId) {
    return await this.makeRequest(`/chat/${sessionId}`);
  }

  // Add message to chat session
  async addMessage(sessionId, messageData) {
    return await this.makeRequest(`/chat/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  }

  // Create new chat session
  async createNewChat(title = 'New Chat') {
    return await this.makeRequest('/chat/new', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  }

  // Clear chat messages
  async clearChat(sessionId) {
    return await this.makeRequest(`/chat/${sessionId}/clear`, {
      method: 'PUT'
    });
  }

  // Update chat context
  async updateContext(sessionId, contextData) {
    return await this.makeRequest(`/chat/${sessionId}/context`, {
      method: 'PUT',
      body: JSON.stringify(contextData)
    });
  }

  // Archive chat session
  async archiveChat(sessionId) {
    return await this.makeRequest(`/chat/${sessionId}`, {
      method: 'DELETE'
    });
  }

  // Get chat statistics
  async getStats() {
    return await this.makeRequest('/chat/stats');
  }

  // Fallback methods for when user is not authenticated
  // These will use localStorage as backup
  getFallbackMessages() {
    const savedMessages = localStorage.getItem('coach-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (error) {
        console.error('Error parsing fallback messages:', error);
      }
    }

    return [{
      id: '1',
      type: 'bot',
      content: "Hi there! I'm your AI nutrition coach. I'm here to help you achieve your health goals. What would you like to discuss today?",
      timestamp: new Date(Date.now() - 5 * 60000),
      suggestions: [
        "My daily nutrition",
        "Meal planning help",
        "Weight loss tips",
        "Workout recommendations"
      ]
    }];
  }

  saveFallbackMessages(messages) {
    localStorage.setItem('coach-messages', JSON.stringify(messages));
  }

  clearFallbackMessages() {
    localStorage.removeItem('coach-messages');
  }
}

export default new ChatService();