/* eslint-disable no-undef */
class DataTransformer {
  static transformSearchResults(usdaResponse) {
    if (!usdaResponse.foods) return [];

    return usdaResponse.foods.map(food => this.transformFoodItem(food));
  }

  static transformFoodItem(usdaFood) {
    const nutrients = this.extractNutrients(usdaFood.foodNutrients || []);
    
    return {
      id: usdaFood.fdcId,
      name: this.cleanFoodName(usdaFood.description),
      category: this.categorizeFood(usdaFood),
      image: this.getFoodEmoji(usdaFood.description),
      calories: nutrients.calories || 0,
      protein: `${nutrients.protein || 0}g`,
      carbs: `${nutrients.carbs || 0}g`,
      fat: `${nutrients.fat || 0}g`,
      fiber: `${nutrients.fiber || 0}g`,
      sugar: `${nutrients.sugar || 0}g`,
      sodium: `${nutrients.sodium || 0}mg`,
      potassium: `${nutrients.potassium || 0}mg`,
      calcium: `${nutrients.calcium || 0}mg`,
      iron: `${nutrients.iron || 0}mg`,
      vitaminC: `${nutrients.vitaminC || 0}mg`,
      tags: this.generateTags(nutrients),
      nutritionScore: this.calculateNutritionScore(nutrients),
      description: this.generateDescription(usdaFood, nutrients),
      healthBenefits: this.generateHealthBenefits(nutrients),
      dataSource: 'USDA',
      fdcId: usdaFood.fdcId
    };
  }

  static extractNutrients(foodNutrients) {
    const nutrientMap = {
      208: 'calories',    // Energy
      203: 'protein',     // Protein
      205: 'carbs',       // Carbohydrate
      204: 'fat',         // Total lipid (fat)
      291: 'fiber',       // Fiber, total dietary
      269: 'sugar',       // Sugars, total
      307: 'sodium',      // Sodium
      306: 'potassium',   // Potassium
      301: 'calcium',     // Calcium
      303: 'iron',        // Iron
      401: 'vitaminC',    // Vitamin C
    };

    const nutrients = {};

    foodNutrients.forEach(nutrient => {
      const key = nutrientMap[nutrient.nutrientId];
      if (key) {
        nutrients[key] = nutrient.value || 0;
      }
    });

    return nutrients;
  }

  static cleanFoodName(description) {
    return description
      .replace(/,.*$/, '') // Remove everything after first comma
      .replace(/\b(RAW|COOKED|FRESH|FROZEN|CANNED|DRIED)\b/gi, '') // Remove preparation methods
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static categorizeFood(food) {
    const description = food.description.toLowerCase();
    const category = food.foodCategory?.toLowerCase() || '';

    if (description.includes('fruit') || category.includes('fruit')) return 'fruits';
    if (description.includes('vegetable') || category.includes('vegetable')) return 'vegetables';
    if (description.includes('meat') || description.includes('chicken') || 
        description.includes('beef') || description.includes('fish')) return 'proteins';
    if (description.includes('grain') || description.includes('bread') || 
        description.includes('rice') || description.includes('pasta')) return 'grains';
    if (description.includes('dairy') || description.includes('milk') || 
        description.includes('cheese') || description.includes('yogurt')) return 'dairy';
    
    return 'other';
  }

  static getFoodEmoji(description) {
    const desc = description.toLowerCase();
    
    // Fruits
    if (desc.includes('apple')) return '🍎';
    if (desc.includes('banana')) return '🍌';
    if (desc.includes('orange')) return '🍊';
    if (desc.includes('strawberry')) return '🍓';
    if (desc.includes('avocado')) return '🥑';
    
    // Vegetables
    if (desc.includes('carrot')) return '🥕';
    if (desc.includes('broccoli')) return '🥦';
    if (desc.includes('spinach')) return '🥬';
    if (desc.includes('tomato')) return '🍅';
    
    // Proteins
    if (desc.includes('chicken')) return '🍗';
    if (desc.includes('beef')) return '🥩';
    if (desc.includes('fish')) return '🐟';
    if (desc.includes('egg')) return '🥚';
    
    // Grains
    if (desc.includes('bread')) return '🍞';
    if (desc.includes('rice')) return '🍚';
    if (desc.includes('pasta')) return '🍝';
    
    // Dairy
    if (desc.includes('milk')) return '🥛';
    if (desc.includes('cheese')) return '🧀';
    
    return '🍽️'; // Default food emoji
  }

  static generateTags(nutrients) {
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

  static calculateNutritionScore(nutrients) {
    let score = 0;
    
    // Positive points
    if (nutrients.protein > 10) score += 2;
    if (nutrients.fiber > 3) score += 2;
    if (nutrients.vitaminC > 10) score += 1;
    if (nutrients.potassium > 200) score += 1;
    
    // Negative points
    if (nutrients.sodium > 400) score -= 2;
    if (nutrients.sugar > 15) score -= 1;
    if (nutrients.fat > 20) score -= 1;
    
    if (score >= 4) return 'A+';
    if (score >= 2) return 'A';
    if (score >= 0) return 'B';
    return 'C';
  }

  static generateDescription(food, nutrients) {
    const protein = nutrients.protein > 15 ? 'high protein' : '';
    const fiber = nutrients.fiber > 5 ? 'high fiber' : '';
    const calories = nutrients.calories < 100 ? 'low calorie' : '';
    
    const qualities = [protein, fiber, calories].filter(Boolean);
    
    if (qualities.length > 0) {
      return `${qualities.join(', ')} food with ${nutrients.calories} calories per serving`;
    }
    
    return `Nutritious food providing ${nutrients.calories} calories per serving`;
  }

  static generateHealthBenefits(nutrients) {
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

module.exports = DataTransformer;