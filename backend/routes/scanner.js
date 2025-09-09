const express = require('express');
const axios = require('axios');
const Food = require('../models/Food');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// External API configuration
const USDA_API_KEY = process.env.USDA_API_KEY;
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

// @route   POST /api/scanner/barcode
// @desc    Scan barcode and get food information
// @access  Private
router.post('/barcode', async (req, res) => {
  try {
    const { barcode } = req.body;
    
    if (!barcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    // First, check our local database
    let food = await Food.findByBarcode(barcode);
    
    if (food) {
      await food.incrementUsage();
      return res.json({
        source: 'local',
        food,
        message: 'Food found in local database'
      });
    }

    // If not found locally, try external APIs
    let externalFood = null;
    
    // Try Open Food Facts API first (free and comprehensive for barcodes)
    try {
      externalFood = await searchOpenFoodFacts(barcode);
    } catch (error) {
      console.error('Open Food Facts API error:', error.message);
    }

    // If Open Food Facts fails, try other APIs
    if (!externalFood && EDAMAM_APP_ID && EDAMAM_APP_KEY) {
      try {
        externalFood = await searchEdamamByBarcode(barcode);
      } catch (error) {
        console.error('Edamam API error:', error.message);
      }
    }

    if (!externalFood) {
      return res.status(404).json({ 
        message: 'Food not found for this barcode',
        barcode,
        suggestion: 'Try manual entry or check if the barcode is correct'
      });
    }

    // Save the external food to our database
    const newFood = new Food({
      ...externalFood,
      barcode,
      isUserCreated: false,
      isVerified: true,
      dataSource: externalFood.dataSource || 'barcode',
      dataQuality: 'medium'
    });

    await newFood.save();
    await newFood.incrementUsage();

    res.json({
      source: 'external',
      food: newFood,
      message: 'Food found via external API and saved to database'
    });

  } catch (error) {
    console.error('Barcode scan error:', error);
    
    if (error.code === 11000) {
      // Duplicate barcode - fetch the existing one
      const existingFood = await Food.findByBarcode(req.body.barcode);
      return res.json({
        source: 'local',
        food: existingFood,
        message: 'Food already exists in database'
      });
    }
    
    res.status(500).json({ message: 'Server error scanning barcode' });
  }
});

// @route   POST /api/scanner/text
// @desc    Scan text/image and extract food information
// @access  Private
router.post('/text', async (req, res) => {
  try {
    const { text, image } = req.body;
    
    if (!text && !image) {
      return res.status(400).json({ 
        message: 'Either text or image data is required' 
      });
    }

    // For now, treat this as a text search if text is provided
    if (text) {
      const foods = await Food.searchFoods(text, { 
        limit: 10,
        userId: req.user.userId 
      });

      return res.json({
        extractedText: text,
        suggestedFoods: foods,
        message: 'Text processed and food suggestions provided'
      });
    }

    // Image processing would go here
    // This would require OCR services like Google Vision API, AWS Rekognition, etc.
    if (image) {
      // Placeholder for image processing
      return res.json({
        message: 'Image processing not yet implemented',
        suggestion: 'Please use text input or barcode scanning for now'
      });
    }

  } catch (error) {
    console.error('Text scan error:', error);
    res.status(500).json({ message: 'Server error processing text/image' });
  }
});

// @route   POST /api/scanner/nutrition-label
// @desc    Extract nutrition information from label image
// @access  Private
router.post('/nutrition-label', async (req, res) => {
  try {
    const { image, text } = req.body;
    
    if (!image && !text) {
      return res.status(400).json({ 
        message: 'Image or text data is required' 
      });
    }

    // Placeholder for nutrition label OCR processing
    // This would extract nutrition facts from an image
    res.json({
      message: 'Nutrition label processing not yet implemented',
      suggestion: 'Please manually enter nutrition information for now',
      extractedData: null
    });

  } catch (error) {
    console.error('Nutrition label scan error:', error);
    res.status(500).json({ message: 'Server error processing nutrition label' });
  }
});

// @route   GET /api/scanner/recent
// @desc    Get recently scanned foods
// @access  Private
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentFoods = await Food.find({
      $or: [
        { createdByUser: req.user.userId },
        { lastUsed: { $exists: true } }
      ]
    })
    .sort({ lastUsed: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      recentFoods,
      message: 'Recent scanned foods retrieved'
    });

  } catch (error) {
    console.error('Recent foods fetch error:', error);
    res.status(500).json({ message: 'Server error fetching recent foods' });
  }
});

// Helper function to search Open Food Facts API
async function searchOpenFoodFacts(barcode) {
  const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
    timeout: 5000
  });

  const product = response.data.product;
  if (!product || response.data.status !== 1) {
    throw new Error('Product not found in Open Food Facts');
  }

  // Map Open Food Facts data to our food schema
  const nutriments = product.nutriments || {};
  
  return {
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || '',
    nutrition: {
      servingSize: 100,
      servingUnit: 'g',
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments.energy_100g * 0.239 || 0),
      protein: Math.round((nutriments.proteins_100g || 0) * 100) / 100,
      carbs: Math.round((nutriments.carbohydrates_100g || 0) * 100) / 100,
      fat: Math.round((nutriments.fat_100g || 0) * 100) / 100,
      fiber: Math.round((nutriments.fiber_100g || 0) * 100) / 100,
      sugar: Math.round((nutriments.sugars_100g || 0) * 100) / 100,
      sodium: Math.round((nutriments.sodium_100g || 0) * 1000) / 100, // Convert g to mg
      calcium: Math.round((nutriments.calcium_100g || 0) * 1000) / 100,
      iron: Math.round((nutriments.iron_100g || 0) * 1000) / 100
    },
    category: mapOpenFoodFactsCategory(product.categories),
    dataSource: 'barcode',
    searchTerms: [
      product.product_name?.toLowerCase(),
      product.brands?.toLowerCase(),
      ...(product.categories_tags || [])
    ].filter(Boolean)
  };
}

// Helper function to search Edamam API by barcode
async function searchEdamamByBarcode(barcode) {
  // Note: Edamam doesn't have direct barcode lookup
  // This is a placeholder for potential future integration
  throw new Error('Edamam barcode search not implemented');
}

// Helper function to map Open Food Facts categories to our categories
function mapOpenFoodFactsCategory(categoriesString) {
  if (!categoriesString) return 'other';
  
  const categories = categoriesString.toLowerCase();
  
  if (categories.includes('fruit') || categories.includes('apple') || categories.includes('orange')) {
    return 'fruits';
  }
  if (categories.includes('vegetable') || categories.includes('tomato') || categories.includes('carrot')) {
    return 'vegetables';
  }
  if (categories.includes('dairy') || categories.includes('milk') || categories.includes('cheese')) {
    return 'dairy';
  }
  if (categories.includes('meat') || categories.includes('chicken') || categories.includes('beef')) {
    return 'protein';
  }
  if (categories.includes('bread') || categories.includes('cereal') || categories.includes('grain')) {
    return 'grains';
  }
  if (categories.includes('beverage') || categories.includes('drink') || categories.includes('juice')) {
    return 'beverages';
  }
  if (categories.includes('snack') || categories.includes('chip') || categories.includes('cookie')) {
    return 'snacks';
  }
  if (categories.includes('sweet') || categories.includes('candy') || categories.includes('chocolate')) {
    return 'sweets';
  }
  
  return 'other';
}

module.exports = router;