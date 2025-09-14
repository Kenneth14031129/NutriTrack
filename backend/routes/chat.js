const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Middleware to verify authentication
router.use(auth);

// @route   GET /api/chat/conversations
// @desc    Get user's chat conversations (list of chats)
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.user.userId);
    res.json({
      success: true,
      data: chats,
      count: chats.length
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// @route   GET /api/chat/active
// @desc    Get or create user's active chat session
// @access  Private
router.get('/active', async (req, res) => {
  try {
    const chat = await Chat.getOrCreateActiveChat(req.user.userId);

    res.json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        title: chat.title,
        messages: chat.messages,
        context: chat.context,
        lastActivity: chat.lastActivity,
        createdAt: chat.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching active chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active chat session'
    });
  }
});

// @route   GET /api/chat/:sessionId
// @desc    Get specific chat session by ID
// @access  Private
router.get('/:sessionId', async (req, res) => {
  try {
    const chat = await Chat.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        title: chat.title,
        messages: chat.messages,
        context: chat.context,
        lastActivity: chat.lastActivity,
        createdAt: chat.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session'
    });
  }
});

// @route   POST /api/chat/:sessionId/message
// @desc    Add a message to a chat session
// @access  Private
router.post('/:sessionId/message', async (req, res) => {
  try {
    const { content, type = 'user', suggestions = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const chat = await Chat.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    const messageData = {
      id: Date.now().toString(), // Simple ID generation
      type,
      content: content.trim(),
      suggestions,
      timestamp: new Date()
    };

    await chat.addMessage(messageData);

    res.json({
      success: true,
      data: messageData,
      message: 'Message added successfully'
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message'
    });
  }
});

// @route   POST /api/chat/new
// @desc    Create a new chat session
// @access  Private
router.post('/new', async (req, res) => {
  try {
    const { title } = req.body;

    const chat = new Chat({
      userId: req.user.userId,
      title: title || 'New Chat',
      messages: [{
        id: Date.now().toString(),
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

    res.status(201).json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        title: chat.title,
        messages: chat.messages,
        context: chat.context,
        createdAt: chat.createdAt
      },
      message: 'New chat session created'
    });
  } catch (error) {
    console.error('Error creating new chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create new chat session'
    });
  }
});

// @route   PUT /api/chat/:sessionId/clear
// @desc    Clear messages in a chat session (reset to welcome message)
// @access  Private
router.put('/:sessionId/clear', async (req, res) => {
  try {
    const chat = await Chat.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    await chat.clearMessages();

    res.json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        title: chat.title,
        messages: chat.messages,
        context: chat.context
      },
      message: 'Chat cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat'
    });
  }
});

// @route   PUT /api/chat/:sessionId/context
// @desc    Update chat context (user preferences, goals, etc.)
// @access  Private
router.put('/:sessionId/context', async (req, res) => {
  try {
    const { userGoals, dietaryRestrictions, currentFocus, lastTopics } = req.body;

    const chat = await Chat.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    const contextUpdate = {};
    if (userGoals !== undefined) contextUpdate.userGoals = userGoals;
    if (dietaryRestrictions !== undefined) contextUpdate.dietaryRestrictions = dietaryRestrictions;
    if (currentFocus !== undefined) contextUpdate.currentFocus = currentFocus;
    if (lastTopics !== undefined) contextUpdate.lastTopics = lastTopics;

    await chat.updateContext(contextUpdate);

    res.json({
      success: true,
      data: chat.context,
      message: 'Context updated successfully'
    });
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update context'
    });
  }
});

// @route   DELETE /api/chat/:sessionId
// @desc    Archive (soft delete) a chat session
// @access  Private
router.delete('/:sessionId', async (req, res) => {
  try {
    const chat = await Chat.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    await chat.archive();

    res.json({
      success: true,
      message: 'Chat session archived successfully'
    });
  } catch (error) {
    console.error('Error archiving chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive chat session'
    });
  }
});

// @route   GET /api/chat/stats
// @desc    Get user's chat statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments({
      userId: req.user.userId,
      isActive: true
    });

    const totalMessages = await Chat.aggregate([
      { $match: { userId: req.user.userId, isActive: true } },
      { $group: { _id: null, total: { $sum: "$messageCount" } } }
    ]);

    const recentActivity = await Chat.findOne({
      userId: req.user.userId,
      isActive: true
    })
    .select('lastActivity')
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: {
        totalChats,
        totalMessages: totalMessages.length > 0 ? totalMessages[0].total : 0,
        lastActivity: recentActivity?.lastActivity || null
      }
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat statistics'
    });
  }
});

module.exports = router;