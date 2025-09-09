const express = require('express');
const Meal = require('../models/Meal');
const Progress = require('../models/Progress');
const Goal = require('../models/Goal');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/meals
// @desc    Create a new meal
// @access  Private
router.post('/', async (req, res) => {
  try {
    const mealData = {
      ...req.body,
      userId: req.user.userId
    };

    const meal = new Meal(mealData);
    await meal.save();

    res.status(201).json({
      message: 'Meal created successfully',
      meal
    });

  } catch (error) {
    console.error('Meal creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error creating meal' });
  }
});

// @route   GET /api/meals/today
// @desc    Get today's meals
// @access  Private
router.get('/today', async (req, res) => {
  try {
    const meals = await Meal.getMealsForDate(req.user.userId, new Date());
    
    // Group meals by type
    const mealsByType = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    
    meals.forEach(meal => {
      if (mealsByType[meal.type]) {
        mealsByType[meal.type].push(meal);
      }
    });

    // Calculate daily nutrition totals
    let dailyTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };
    
    meals.forEach(meal => {
      Object.keys(dailyTotals).forEach(nutrient => {
        dailyTotals[nutrient] += meal.totalNutrition[nutrient] || 0;
      });
    });

    res.json({
      meals: mealsByType,
      dailyTotals,
      totalMeals: meals.length
    });

  } catch (error) {
    console.error('Today meals fetch error:', error);
    res.status(500).json({ message: 'Server error fetching today\'s meals' });
  }
});

// @route   GET /api/meals/date/:date
// @desc    Get meals for specific date
// @access  Private
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const meals = await Meal.getMealsForDate(req.user.userId, targetDate);
    
    // Group meals by type
    const mealsByType = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    
    meals.forEach(meal => {
      if (mealsByType[meal.type]) {
        mealsByType[meal.type].push(meal);
      }
    });

    res.json({
      date: targetDate,
      meals: mealsByType,
      totalMeals: meals.length
    });

  } catch (error) {
    console.error('Date meals fetch error:', error);
    res.status(500).json({ message: 'Server error fetching meals for date' });
  }
});

// @route   GET /api/meals/week/:startDate
// @desc    Get weekly meal plan
// @access  Private
router.get('/week/:startDate', async (req, res) => {
  try {
    const { startDate } = req.params;
    
    const startOfWeek = new Date(startDate);
    if (isNaN(startOfWeek.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const weeklyMeals = await Meal.getWeeklyMealPlan(req.user.userId, startOfWeek);
    
    // Group meals by date and type
    const mealPlan = {};
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      mealPlan[dateKey] = {
        date: currentDate,
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      };
    }
    
    weeklyMeals.forEach(meal => {
      const dateKey = meal.date.toISOString().split('T')[0];
      if (mealPlan[dateKey] && mealPlan[dateKey][meal.type]) {
        mealPlan[dateKey][meal.type].push(meal);
      }
    });

    res.json({
      startDate: startOfWeek,
      mealPlan,
      totalMeals: weeklyMeals.length
    });

  } catch (error) {
    console.error('Weekly meal plan fetch error:', error);
    res.status(500).json({ message: 'Server error fetching weekly meal plan' });
  }
});

// @route   GET /api/meals/:id
// @desc    Get single meal by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to access this meal' });
    }

    res.json({ meal });

  } catch (error) {
    console.error('Meal fetch error:', error);
    res.status(500).json({ message: 'Server error fetching meal' });
  }
});

// @route   PUT /api/meals/:id
// @desc    Update meal
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this meal' });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'type', 'date', 'plannedTime', 
      'foods', 'status', 'notes', 'tags', 'rating', 
      'prepTime', 'difficulty', 'recipe'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        meal[field] = req.body[field];
      }
    });

    await meal.save();

    res.json({
      message: 'Meal updated successfully',
      meal
    });

  } catch (error) {
    console.error('Meal update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error updating meal' });
  }
});

// @route   PUT /api/meals/:id/status
// @desc    Update meal status
// @access  Private
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['planned', 'prepared', 'consumed', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this meal' });
    }

    await meal.updateStatus(status);

    // If meal is consumed, add to progress
    if (status === 'consumed') {
      try {
        const goals = await Goal.getGoalsForDate(req.user.userId, meal.date);
        if (goals) {
          const progress = await Progress.getOrCreateProgress(
            req.user.userId, 
            goals._id, 
            meal.date
          );

          // Add meal activity to progress
          await progress.addActivity({
            activityType: 'food',
            description: meal.name,
            value: meal.totalNutrition.calories,
            unit: 'calories',
            metadata: {
              mealId: meal._id,
              nutrition: meal.totalNutrition
            }
          });
        }
      } catch (progressError) {
        console.error('Progress update error:', progressError);
        // Don't fail the meal status update if progress update fails
      }
    }

    res.json({
      message: 'Meal status updated successfully',
      meal
    });

  } catch (error) {
    console.error('Meal status update error:', error);
    res.status(500).json({ message: 'Server error updating meal status' });
  }
});

// @route   POST /api/meals/:id/duplicate
// @desc    Duplicate meal for another date
// @access  Private
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { newDate, newType } = req.body;
    
    if (!newDate) {
      return res.status(400).json({ message: 'New date is required' });
    }

    const targetDate = new Date(newDate);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const originalMeal = await Meal.findById(req.params.id);
    
    if (!originalMeal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (originalMeal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to duplicate this meal' });
    }

    const duplicatedMeal = await originalMeal.duplicateForDate(targetDate, newType);

    res.status(201).json({
      message: 'Meal duplicated successfully',
      meal: duplicatedMeal
    });

  } catch (error) {
    console.error('Meal duplication error:', error);
    res.status(500).json({ message: 'Server error duplicating meal' });
  }
});

// @route   POST /api/meals/:id/foods
// @desc    Add food to meal
// @access  Private
router.post('/:id/foods', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify this meal' });
    }

    await meal.addFood(req.body);

    res.json({
      message: 'Food added to meal successfully',
      meal
    });

  } catch (error) {
    console.error('Add food to meal error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error adding food to meal' });
  }
});

// @route   DELETE /api/meals/:id/foods/:foodIndex
// @desc    Remove food from meal
// @access  Private
router.delete('/:id/foods/:foodIndex', async (req, res) => {
  try {
    const { foodIndex } = req.params;
    const foodIdx = parseInt(foodIndex);

    if (isNaN(foodIdx) || foodIdx < 0) {
      return res.status(400).json({ message: 'Invalid food index' });
    }

    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify this meal' });
    }

    await meal.removeFood(foodIdx);

    res.json({
      message: 'Food removed from meal successfully',
      meal
    });

  } catch (error) {
    console.error('Remove food from meal error:', error);
    res.status(500).json({ message: 'Server error removing food from meal' });
  }
});

// @route   DELETE /api/meals/:id
// @desc    Delete meal
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check ownership
    if (meal.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this meal' });
    }

    await Meal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Meal deleted successfully' });

  } catch (error) {
    console.error('Meal deletion error:', error);
    res.status(500).json({ message: 'Server error deleting meal' });
  }
});

// @route   GET /api/meals/search
// @desc    Search user's meals
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q, type, status, limit = 20 } = req.query;
    
    let query = { userId: req.user.userId };
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }

    const meals = await Meal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ meals });

  } catch (error) {
    console.error('Meal search error:', error);
    res.status(500).json({ message: 'Server error searching meals' });
  }
});

module.exports = router;