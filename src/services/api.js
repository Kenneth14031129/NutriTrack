const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = sessionStorage.getItem('authToken');
  }

  // Helper method to get headers
  getHeaders() {
    // Always get fresh token from sessionStorage
    this.token = sessionStorage.getItem('authToken');

    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method to handle responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    return response.json();
  }

  // Authentication
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await this.handleResponse(response);
    if (data.token) {
      this.token = data.token;
      sessionStorage.setItem('authToken', data.token);
    }
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    });
    
    const data = await this.handleResponse(response);
    if (data.token) {
      this.token = data.token;
      sessionStorage.setItem('authToken', data.token);
    }
    return data;
  }

  logout() {
    this.token = null;
    sessionStorage.removeItem('authToken');
  }

  // Goals
  async createGoals(goalsData) {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(goalsData)
    });
    
    return this.handleResponse(response);
  }

  async getCurrentGoals() {
    const response = await fetch(`${API_BASE_URL}/goals/current`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async updateGoals(goalId, goalsData) {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(goalsData)
    });

    return this.handleResponse(response);
  }

  async deleteCurrentGoals() {
    const response = await fetch(`${API_BASE_URL}/goals/current`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  // Progress
  async getTodayProgress() {
    const response = await fetch(`${API_BASE_URL}/progress/today`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async updateProgress(type, value, operation = 'add') {
    const response = await fetch(`${API_BASE_URL}/progress/update/${type}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ value, operation })
    });
    
    return this.handleResponse(response);
  }

  async addActivity(activityData) {
    const response = await fetch(`${API_BASE_URL}/progress/activity`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(activityData)
    });

    return this.handleResponse(response);
  }

  async deleteTodayProgress() {
    const response = await fetch(`${API_BASE_URL}/progress/today`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  // User Dashboard
  async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/users/dashboard`, {
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  // User Profile
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    });

    return this.handleResponse(response);
  }

  // Meals
  async createMeal(mealData) {
    const response = await fetch(`${API_BASE_URL}/meals`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(mealData)
    });
    
    return this.handleResponse(response);
  }

  async getTodayMeals() {
    const response = await fetch(`${API_BASE_URL}/meals/today`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getMealsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/meals/date/${dateString}`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getWeeklyMealPlan(startDate) {
    const dateString = startDate.toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/meals/week/${dateString}`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async updateMeal(mealId, mealData) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(mealData)
    });
    
    return this.handleResponse(response);
  }

  async deleteMeal(mealId) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async updateMealStatus(mealId, status) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    
    return this.handleResponse(response);
  }

  async duplicateMeal(mealId, newDate, newType) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}/duplicate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newDate, newType })
    });
    
    return this.handleResponse(response);
  }

  // Foods
  async searchFoods(query, options = {}) {
    const params = new URLSearchParams({ q: query, ...options });
    const response = await fetch(`${API_BASE_URL}/foods/search?${params}`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getFoodsByBarcode(barcode) {
    const response = await fetch(`${API_BASE_URL}/scanner/barcode`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ barcode })
    });
    
    return this.handleResponse(response);
  }

  // Scanner
  async scanBarcode(barcode) {
    const response = await fetch(`${API_BASE_URL}/scanner/barcode`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ barcode })
    });
    
    return this.handleResponse(response);
  }

  async scanText(text) {
    const response = await fetch(`${API_BASE_URL}/scanner/text`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text })
    });
    
    return this.handleResponse(response);
  }

  async scanImage(imageData) {
    const response = await fetch(`${API_BASE_URL}/scanner/text`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ image: imageData })
    });
    
    return this.handleResponse(response);
  }

  async getRecentScans() {
    const response = await fetch(`${API_BASE_URL}/scanner/recent`, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiService();