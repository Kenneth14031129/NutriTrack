// services/foodService.js
class FoodService {
  constructor() {
    this.baseURL = 'https://api.nal.usda.gov/fdc/v1';
    this.apiKey = '9O3hnUvCxVu7oY8cj1s4AXLRwfn1lbt4fFL1KAoa';
  }

  async searchFoods(query, pageSize = 50) {
  try {
    const url = new URL(`${this.baseURL}/foods/search`);
    url.searchParams.append('query', query);
    url.searchParams.append('pageSize', pageSize); // Request more to filter out empty ones
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('dataType', 'Foundation,SR Legacy,Survey (FNDDS)');
    url.searchParams.append('sortBy', 'dataType.keyword');
    url.searchParams.append('sortOrder', 'asc');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return this.transformSearchResults(data);
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
}

transformSearchResults(usdaResponse) {
  if (!usdaResponse.foods) return [];
  
  const transformed = usdaResponse.foods
    .map(food => this.transformFoodItem(food))
    .filter(food => {
      // Filter out foods with no nutritional data at all
      const hasNutrition = food.calories > 0 || 
                          parseFloat(food.protein) > 0 || 
                          parseFloat(food.carbs) > 0 || 
                          parseFloat(food.fat) > 0;
      return hasNutrition;
    })
    .slice(0, 25); // Limit to 25 results with actual nutrition data
    
  return transformed;
}

  transformFoodItem(usdaFood) {
  
  if (usdaFood.foodNutrients && usdaFood.foodNutrients.length > 0) {
    console.log('Sample nutrient:', usdaFood.foodNutrients[0]);
    console.log('Sample nutrient keys:', Object.keys(usdaFood.foodNutrients[0]));
  }
  
  const nutrients = this.extractNutrients(usdaFood.foodNutrients || []);
  const qualityInfo = this.getDataQualityInfo(usdaFood);
  const foodTypes = this.extractFoodType(usdaFood.description);
  
  
  return {
  id: usdaFood.fdcId,
  name: this.cleanFoodName(usdaFood.description),
  category: this.categorizeFood(usdaFood),
  image: this.getFoodEmoji(usdaFood.description),
  calories: Math.round(nutrients.calories || 0),
  protein: `${(nutrients.protein || 0).toFixed(1)}g`,
  carbs: `${(nutrients.carbs || 0).toFixed(1)}g`,
  fat: `${(nutrients.fat || 0).toFixed(1)}g`,
  fiber: `${(nutrients.fiber || 0).toFixed(1)}g`,
  sugar: `${(nutrients.sugar || 0).toFixed(1)}g`,
  sodium: `${Math.round(nutrients.sodium || 0)}mg`,
  potassium: `${Math.round(nutrients.potassium || 0)}mg`,
  calcium: `${Math.round(nutrients.calcium || 0)}mg`,
  iron: `${(nutrients.iron || 0).toFixed(1)}mg`,
  vitaminC: `${(nutrients.vitaminC || 0).toFixed(1)}mg`,
  tags: this.generateTags(nutrients),
  nutritionScore: this.calculateNutritionScore(nutrients),
  description: this.generateDescription(nutrients, usdaFood.description),
  healthBenefits: this.generateHealthBenefits(nutrients),
  fdcId: usdaFood.fdcId,
  dataType: usdaFood.dataType,
  dataSource: usdaFood.brandOwner || 'USDA', 
  publishedDate: usdaFood.publishedDate, 
  dataQuality: qualityInfo,
  foodTypes: foodTypes,
  rawNutrients: nutrients
};
}

getDataQualityInfo(usdaFood) {
  const dataType = usdaFood.dataType;
  
  switch(dataType) {
    case 'Foundation':
      return {
        quality: 'High',
        description: 'Lab-analyzed, high-quality data',
        color: 'bg-green-100 text-green-800'
      };
    case 'SR Legacy':
      return {
        quality: 'Good',
        description: 'USDA Standard Reference data',
        color: 'bg-blue-100 text-blue-800'
      };
    case 'Survey (FNDDS)':
      return {
        quality: 'Good',
        description: 'Survey-based nutrition data',
        color: 'bg-yellow-100 text-yellow-800'
      };
    case 'Branded':
      return {
        quality: 'Variable',
        description: 'Brand-provided data',
        color: 'bg-orange-100 text-orange-800'
      };
    default:
      return {
        quality: 'Unknown',
        description: 'Data quality not specified',
        color: 'bg-gray-100 text-gray-800'
      };
  }
}

  extractNutrients(foodNutrients) {
  const nutrientMap = {
    // Using the actual nutrient IDs from the USDA API
    1008: 'calories',   // Energy
    1003: 'protein',    // Protein  
    1005: 'carbs',      // Carbohydrate, by difference
    1004: 'fat',        // Total lipid (fat)
    1079: 'fiber',      // Fiber, total dietary
    2000: 'sugar',      // Sugars, total including NLEA
    1093: 'sodium',     // Sodium, Na
    1092: 'potassium',  // Potassium, K
    1087: 'calcium',    // Calcium, Ca
    1089: 'iron',       // Iron, Fe
    1162: 'vitaminC',   // Vitamin C, total ascorbic acid
    
    // Alternative IDs that might appear
    208: 'calories',    // Energy (kcal) - legacy
    203: 'protein',     // Protein - legacy
    205: 'carbs',       // Carbohydrate - legacy
    204: 'fat',         // Fat - legacy
    291: 'fiber',       // Fiber - legacy
    269: 'sugar',       // Sugar - legacy
    307: 'sodium',      // Sodium - legacy
    306: 'potassium',   // Potassium - legacy
    301: 'calcium',     // Calcium - legacy
    303: 'iron',        // Iron - legacy
    401: 'vitaminC',    // Vitamin C - legacy
  };

  const nutrients = {};

  foodNutrients.forEach((nutrient, index) => {
    const key = nutrientMap[nutrient.nutrientId];
    if (key && nutrient.value !== undefined && nutrient.value !== null) {
      let value = nutrient.value;
      
      // Only use the value if we don't already have this nutrient or if this value is higher
      if (!nutrients[key] || nutrients[key] === 0 || value > nutrients[key]) {
        nutrients[key] = value;
      }
    }
  });

  return nutrients;
}

cleanFoodName(description) {
  // Keep important details but clean up formatting
  let cleaned = description
    .replace(/,\s*(UPC:\s*\d+.*|GTIN:\s*\d+.*)/gi, '') // Remove UPC/GTIN codes
    .replace(/\b(UPC|GTIN)\b:?\s*\d+\S*/gi, '') // Remove product codes
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .trim();

  // Capitalize first letter of each word, but keep important descriptors
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\bRaw\b/g, 'Raw')
    .replace(/\bCooked\b/g, 'Cooked')
    .replace(/\bSkinless\b/g, 'Skinless')
    .replace(/\bBoneless\b/g, 'Boneless');
}

  categorizeFood(food) {
    const description = food.description.toLowerCase();
    const category = food.foodCategory?.toLowerCase() || '';

    if (description.includes('fruit') || category.includes('fruit')) return 'fruits';
    if (description.includes('vegetable') || category.includes('vegetable')) return 'vegetables';
    if (description.includes('meat') || description.includes('chicken') || 
        description.includes('beef') || description.includes('fish') || 
        description.includes('protein')) return 'proteins';
    if (description.includes('grain') || description.includes('bread') || 
        description.includes('rice') || description.includes('pasta') ||
        description.includes('cereal')) return 'grains';
    if (description.includes('dairy') || description.includes('milk') || 
        description.includes('cheese') || description.includes('yogurt')) return 'dairy';
    
    return 'all';
  }

  getFoodEmoji(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('apple')) return '🍎';
    if (desc.includes('banana')) return '🍌';
    if (desc.includes('orange')) return '🍊';
    if (desc.includes('strawberry')) return '🍓';
    if (desc.includes('avocado')) return '🥑';
    if (desc.includes('grape')) return '🍇';
    if (desc.includes('carrot')) return '🥕';
    if (desc.includes('broccoli')) return '🥦';
    if (desc.includes('spinach')) return '🥬';
    if (desc.includes('tomato')) return '🍅';
    if (desc.includes('chicken')) return '🍗';
    if (desc.includes('beef')) return '🥩';
    if (desc.includes('fish')) return '🐟';
    if (desc.includes('egg')) return '🥚';
    if (desc.includes('bread')) return '🍞';
    if (desc.includes('rice')) return '🍚';
    if (desc.includes('milk')) return '🥛';
    if (desc.includes('cheese')) return '🧀';
    
    return '🍽️';
  }

  extractFoodType(description) {
  const desc = description.toLowerCase();
  const types = [];
  
  // Cut types
  if (desc.includes('breast')) types.push('Breast');
  if (desc.includes('thigh')) types.push('Thigh');
  if (desc.includes('drumstick')) types.push('Drumstick');
  if (desc.includes('wing')) types.push('Wing');
  if (desc.includes('ground')) types.push('Ground');
  
  // Preparation
  if (desc.includes('raw')) types.push('Raw');
  if (desc.includes('cooked') || desc.includes('braised') || desc.includes('roasted')) types.push('Cooked');
  
  // Skin/bones
  if (desc.includes('skinless')) types.push('Skinless');
  if (desc.includes('boneless')) types.push('Boneless');
  if (desc.includes('skin')) types.push('With Skin');
  
  return types;
}

  generateTags(nutrients) {
    const tags = [];
    
    if (nutrients.protein > 15) tags.push('High Protein');
    if (nutrients.fiber > 5) tags.push('High Fiber');
    if (nutrients.calories < 50) tags.push('Low Calorie');
    if (nutrients.fat < 3) tags.push('Low Fat');
    if (nutrients.sodium < 140) tags.push('Low Sodium');
    if (nutrients.vitaminC > 20) tags.push('Vitamin C Rich');
    if (nutrients.iron > 2) tags.push('Iron Rich');
    
    return tags;
  }

  calculateNutritionScore(nutrients) {
    let score = 0;
    
    if (nutrients.protein > 10) score += 2;
    if (nutrients.fiber > 3) score += 2;
    if (nutrients.vitaminC > 10) score += 1;
    if (nutrients.potassium > 200) score += 1;
    
    if (nutrients.sodium > 400) score -= 2;
    if (nutrients.sugar > 15) score -= 1;
    if (nutrients.fat > 20) score -= 1;
    
    if (score >= 4) return 'A+';
    if (score >= 2) return 'A';
    if (score >= 0) return 'B';
    return 'C';
  }

  generateDescription(nutrients, originalDescription) {
  const qualities = [];
  
  if (nutrients.protein > 15) qualities.push('high protein');
  if (nutrients.fiber > 5) qualities.push('high fiber');
  if (nutrients.calories < 100 && nutrients.calories > 0) qualities.push('low calorie');
  
  const calories = nutrients.calories || 0;
  
  if (qualities.length > 0) {
    return `${qualities.join(', ')} food${calories > 0 ? ` with ${Math.round(calories)} calories per 100g` : ''}`;
  }
  
  if (calories > 0) {
    return `Nutritious food providing ${Math.round(calories)} calories per 100g`;
  }
  
  // Fallback if no calorie data
  return `Nutritious food item from USDA database`;
}

  generateHealthBenefits(nutrients) {
    const benefits = [];
    
    if (nutrients.protein > 15) benefits.push('Muscle Building');
    if (nutrients.fiber > 5) benefits.push('Digestive Health');
    if (nutrients.potassium > 300) benefits.push('Heart Health');
    if (nutrients.calcium > 100) benefits.push('Bone Health');
    if (nutrients.iron > 2) benefits.push('Energy Boost');
    if (nutrients.vitaminC > 20) benefits.push('Immunity');
    
    return benefits.length > 0 ? benefits : ['General Health'];
  }
}

export default new FoodService();