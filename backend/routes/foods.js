const express = require('express');
const Food = require('../models/Food');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/foods/search
// @desc    Search foods
// @access  Public (with optional auth for personalized results)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, category, verified, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters long' 
      });
    }

    const options = {
      limit: parseInt(limit) || 20,
      category,
      verified: verified === 'true',
      userId: req.user?.userId
    };

    const foods = await Food.searchFoods(q.trim(), options);

    res.json({
      foods,
      query: q.trim(),
      totalResults: foods.length
    });

  } catch (error) {
    console.error('Food search error:', error);
    res.status(500).json({ message: 'Server error searching foods' });
  }
});

// @route   GET /api/foods/barcode/:barcode
// @desc    Get food by barcode
// @access  Public
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    if (!barcode || barcode.length < 8) {
      return res.status(400).json({ message: 'Invalid barcode format' });
    }

    const food = await Food.findByBarcode(barcode);
    
    if (!food) {
      return res.status(404).json({ 
        message: 'Food not found for this barcode',
        barcode 
      });
    }

    res.json({ food });

  } catch (error) {
    console.error('Barcode search error:', error);
    res.status(500).json({ message: 'Server error searching by barcode' });
  }
});

// @route   GET /api/foods/popular
// @desc    Get popular foods
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { category, limit } = req.query;
    
    const foods = await Food.getPopularFoods(
      category, 
      parseInt(limit) || 50
    );

    res.json({
      foods,
      category: category || 'all'
    });

  } catch (error) {
    console.error('Popular foods fetch error:', error);
    res.status(500).json({ message: 'Server error fetching popular foods' });
  }
});

// @route   GET /api/foods/categories
// @desc    Get food categories
// @access  Public
router.get('/categories', (req, res) => {
  const categories = [
    { value: 'fruits', label: 'Fruits' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'grains', label: 'Grains' },
    { value: 'protein', label: 'Protein' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'fats-oils', label: 'Fats & Oils' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'condiments', label: 'Condiments' },
    { value: 'sweets', label: 'Sweets' },
    { value: 'prepared-meals', label: 'Prepared Meals' },
    { value: 'other', label: 'Other' }
  ];

  res.json({ categories });
});

// Protected routes below (require authentication)
router.use(auth);

// @route   POST /api/foods
// @desc    Create custom food
// @access  Private
router.post('/', async (req, res) => {
  try {
    const foodData = {
      ...req.body,
      isUserCreated: true,
      createdByUser: req.user.userId,
      dataSource: 'manual'
    };

    // Validate required nutrition fields
    const requiredNutrition = ['calories', 'protein', 'carbs', 'fat'];
    for (const field of requiredNutrition) {
      if (foodData.nutrition?.[field] === undefined) {
        return res.status(400).json({ 
          message: `Nutrition field '${field}' is required` 
        });
      }
    }

    const food = new Food(foodData);
    await food.save();

    res.status(201).json({
      message: 'Custom food created successfully',
      food
    });

  } catch (error) {
    console.error('Food creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Food with this barcode already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error creating food' });
  }
});

// @route   GET /api/foods/my-foods
// @desc    Get user's custom foods
// @access  Private
router.get('/my-foods', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const foods = await Food.find({ createdByUser: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      foods,
      totalCount: foods.length
    });

  } catch (error) {
    console.error('My foods fetch error:', error);
    res.status(500).json({ message: 'Server error fetching your foods' });
  }
});

// @route   GET /api/foods/:id
// @desc    Get single food
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.json({ food });

  } catch (error) {
    console.error('Food fetch error:', error);
    res.status(500).json({ message: 'Server error fetching food' });
  }
});

// @route   PUT /api/foods/:id
// @desc    Update custom food
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user can edit this food
    if (food.createdByUser?.toString() !== req.user.userId && !food.isUserCreated) {
      return res.status(403).json({ 
        message: 'You can only edit foods you created' 
      });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'brand', 'nutrition', 'category', 'subcategory',
      'commonServings', 'tags', 'allergens', 'dietaryLabels'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        food[field] = req.body[field];
      }
    });

    await food.save();

    res.json({
      message: 'Food updated successfully',
      food
    });

  } catch (error) {
    console.error('Food update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error updating food' });
  }
});

// @route   POST /api/foods/:id/use
// @desc    Track food usage
// @access  Private
router.post('/:id/use', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    await food.incrementUsage();

    res.json({
      message: 'Food usage tracked',
      usageCount: food.usageCount
    });

  } catch (error) {
    console.error('Food usage tracking error:', error);
    res.status(500).json({ message: 'Server error tracking food usage' });
  }
});

// @route   POST /api/foods/:id/calculate
// @desc    Calculate nutrition for specific amount
// @access  Private
router.post('/:id/calculate', async (req, res) => {
  try {
    const { amount, unit } = req.body;
    
    if (!amount || !unit) {
      return res.status(400).json({ 
        message: 'Amount and unit are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than 0' 
      });
    }

    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const calculatedNutrition = food.calculateNutritionForAmount(amount, unit);

    res.json({
      food: {
        id: food._id,
        name: food.name,
        brand: food.brand
      },
      amount,
      unit,
      calculatedNutrition
    });

  } catch (error) {
    console.error('Nutrition calculation error:', error);
    res.status(500).json({ message: 'Server error calculating nutrition' });
  }
});

// @route   POST /api/foods/:id/serving
// @desc    Add common serving to food
// @access  Private
router.post('/:id/serving', async (req, res) => {
  try {
    const { name, amount, unit } = req.body;
    
    if (!name || !amount || !unit) {
      return res.status(400).json({ 
        message: 'Name, amount, and unit are required' 
      });
    }

    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user can edit this food
    if (food.createdByUser?.toString() !== req.user.userId && !food.isUserCreated) {
      return res.status(403).json({ 
        message: 'You can only add servings to foods you created' 
      });
    }

    await food.addCommonServing({ name, amount, unit });

    res.json({
      message: 'Common serving added successfully',
      food
    });

  } catch (error) {
    console.error('Add serving error:', error);
    res.status(500).json({ message: 'Server error adding serving' });
  }
});

// @route   DELETE /api/foods/:id
// @desc    Delete custom food
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user can delete this food
    if (food.createdByUser?.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'You can only delete foods you created' 
      });
    }

    await Food.findByIdAndDelete(req.params.id);

    res.json({ message: 'Food deleted successfully' });

  } catch (error) {
    console.error('Food deletion error:', error);
    res.status(500).json({ message: 'Server error deleting food' });
  }
});

module.exports = router;