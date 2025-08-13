/* eslint-disable no-undef */
const axios = require('axios');

class USDAService {
  constructor() {
    this.baseURL = process.env.USDA_BASE_URL;
    this.apiKey = process.env.USDA_API_KEY;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  async searchFoods(query, pageNumber = 1, pageSize = 25) {
    try {
      const params = {
        query: query.trim(),
        pageSize,
        pageNumber
      };

      if (this.apiKey) {
        params.api_key = this.apiKey;
      }

      // Use direct axios call instead of client instance to avoid baseURL issues
      const response = await axios.get(`${this.baseURL}/foods/search`, { params });
      return response.data;
    } catch (error) {
      console.error('USDA API Search Error:', error.message);
      if (error.response) {
        console.error('USDA API Response:', error.response.status, error.response.data);
      }
      throw new Error(`Failed to search foods: ${error.message}`);
    }
  }

  async getFoodDetails(fdcId) {
    try {
      const params = {};
      if (this.apiKey) {
        params.api_key = this.apiKey;
      }

      const response = await this.client.get(`/food/${fdcId}`, { params });
      return response.data;
    } catch (error) {
      console.error('USDA API Details Error:', error.message);
      throw new Error(`Failed to get food details: ${error.message}`);
    }
  }

  async getMultipleFoods(fdcIds) {
    try {
      const data = {
        fdcIds,
        format: 'abridged',
        nutrients: [203, 204, 205, 208, 269, 291, 301, 303, 304, 401] // Key nutrients
      };

      const config = {
        headers: { 'Content-Type': 'application/json' }
      };

      if (this.apiKey) {
        data.api_key = this.apiKey;
      }

      const response = await this.client.post('/foods', data, config);
      return response.data;
    } catch (error) {
      console.error('USDA API Multiple Foods Error:', error.message);
      throw new Error(`Failed to get multiple foods: ${error.message}`);
    }
  }
}

module.exports = USDAService;