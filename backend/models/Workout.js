const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Workout Information
  name: {
    type: String,
    required: [true, 'Workout name is required'],
    trim: true,
    maxLength: [100, 'Workout name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },

  // Workout Type & Timing
  type: {
    type: String,
    enum: ['strength', 'cardio', 'yoga', 'hiit', 'sports', 'flexibility'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  plannedTime: {
    type: String, // Format: "HH:MM"
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },

  // Workout Details
  duration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  actualDuration: {
    type: Number // in minutes, calculated from actual start/end times
  },

  // Exercise Information
  exercises: {
    type: String,
    trim: true,
    maxLength: [1000, 'Exercises description cannot exceed 1000 characters']
  },
  targetMuscles: {
    type: String,
    trim: true,
    maxLength: [500, 'Target muscles description cannot exceed 500 characters']
  },

  // Workout Components (for detailed tracking)
  exerciseList: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    sets: [{
      reps: { type: Number, min: 0 },
      weight: { type: Number, min: 0 }, // in kg
      duration: { type: Number, min: 0 }, // in seconds for timed exercises
      distance: { type: Number, min: 0 }, // in meters for cardio
      rest: { type: Number, min: 0 } // rest time in seconds
    }],
    notes: {
      type: String,
      maxLength: [200, 'Exercise notes cannot exceed 200 characters']
    }
  }],

  // Workout Status
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'skipped'],
    default: 'planned'
  },

  // Intensity & Performance
  intensity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high']
  },
  caloriesBurned: {
    type: Number,
    min: 0
  },
  avgHeartRate: {
    type: Number,
    min: 40,
    max: 220
  },
  maxHeartRate: {
    type: Number,
    min: 40,
    max: 220
  },

  // Planning Details
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],

  // Notes & Tags
  notes: {
    type: String,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 30
  }],

  // Workout Rating (after completion)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  // Equipment & Location
  equipment: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  location: {
    type: String,
    enum: ['home', 'gym', 'outdoor', 'studio', 'other'],
    default: 'gym'
  },

  // Weather (for outdoor workouts)
  weather: {
    condition: String,
    temperature: Number
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
  completedAt: {
    type: Date
  }
});

// Indexes for efficient queries
workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, type: 1, date: -1 });
workoutSchema.index({ userId: 1, status: 1 });
workoutSchema.index({ date: -1 });

// Update timestamps
workoutSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }

  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  // Calculate actual duration if start and end times are set
  if (this.actualStartTime && this.actualEndTime && !this.actualDuration) {
    const durationMs = this.actualEndTime - this.actualStartTime;
    this.actualDuration = Math.round(durationMs / (1000 * 60)); // convert to minutes
  }

  next();
});

// Static method to get user's workouts for a specific date
workoutSchema.statics.getWorkoutsForDate = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await this.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ plannedTime: 1, createdAt: 1 });
};

// Static method to get workouts for date range
workoutSchema.statics.getWorkoutsForDateRange = async function(userId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return await this.find({
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1, plannedTime: 1 });
};

// Static method to get weekly workout plan
workoutSchema.statics.getWeeklyWorkoutPlan = async function(userId, startOfWeek) {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return await this.getWorkoutsForDateRange(userId, startOfWeek, endOfWeek);
};

// Instance method to update workout status
workoutSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;

  if (newStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (newStatus === 'in_progress' && !this.actualStartTime) {
    this.actualStartTime = new Date();
  }

  if (newStatus === 'completed' && this.actualStartTime && !this.actualEndTime) {
    this.actualEndTime = new Date();
  }

  return this.save();
};

// Instance method to duplicate workout for another date
workoutSchema.methods.duplicateForDate = function(newDate, newType = null) {
  const duplicatedWorkout = new this.constructor({
    userId: this.userId,
    name: this.name,
    description: this.description,
    type: newType || this.type,
    date: newDate,
    plannedTime: this.plannedTime,
    duration: this.duration,
    exercises: this.exercises,
    targetMuscles: this.targetMuscles,
    exerciseList: this.exerciseList.map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        duration: set.duration,
        distance: set.distance,
        rest: set.rest
      })),
      notes: exercise.notes
    })),
    intensity: this.intensity,
    notes: this.notes,
    tags: [...this.tags],
    equipment: [...this.equipment],
    location: this.location
  });

  return duplicatedWorkout.save();
};

module.exports = mongoose.model('Workout', workoutSchema);