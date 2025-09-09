const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Meal Information
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    maxLength: [100, 'Meal name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Meal Type & Timing
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
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
  actualTime: {
    type: Date
  },
  
  // Meal Components
  foods: [{
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.1, 'Quantity must be at least 0.1']
    },
    unit: {
      type: String,
      required: true,
      enum: ['g', 'ml', 'cup', 'piece', 'slice', 'tbsp', 'tsp', 'oz']
    },
    calories: {
      type: Number,
      default: 0,
      min: 0
    },
    nutrition: {
      protein: { type: Number, default: 0, min: 0 },
      carbs: { type: Number, default: 0, min: 0 },
      fat: { type: Number, default: 0, min: 0 },
      fiber: { type: Number, default: 0, min: 0 },
      sugar: { type: Number, default: 0, min: 0 },
      sodium: { type: Number, default: 0, min: 0 }
    }
  }],
  
  // Nutritional Summary
  totalNutrition: {
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 }
  },
  
  // Meal Status
  status: {
    type: String,
    enum: ['planned', 'prepared', 'consumed', 'skipped'],
    default: 'planned'
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
  
  // Meal Rating (after consumption)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Preparation Details
  prepTime: {
    type: Number, // in minutes
    min: 0,
    max: 1440 // 24 hours
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },
  
  // Recipe Information (if applicable)
  recipe: {
    ingredients: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true }
    }],
    instructions: [{
      step: { type: Number, required: true },
      description: { type: String, required: true }
    }],
    servings: { type: Number, min: 1 }
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
  consumedAt: {
    type: Date
  }
});

// Indexes for efficient queries
mealSchema.index({ userId: 1, date: -1 });
mealSchema.index({ userId: 1, type: 1, date: -1 });
mealSchema.index({ userId: 1, status: 1 });
mealSchema.index({ date: -1 });

// Update timestamps
mealSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Set consumedAt when status changes to consumed
  if (this.isModified('status') && this.status === 'consumed' && !this.consumedAt) {
    this.consumedAt = new Date();
  }
  
  next();
});

// Calculate total nutrition before saving
mealSchema.pre('save', function(next) {
  if (this.isModified('foods')) {
    this.calculateTotalNutrition();
  }
  next();
});

// Instance method to calculate total nutrition
mealSchema.methods.calculateTotalNutrition = function() {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };
  
  this.foods.forEach(food => {
    totals.calories += food.calories || 0;
    if (food.nutrition) {
      Object.keys(totals).forEach(nutrient => {
        if (nutrient !== 'calories' && food.nutrition[nutrient]) {
          totals[nutrient] += food.nutrition[nutrient];
        }
      });
    }
  });
  
  this.totalNutrition = totals;
  return totals;
};

// Static method to get user's meals for a specific date
mealSchema.statics.getMealsForDate = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await this.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ plannedTime: 1, createdAt: 1 });
};

// Static method to get meals for date range
mealSchema.statics.getMealsForDateRange = async function(userId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return await this.find({
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1, plannedTime: 1 });
};

// Static method to get weekly meal plan
mealSchema.statics.getWeeklyMealPlan = async function(userId, startOfWeek) {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return await this.getMealsForDateRange(userId, startOfWeek, endOfWeek);
};

// Instance method to add food to meal
mealSchema.methods.addFood = function(foodData) {
  this.foods.push(foodData);
  this.calculateTotalNutrition();
  return this.save();
};

// Instance method to remove food from meal
mealSchema.methods.removeFood = function(foodIndex) {
  if (foodIndex >= 0 && foodIndex < this.foods.length) {
    this.foods.splice(foodIndex, 1);
    this.calculateTotalNutrition();
    return this.save();
  }
  return Promise.reject(new Error('Invalid food index'));
};

// Instance method to update meal status
mealSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  if (newStatus === 'consumed' && !this.consumedAt) {
    this.consumedAt = new Date();
  }
  
  return this.save();
};

// Instance method to duplicate meal for another date
mealSchema.methods.duplicateForDate = function(newDate, newType = null) {
  const duplicatedMeal = new this.constructor({
    userId: this.userId,
    name: this.name,
    description: this.description,
    type: newType || this.type,
    date: newDate,
    plannedTime: this.plannedTime,
    foods: this.foods.map(food => ({
      foodId: food.foodId,
      name: food.name,
      quantity: food.quantity,
      unit: food.unit,
      calories: food.calories,
      nutrition: food.nutrition
    })),
    notes: this.notes,
    tags: [...this.tags],
    prepTime: this.prepTime,
    difficulty: this.difficulty,
    recipe: this.recipe ? {
      ingredients: this.recipe.ingredients,
      instructions: this.recipe.instructions,
      servings: this.recipe.servings
    } : undefined
  });
  
  duplicatedMeal.calculateTotalNutrition();
  return duplicatedMeal.save();
};

module.exports = mongoose.model('Meal', mealSchema);