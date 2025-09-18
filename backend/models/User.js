const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxLength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  // Personal Details
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  height: {
    value: Number,
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },
  weight: {
    current: Number,
    target: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  
  // Activity & Preferences
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extremely-active'],
    default: 'moderately-active'
  },
  dietaryPreferences: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free', 'dairy-free', 'low-carb', 'high-protein']
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  
  // Goals & Settings
  primaryGoal: {
    type: String,
    enum: ['lose-weight', 'gain-weight', 'maintain-weight', 'build-muscle', 'improve-health'],
    default: 'maintain-weight'
  },
  
  // App Settings
  units: {
    weight: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    },
    height: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    },
    liquid: {
      type: String,
      enum: ['ml', 'fl-oz'],
      default: 'ml'
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    reminders: {
      type: Boolean,
      default: true
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },

  // OTP Verification
  otp: {
    code: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    },
    attempts: {
      type: Number,
      default: 0,
      select: false
    },
    isUsed: {
      type: Boolean,
      default: false,
      select: false
    }
  },
  
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate BMI
userSchema.methods.calculateBMI = function() {
  if (!this.weight?.current || !this.height?.value) return null;
  
  let weightInKg = this.weight.current;
  let heightInM = this.height.value;
  
  // Convert to metric if needed
  if (this.weight.unit === 'lbs') {
    weightInKg = weightInKg * 0.453592;
  }
  if (this.height.unit === 'ft') {
    heightInM = heightInM * 0.3048;
  } else {
    heightInM = heightInM / 100; // cm to m
  }
  
  return (weightInKg / (heightInM * heightInM)).toFixed(1);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Calculate daily calorie needs (Mifflin-St Jeor Equation)
userSchema.methods.calculateDailyCalories = function() {
  if (!this.weight?.current || !this.height?.value || !this.age || this.gender === 'prefer-not-to-say') {
    return null;
  }

  let weightInKg = this.weight.current;
  let heightInCm = this.height.value;

  // Convert to metric if needed
  if (this.weight.unit === 'lbs') {
    weightInKg = weightInKg * 0.453592;
  }
  if (this.height.unit === 'ft') {
    heightInCm = heightInCm * 30.48;
  }

  // BMR calculation
  let bmr;
  if (this.gender === 'male') {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * this.age + 5;
  } else {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * this.age - 161;
  }

  // Activity factor
  const activityFactors = {
    'sedentary': 1.2,
    'lightly-active': 1.375,
    'moderately-active': 1.55,
    'very-active': 1.725,
    'extremely-active': 1.9
  };

  return Math.round(bmr * activityFactors[this.activityLevel]);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    attempts: 0,
    isUsed: false
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(inputOtp) {
  if (!this.otp || !this.otp.code) {
    return { success: false, message: 'No OTP found' };
  }

  if (this.otp.isUsed) {
    return { success: false, message: 'OTP has already been used' };
  }

  if (new Date() > this.otp.expiresAt) {
    return { success: false, message: 'OTP has expired' };
  }

  if (this.otp.attempts >= 3) {
    return { success: false, message: 'Maximum OTP attempts exceeded' };
  }

  this.otp.attempts += 1;

  if (this.otp.code === inputOtp) {
    this.otp.isUsed = true;
    this.isVerified = true;
    return { success: true, message: 'OTP verified successfully' };
  }

  return { success: false, message: 'Invalid OTP' };
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = {
    code: null,
    expiresAt: null,
    attempts: 0,
    isUsed: false
  };
};

module.exports = mongoose.model('User', userSchema);