const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  // Food Identity
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxLength: [200, 'Food name cannot exceed 200 characters'],
    index: true
  },
  brand: {
    type: String,
    trim: true,
    maxLength: [100, 'Brand name cannot exceed 100 characters']
  },
  
  // External Database IDs
  usdaId: {
    type: String,
    index: true
  },
  barcode: {
    type: String,
    index: true
  },
  
  // Nutritional Information (per 100g unless specified)
  nutrition: {
    servingSize: {
      type: Number,
      required: true,
      default: 100,
      min: [1, 'Serving size must be at least 1']
    },
    servingUnit: {
      type: String,
      required: true,
      default: 'g',
      enum: ['g', 'ml', 'cup', 'piece', 'slice', 'tbsp', 'tsp', 'oz', 'fl-oz']
    },
    
    // Macronutrients
    calories: {
      type: Number,
      required: true,
      min: [0, 'Calories cannot be negative']
    },
    protein: {
      type: Number,
      required: true,
      min: [0, 'Protein cannot be negative']
    },
    carbs: {
      type: Number,
      required: true,
      min: [0, 'Carbohydrates cannot be negative']
    },
    fat: {
      type: Number,
      required: true,
      min: [0, 'Fat cannot be negative']
    },
    
    // Detailed Carbohydrates
    fiber: {
      type: Number,
      default: 0,
      min: [0, 'Fiber cannot be negative']
    },
    sugar: {
      type: Number,
      default: 0,
      min: [0, 'Sugar cannot be negative']
    },
    
    // Minerals & Vitamins (in mg unless specified)
    sodium: {
      type: Number,
      default: 0,
      min: [0, 'Sodium cannot be negative']
    },
    calcium: {
      type: Number,
      default: 0,
      min: [0, 'Calcium cannot be negative']
    },
    iron: {
      type: Number,
      default: 0,
      min: [0, 'Iron cannot be negative']
    },
    potassium: {
      type: Number,
      default: 0,
      min: [0, 'Potassium cannot be negative']
    },
    
    // Vitamins (various units)
    vitaminA: { type: Number, default: 0, min: 0 }, // IU
    vitaminC: { type: Number, default: 0, min: 0 }, // mg
    vitaminD: { type: Number, default: 0, min: 0 }, // IU
    vitaminE: { type: Number, default: 0, min: 0 }, // mg
    vitaminK: { type: Number, default: 0, min: 0 }, // mcg
    
    // B Vitamins
    thiamine: { type: Number, default: 0, min: 0 }, // mg
    riboflavin: { type: Number, default: 0, min: 0 }, // mg
    niacin: { type: Number, default: 0, min: 0 }, // mg
    folate: { type: Number, default: 0, min: 0 }, // mcg
    vitaminB12: { type: Number, default: 0, min: 0 } // mcg
  },
  
  // Food Categories
  category: {
    type: String,
    enum: [
      'fruits', 'vegetables', 'grains', 'protein', 'dairy', 
      'fats-oils', 'beverages', 'snacks', 'condiments', 
      'sweets', 'prepared-meals', 'other'
    ],
    default: 'other'
  },
  
  subcategory: {
    type: String,
    trim: true,
    maxLength: [50, 'Subcategory cannot exceed 50 characters']
  },
  
  // Food Properties
  isVerified: {
    type: Boolean,
    default: false // True for foods from official databases
  },
  
  isUserCreated: {
    type: Boolean,
    default: true // False for foods from external APIs
  },
  
  createdByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Common Serving Sizes
  commonServings: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['g', 'ml', 'cup', 'piece', 'slice', 'tbsp', 'tsp', 'oz', 'fl-oz']
    }
  }],
  
  // Food Tags & Search
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxLength: 30
  }],
  
  searchTerms: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lastUsed: {
    type: Date
  },
  
  // Data Source
  dataSource: {
    type: String,
    enum: ['user', 'usda', 'edamam', 'barcode', 'manual'],
    default: 'manual'
  },
  
  // Quality Indicators
  dataQuality: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  // Allergen Information
  allergens: [{
    type: String,
    enum: [
      'milk', 'eggs', 'fish', 'shellfish', 'tree-nuts', 
      'peanuts', 'wheat', 'soybeans', 'sesame'
    ]
  }],
  
  // Dietary Labels
  dietaryLabels: [{
    type: String,
    enum: [
      'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
      'keto-friendly', 'low-carb', 'high-protein', 'organic'
    ]
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient searching
foodSchema.index({ name: 'text', brand: 'text', searchTerms: 'text' });
foodSchema.index({ category: 1, subcategory: 1 });
foodSchema.index({ barcode: 1 }, { unique: true, sparse: true });
foodSchema.index({ usdaId: 1 }, { unique: true, sparse: true });
foodSchema.index({ usageCount: -1 });
foodSchema.index({ createdAt: -1 });
foodSchema.index({ isVerified: 1, dataQuality: -1 });

// Update timestamps
foodSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Generate search terms from name and brand
  if (this.isModified('name') || this.isModified('brand')) {
    this.generateSearchTerms();
  }
  
  next();
});

// Instance method to generate search terms
foodSchema.methods.generateSearchTerms = function() {
  const terms = new Set();
  
  // Add name words
  if (this.name) {
    this.name.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) terms.add(word);
    });
  }
  
  // Add brand words
  if (this.brand) {
    this.brand.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) terms.add(word);
    });
  }
  
  // Add category terms
  if (this.category) terms.add(this.category);
  if (this.subcategory) terms.add(this.subcategory.toLowerCase());
  
  this.searchTerms = Array.from(terms);
};

// Static method to search foods
foodSchema.statics.searchFoods = async function(query, options = {}) {
  const {
    limit = 20,
    category,
    verified,
    userId
  } = options;
  
  let searchQuery = {};
  
  // Text search
  if (query) {
    searchQuery.$or = [
      { $text: { $search: query } },
      { name: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } }
    ];
  }
  
  // Category filter
  if (category) {
    searchQuery.category = category;
  }
  
  // Verified filter
  if (verified !== undefined) {
    searchQuery.isVerified = verified;
  }
  
  // Include user's custom foods
  if (userId) {
    searchQuery.$or = searchQuery.$or || [];
    searchQuery.$or.push({ createdByUser: userId });
  }
  
  return await this.find(searchQuery)
    .sort({ usageCount: -1, _id: 1 })
    .limit(limit);
};

// Static method to find by barcode
foodSchema.statics.findByBarcode = async function(barcode) {
  return await this.findOne({ barcode });
};

// Static method to find popular foods
foodSchema.statics.getPopularFoods = async function(category = null, limit = 50) {
  let query = { usageCount: { $gt: 0 } };
  
  if (category) {
    query.category = category;
  }
  
  return await this.find(query)
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Instance method to calculate nutrition for specific amount
foodSchema.methods.calculateNutritionForAmount = function(amount, unit) {
  const servingSize = this.nutrition.servingSize;
  const servingUnit = this.nutrition.servingUnit;
  
  // Convert amount to same unit as serving size (simplified conversion)
  let conversionFactor = amount / servingSize;
  
  // Basic unit conversions (simplified)
  if (unit !== servingUnit) {
    // This would need more sophisticated unit conversion
    // For now, assume same units or handle basic conversions
    if ((unit === 'g' && servingUnit === 'ml') || (unit === 'ml' && servingUnit === 'g')) {
      // Assume 1:1 ratio for water-like density
      conversionFactor = amount / servingSize;
    }
  }
  
  const calculatedNutrition = {};
  
  Object.keys(this.nutrition.toObject()).forEach(key => {
    if (typeof this.nutrition[key] === 'number' && key !== 'servingSize') {
      calculatedNutrition[key] = Math.round(this.nutrition[key] * conversionFactor * 100) / 100;
    } else if (key !== 'servingSize' && key !== 'servingUnit') {
      calculatedNutrition[key] = this.nutrition[key];
    }
  });
  
  return calculatedNutrition;
};

// Instance method to increment usage
foodSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to add common serving
foodSchema.methods.addCommonServing = function(servingData) {
  this.commonServings.push(servingData);
  return this.save();
};

module.exports = mongoose.model('Food', foodSchema);