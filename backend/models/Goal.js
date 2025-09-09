const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Goal Configuration
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0) // Start of day
  },
  
  // Daily Targets
  targets: {
    calories: {
      type: Number,
      required: true,
      min: [800, 'Calorie goal must be at least 800'],
      max: [5000, 'Calorie goal cannot exceed 5000']
    },
    water: {
      type: Number,
      required: true,
      min: [1, 'Water goal must be at least 1 glass'],
      max: [20, 'Water goal cannot exceed 20 glasses']
    },
    meals: {
      type: Number,
      required: true,
      min: [1, 'Meal goal must be at least 1'],
      max: [10, 'Meal goal cannot exceed 10']
    },
    exercise: {
      type: Number,
      required: true,
      min: [5, 'Exercise goal must be at least 5 minutes'],
      max: [300, 'Exercise goal cannot exceed 300 minutes']
    },
    sleep: {
      type: Number,
      required: true,
      min: [4, 'Sleep goal must be at least 4 hours'],
      max: [12, 'Sleep goal cannot exceed 12 hours']
    },
    steps: {
      type: Number,
      required: true,
      min: [1000, 'Steps goal must be at least 1000'],
      max: [50000, 'Steps goal cannot exceed 50000']
    }
  },
  
  // Nutritional Targets (optional)
  nutritionalTargets: {
    protein: {
      type: Number,
      min: 0,
      max: 500
    },
    carbs: {
      type: Number,
      min: 0,
      max: 1000
    },
    fat: {
      type: Number,
      min: 0,
      max: 300
    },
    fiber: {
      type: Number,
      min: 0,
      max: 100
    },
    sugar: {
      type: Number,
      min: 0,
      max: 200
    },
    sodium: {
      type: Number,
      min: 0,
      max: 5000
    }
  },
  
  // Goal Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Custom Goals (user-defined)
  customGoals: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100
    },
    target: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20
    },
    category: {
      type: String,
      enum: ['nutrition', 'fitness', 'wellness', 'other'],
      default: 'other'
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
goalSchema.index({ userId: 1, date: -1 });
goalSchema.index({ userId: 1, isActive: 1 });
goalSchema.index({ date: -1 });

// Update timestamp on save
goalSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Static method to get user's goals for a specific date
goalSchema.statics.getGoalsForDate = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  return await this.findOne({
    userId,
    date: startOfDay,
    isActive: true
  });
};

// Static method to get user's current goals
goalSchema.statics.getCurrentGoals = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await this.findOne({
    userId,
    date: today,
    isActive: true
  });
};

// Instance method to calculate completion percentage
goalSchema.methods.getCompletionStats = function(progress) {
  if (!progress) return { completed: 0, total: 6, percentage: 0 };
  
  const goals = ['calories', 'water', 'meals', 'exercise', 'sleep', 'steps'];
  let completed = 0;
  
  goals.forEach(goal => {
    const target = this.targets[goal];
    const current = progress.current[goal] || 0;
    
    if (current >= target) {
      completed++;
    }
  });
  
  return {
    completed,
    total: goals.length,
    percentage: Math.round((completed / goals.length) * 100)
  };
};

// Instance method to check if a specific goal is completed
goalSchema.methods.isGoalCompleted = function(goalType, currentProgress) {
  const target = this.targets[goalType];
  const current = currentProgress?.[goalType] || 0;
  return current >= target;
};

module.exports = mongoose.model('Goal', goalSchema);