import apiService from './api';

class UserContextService {
  constructor() {
    this.cachedContext = null;
    this.lastFetch = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async getUserContext() {
    // Return cached context if still valid
    if (this.cachedContext && this.lastFetch &&
        (Date.now() - this.lastFetch) < this.cacheExpiry) {
      return this.cachedContext;
    }

    try {
      // Fetch user profile
      const profileResponse = await apiService.getProfile();
      const profileData = profileResponse ? profileResponse.profile : null;

      // Get goals from database first (same as Homepage)
      let goalsData = null;
      try {
        console.log('Checking database for current goals...');
        // Try database first if authenticated
        try {
          const apiGoalsResponse = await apiService.getCurrentGoals();
          if (apiGoalsResponse && apiGoalsResponse.goals) {
            goalsData = apiGoalsResponse.goals;
            console.log('Goals loaded from database:', goalsData);
          }
        } catch (error) {
          console.log('Database goals failed, trying localStorage...', error.message);
          // Fallback to localStorage if database fails
          const dateKey = new Date().toDateString();
          const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
          const localGoalsData = JSON.parse(savedGoalsData);

          if (localGoalsData[dateKey]) {
            goalsData = localGoalsData[dateKey].goals;
            console.log('Goals loaded from localStorage fallback:', goalsData);
          }
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }

      // Debug logging
      console.log('Final Goals Data:', goalsData);

      const context = this.buildUserContext(profileData, goalsData);

      // Debug the final context
      console.log('Final User Context:', context);
      console.log('Context Summary:', this.getContextSummary(context));

      // Cache the context
      this.cachedContext = context;
      this.lastFetch = Date.now();

      return context;
    } catch (error) {
      console.error('Failed to fetch user context:', error);
      return this.getDefaultContext();
    }
  }

  buildUserContext(profile, goals) {
    if (!profile) return this.getDefaultContext();

    const context = {
      // Basic info
      name: profile.name || 'there',
      age: profile.age,
      gender: profile.gender,

      // Physical stats
      height: profile.height ? {
        value: profile.height.value,
        unit: profile.height.unit
      } : null,
      weight: profile.weight ? {
        current: profile.weight.current,
        target: profile.weight.target,
        unit: profile.weight.unit
      } : null,

      // Goals and preferences
      primaryGoal: profile.primaryGoal || 'improve-health',
      activityLevel: profile.activityLevel || 'moderately-active',
      dietaryPreferences: profile.dietaryPreferences || [],
      allergies: profile.allergies || [],

      // Calculated values
      bmi: this.calculateBMI(profile),
      dailyCalories: this.calculateDailyCalories(profile),

      // Daily targets from goals (handle both API and localStorage formats)
      targets: goals ? {
        calories: goals.targets?.calories || goals.calorieGoal,
        water: goals.targets?.water || goals.waterGoal,
        meals: goals.targets?.meals || goals.mealsGoal,
        exercise: goals.targets?.exercise || goals.exerciseGoal,
        sleep: goals.targets?.sleep || goals.sleepGoal,
        steps: goals.targets?.steps || goals.stepsGoal,
        nutritional: goals.nutritionalTargets
      } : null
    };

    return context;
  }

  calculateBMI(profile) {
    if (!profile.weight?.current || !profile.height?.value) return null;

    let weightInKg = profile.weight.current;
    let heightInM = profile.height.value;

    // Convert to metric if needed
    if (profile.weight.unit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }
    if (profile.height.unit === 'ft') {
      heightInM = heightInM * 0.3048;
    } else {
      heightInM = heightInM / 100; // cm to m
    }

    return parseFloat((weightInKg / (heightInM * heightInM)).toFixed(1));
  }

  calculateDailyCalories(profile) {
    if (!profile.weight?.current || !profile.height?.value || !profile.age ||
        profile.gender === 'prefer-not-to-say') {
      return null;
    }

    let weightInKg = profile.weight.current;
    let heightInCm = profile.height.value;

    // Convert to metric if needed
    if (profile.weight.unit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }
    if (profile.height.unit === 'ft') {
      heightInCm = heightInCm * 30.48;
    }

    // BMR calculation (Mifflin-St Jeor Equation)
    let bmr;
    if (profile.gender === 'male') {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * profile.age + 5;
    } else {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * profile.age - 161;
    }

    // Activity factor
    const activityFactors = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extremely-active': 1.9
    };

    return Math.round(bmr * activityFactors[profile.activityLevel || 'moderately-active']);
  }

  getDefaultContext() {
    return {
      name: 'there',
      primaryGoal: 'improve-health',
      activityLevel: 'moderately-active',
      dietaryPreferences: [],
      allergies: [],
      bmi: null,
      dailyCalories: null,
      targets: null
    };
  }

  // Clear cache when user updates profile
  clearCache() {
    this.cachedContext = null;
    this.lastFetch = null;
  }

  // Get context summary for AI prompt
  getContextSummary(context = null) {
    const ctx = context || this.cachedContext;
    if (!ctx) return '';

    const parts = [];

    // Basic info
    if (ctx.name && ctx.name !== 'there') {
      parts.push(`User's name is ${ctx.name}`);
    }

    if (ctx.age) {
      parts.push(`${ctx.age} years old`);
    }

    // Goals
    if (ctx.primaryGoal) {
      const goalText = {
        'lose-weight': 'wants to lose weight',
        'gain-weight': 'wants to gain weight',
        'maintain-weight': 'wants to maintain current weight',
        'build-muscle': 'wants to build muscle',
        'improve-health': 'wants to improve overall health'
      };
      parts.push(goalText[ctx.primaryGoal] || 'has health goals');
    }

    // Dietary info
    if (ctx.dietaryPreferences?.length > 0) {
      parts.push(`follows ${ctx.dietaryPreferences.join(', ')} diet`);
    }

    if (ctx.allergies?.length > 0) {
      parts.push(`allergic to ${ctx.allergies.join(', ')}`);
    }

    // Calorie info - prioritize actual daily targets over calculated needs
    if (ctx.targets?.calories) {
      parts.push(`daily calorie target: ${ctx.targets.calories} calories`);
    } else if (ctx.dailyCalories) {
      parts.push(`estimated daily calorie needs: ${ctx.dailyCalories} calories`);
    }

    // Other daily targets
    if (ctx.targets?.water) {
      parts.push(`water target: ${ctx.targets.water} glasses/day`);
    }
    if (ctx.targets?.exercise) {
      parts.push(`exercise target: ${ctx.targets.exercise} minutes/day`);
    }

    return parts.length > 0 ? parts.join(', ') : '';
  }
}

export default new UserContextService();