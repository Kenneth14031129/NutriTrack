const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  
  // Date tracking
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0) // Start of day
  },
  
  // Current Progress
  current: {
    calories: {
      type: Number,
      default: 0,
      min: 0,
      max: 10000
    },
    water: {
      type: Number,
      default: 0,
      min: 0,
      max: 50
    },
    meals: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    exercise: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000
    },
    sleep: {
      type: Number,
      default: 0,
      min: 0,
      max: 24
    },
    steps: {
      type: Number,
      default: 0,
      min: 0,
      max: 100000
    }
  },
  
  // Nutritional Progress (optional)
  nutritional: {
    protein: {
      type: Number,
      default: 0,
      min: 0
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0
    },
    fat: {
      type: Number,
      default: 0,
      min: 0
    },
    fiber: {
      type: Number,
      default: 0,
      min: 0
    },
    sugar: {
      type: Number,
      default: 0,
      min: 0
    },
    sodium: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Activity Log
  activities: [{
    activityType: String,
    description: String,
    value: Number,
    unit: String,
    timestamp: { type: Date, default: Date.now },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    exerciseType: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Custom Goals Progress
  customProgress: [{
    goalId: {
      type: String,
      required: true
    },
    current: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Daily Summary
  summary: {
    caloriesConsumed: {
      type: Number,
      default: 0
    },
    caloriesBurned: {
      type: Number,
      default: 0
    },
    netCalories: {
      type: Number,
      default: 0
    },
    totalActivities: {
      type: Number,
      default: 0
    },
    completedGoals: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
progressSchema.index({ userId: 1, date: -1 });
progressSchema.index({ userId: 1, goalId: 1 });
progressSchema.index({ date: -1 });
progressSchema.index({ lastActivityAt: -1 });

// Update timestamps
progressSchema.pre('save', function(next) {
  const now = new Date();
  
  if (!this.isNew) {
    this.updatedAt = now;
  }
  
  // Update lastActivityAt if activities were added
  if (this.isModified('activities')) {
    this.lastActivityAt = now;
  }
  
  next();
});

// Update summary before saving
progressSchema.pre('save', function(next) {
  // Calculate total activities
  this.summary.totalActivities = this.activities.length;
  
  // Calculate calories consumed (from food activities)
  this.summary.caloriesConsumed = this.current.calories || 0;
  
  // Calculate net calories
  this.summary.netCalories = this.summary.caloriesConsumed - this.summary.caloriesBurned;
  
  next();
});

// Static method to get or create progress for user and date
progressSchema.statics.getOrCreateProgress = async function(userId, goalId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  let progress = await this.findOne({
    userId,
    goalId,
    date: startOfDay
  });
  
  if (!progress) {
    progress = new this({
      userId,
      goalId,
      date: startOfDay
    });
    await progress.save();
  }
  
  return progress;
};

// Static method to get progress for date range
progressSchema.statics.getProgressRange = async function(userId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return await this.find({
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1 });
};

// Instance method to add activity
progressSchema.methods.addActivity = function(activityData) {
  this.activities.push({
    ...activityData,
    timestamp: new Date()
  });
  
  // Update current progress based on activity type
  if (activityData.activityType === 'food') {
    this.current.calories += activityData.value || 0;
    this.current.meals += 1;
  } else if (activityData.activityType === 'water') {
    this.current.water += activityData.value || 0;
  } else if (activityData.activityType === 'exercise') {
    this.current.exercise += activityData.value || 0;
    this.summary.caloriesBurned += activityData.metadata?.caloriesBurned || 0;
  }
  
  return this.save();
};

// Instance method to update progress
progressSchema.methods.updateProgress = function(progressType, value, operation = 'add') {
  if (!this.current[progressType] && this.current[progressType] !== 0) {
    return false;
  }
  
  if (operation === 'add') {
    this.current[progressType] += value;
  } else if (operation === 'set') {
    this.current[progressType] = value;
  } else if (operation === 'subtract') {
    this.current[progressType] = Math.max(0, this.current[progressType] - value);
  }
  
  // Ensure values don't go negative
  this.current[progressType] = Math.max(0, this.current[progressType]);
  
  return this.save();
};

// Instance method to calculate completion percentage
progressSchema.methods.calculateCompletion = async function() {
  const Goal = require('./Goal');
  const goal = await Goal.findById(this.goalId);
  
  if (!goal) return 0;
  
  return goal.getCompletionStats(this);
};

module.exports = mongoose.model('Progress', progressSchema);