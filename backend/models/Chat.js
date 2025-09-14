const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  suggestions: [{
    type: String,
    trim: true
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false // Don't create separate _id for subdocuments
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    unique: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters'],
    default: 'New Chat'
  },
  messages: [messageSchema],

  // Chat metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  messageCount: {
    type: Number,
    default: 0
  },

  // AI Coach specific data
  context: {
    userGoals: [String],
    dietaryRestrictions: [String],
    currentFocus: String, // e.g., 'weight-loss', 'muscle-gain', 'general-health'
    lastTopics: [String] // Track conversation topics for better context
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, isActive: 1, lastActivity: -1 });
chatSchema.index({ sessionId: 1 });

// Update timestamps and metadata before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();
  this.messageCount = this.messages.length;

  // Auto-generate title from first user message if not set
  if (!this.title || this.title === 'New Chat') {
    const firstUserMessage = this.messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      // Use first 50 characters of first user message as title
      this.title = firstUserMessage.content.substring(0, 50) +
                   (firstUserMessage.content.length > 50 ? '...' : '');
    }
  }

  next();
});

// Static methods for chat management
chatSchema.statics.getUserChats = function(userId, limit = 20, skip = 0) {
  return this.find({
    userId,
    isActive: true
  })
  .select('sessionId title messageCount lastActivity createdAt')
  .sort({ lastActivity: -1 })
  .limit(limit)
  .skip(skip);
};

chatSchema.statics.getOrCreateActiveChat = async function(userId) {
  // Try to find the most recent active chat
  let chat = await this.findOne({
    userId,
    isActive: true
  }).sort({ lastActivity: -1 });

  // If no active chat exists, create a new one
  if (!chat) {
    chat = new this({
      userId,
      messages: [{
        id: new mongoose.Types.ObjectId().toString(),
        type: 'bot',
        content: "Hi there! I'm your AI nutrition coach. I'm here to help you achieve your health goals. What would you like to discuss today?",
        suggestions: [
          "My daily nutrition",
          "Meal planning help",
          "Weight loss tips",
          "Workout recommendations"
        ],
        timestamp: new Date()
      }]
    });
    await chat.save();
  }

  return chat;
};

// Instance methods
chatSchema.methods.addMessage = function(messageData) {
  this.messages.push({
    id: messageData.id || new mongoose.Types.ObjectId().toString(),
    type: messageData.type,
    content: messageData.content,
    suggestions: messageData.suggestions || [],
    timestamp: messageData.timestamp || new Date()
  });

  return this.save();
};

chatSchema.methods.updateContext = function(contextData) {
  this.context = {
    ...this.context,
    ...contextData
  };
  return this.save();
};

chatSchema.methods.clearMessages = function() {
  this.messages = [{
    id: new mongoose.Types.ObjectId().toString(),
    type: 'bot',
    content: "Hi there! I'm your AI nutrition coach. I'm here to help you achieve your health goals. What would you like to discuss today?",
    suggestions: [
      "My daily nutrition",
      "Meal planning help",
      "Weight loss tips",
      "Workout recommendations"
    ],
    timestamp: new Date()
  }];

  return this.save();
};

// Archive old chats (soft delete)
chatSchema.methods.archive = function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema);