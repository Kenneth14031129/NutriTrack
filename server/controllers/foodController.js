/* eslint-disable no-undef */
const USDAService = require('../services/usdaService');
const DataTransformer = require('../utils/dataTransformer');

const usdaService = new USDAService();

class FoodController {
  async searchFoods(req, res) {
    try {
      const { query, page = 1, limit = 25, category } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: 'Search query must be at least 2 characters long'
        });
      }

      // Add category filter to query if provided
      let searchQuery = query.trim();
      if (category && category !== 'all') {
        searchQuery += ` ${category}`;
      }

      const usdaResponse = await usdaService.searchFoods(
        searchQuery,
        parseInt(page),
        parseInt(limit)
      );

      const transformedFoods = DataTransformer.transformSearchResults(usdaResponse);

      // Filter by category if specified and not already in query
      let filteredFoods = transformedFoods;
      if (category && category !== 'all') {
        filteredFoods = transformedFoods.filter(food => food.category === category);
      }

      res.json({
        foods: filteredFoods,
        totalHits: usdaResponse.totalHits,
        currentPage: parseInt(page),
        totalPages: Math.ceil(usdaResponse.totalHits / parseInt(limit)),
        pageSize: parseInt(limit)
      });

    } catch (error) {
      console.error('Search Foods Error:', error);
      res.status(500).json({
        error: 'Failed to search foods',
        message: error.message
      });
    }
  }

  async getFoodDetails(req, res) {
    try {
      const { fdcId } = req.params;

      if (!fdcId) {
        return res.status(400).json({ error: 'Food ID is required' });
      }

      const usdaFood = await usdaService.getFoodDetails(fdcId);
      const transformedFood = DataTransformer.transformFoodItem(usdaFood);

      res.json(transformedFood);

    } catch (error) {
      console.error('Get Food Details Error:', error);
      res.status(500).json({
        error: 'Failed to get food details',
        message: error.message
      });
    }
  }

  async getMultipleFoods(req, res) {
    try {
      const { fdcIds } = req.body;

      if (!fdcIds || !Array.isArray(fdcIds) || fdcIds.length === 0) {
        return res.status(400).json({ error: 'Valid fdcIds array is required' });
      }

      const usdaFoods = await usdaService.getMultipleFoods(fdcIds);
      const transformedFoods = usdaFoods.map(food => 
        DataTransformer.transformFoodItem(food)
      );

      res.json(transformedFoods);

    } catch (error) {
      console.error('Get Multiple Foods Error:', error);
      res.status(500).json({
        error: 'Failed to get multiple foods',
        message: error.message
      });
    }
  }
}

module.exports = new FoodController();