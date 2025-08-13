import { useState } from "react";
import {
  X,
  Heart,
  Star,
  Flame,
  Zap,
  Droplets,
  Shield,
  Activity,
  TrendingUp,
  Info,
  Plus,
  Minus,
  Calculator,
  Clock,
  Target,
  Award,
  Leaf,
  Brain,
  Eye,
  Bone,
} from "lucide-react";

const ViewDetails = ({ food, isOpen, onClose }) => {
  const [servingSize, setServingSize] = useState(1);

  if (!food) return null;

  // Calculate nutrition based on serving size
  const calculateNutrient = (value) => {
    const numericValue = parseFloat(value);
    return isNaN(numericValue)
      ? value
      : (numericValue * servingSize).toFixed(1);
  };

  const getNutritionScoreColor = (score) => {
    switch (score) {
      case "A+":
        return "bg-green-500";
      case "A":
        return "bg-green-400";
      case "B":
        return "bg-yellow-400";
      case "C":
        return "bg-orange-400";
      default:
        return "bg-gray-400";
    }
  };

  const healthBenefitIcons = {
    "Heart Health": Heart,
    "Energy Boost": Zap,
    "Digestive Health": Activity,
    "Muscle Building": TrendingUp,
    "Weight Management": Target,
    Metabolism: Flame,
    "Gut Health": Shield,
    "Bone Health": Bone,
    "Brain Function": Brain,
    "Eye Health": Eye,
    Immunity: Shield,
    "Nutrient Absorption": Droplets,
    "Protein Source": Zap,
  };

  const detailedNutrients = [
    {
      name: "Vitamin C",
      value: food.vitaminC || "N/A",
      unit: "mg",
      color: "text-orange-600",
    },
    {
      name: "Potassium",
      value: food.potassium || "N/A",
      unit: "mg",
      color: "text-purple-600",
    },
    {
      name: "Iron",
      value: food.ironContent || food.iron || "N/A",
      unit: "mg",
      color: "text-red-600",
    },
    {
      name: "Calcium",
      value: food.calcium || "N/A",
      unit: "mg",
      color: "text-blue-600",
    },
    {
      name: "Folate",
      value: food.folate || "N/A",
      unit: "mcg",
      color: "text-green-600",
    },
    {
      name: "Vitamin B6",
      value: food.vitaminB6 || "N/A",
      unit: "mg",
      color: "text-indigo-600",
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <div className="text-6xl mb-3">{food.image}</div>
            <h2 className="text-2xl font-bold mb-1">{food.name}</h2>
            <p className="text-white/90 text-sm">{food.description}</p>
            <div className="flex items-center justify-center mt-3">
              <div
                className={`${getNutritionScoreColor(
                  food.nutritionScore
                )} text-white px-3 py-1 rounded-full text-sm font-bold`}
              >
                Nutrition Score: {food.nutritionScore}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Serving Size Control */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-green-600" />
              Serving Size
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Servings:</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setServingSize(Math.max(0.25, servingSize - 0.25))
                  }
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="font-bold text-lg min-w-12 text-center">
                  {servingSize}
                </span>
                <button
                  onClick={() => setServingSize(servingSize + 0.25)}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Nutrition Facts */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
            <h3 className="font-bold text-lg text-gray-800 mb-4 text-center border-b border-gray-300 pb-2">
              Nutrition Facts
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Calories</span>
                <span className="font-bold text-xl text-orange-600">
                  {calculateNutrient(food.calories)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Protein</div>
                  <div className="font-bold text-blue-600">
                    {calculateNutrient(food.protein)}
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Carbs</div>
                  <div className="font-bold text-green-600">
                    {calculateNutrient(food.carbs)}
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Fat</div>
                  <div className="font-bold text-purple-600">
                    {calculateNutrient(food.fat)}
                  </div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Fiber</div>
                  <div className="font-bold text-amber-600">
                    {calculateNutrient(food.fiber)}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Sugar</span>
                  <span className="font-medium">
                    {calculateNutrient(food.sugar)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Sodium</span>
                  <span className="font-medium">
                    {calculateNutrient(food.sodium)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Nutrients */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-blue-600" />
              Vitamins & Minerals
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {detailedNutrients.map((nutrient, index) => (
                <div key={index} className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">
                    {nutrient.name}
                  </div>
                  <div className={`font-bold ${nutrient.color}`}>
                    {nutrient.value !== "N/A"
                      ? `${calculateNutrient(nutrient.value)} ${nutrient.unit}`
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health Benefits */}
          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Health Benefits
            </h3>
            <div className="space-y-2">
              {food.healthBenefits.map((benefit, index) => {
                const IconComponent = healthBenefitIcons[benefit] || Activity;
                return (
                  <div
                    key={index}
                    className="flex items-center p-2 bg-white rounded-lg"
                  >
                    <IconComponent className="w-4 h-4 mr-3 text-green-600" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Food Tags */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2 text-blue-600" />
              Food Properties
            </h3>
            <div className="flex flex-wrap gap-2">
              {food.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Nutritional Tips */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2 text-amber-600" />
              Did You Know?
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-start">
                <Leaf className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                This food provides essential nutrients that support your daily
                health goals.
              </p>
              <p className="flex items-start">
                <Clock className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                Best consumed as part of a balanced diet for optimal nutrition.
              </p>
              <p className="flex items-start">
                <Award className="w-4 h-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                Nutrition score based on nutrient density and health benefits.
              </p>
            </div>
          </div>

          {/* USDA Verification Link */}
          <a
            href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/nutrients`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-blue-50 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all duration-300 flex items-center justify-center space-x-2 mt-3"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Verify on USDA FoodData Central</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default ViewDetails;
