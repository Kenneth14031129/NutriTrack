import { useState, useEffect } from "react";
import { Search, Heart, Info, Menu, Eye, BookOpen } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ViewDetails from "./ViewDetails";
import { Loader2 } from "lucide-react";
import foodService from "../../../server/services/foodService";

const FoodSearch = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [favorites, setFavorites] = useState(new Set());
  const [selectedFood, setSelectedFood] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setFoodItems([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await foodService.searchFoods(query.trim(), 50);
      setFoodItems(results);
    } catch (error) {
      setError("Failed to search foods. Please try again.");
      setFoodItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setFoodItems([]);
        setHasSearched(false);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleViewDetails = (food) => {
    setSelectedFood(food);
    setTimeout(() => {
      setDetailsOpen(true);
    }, 10);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      setSelectedFood(null);
    }, 300);
  };

  const handleAddToTracker = (food, servingSize) => {
    // This would integrate with your food tracking system
    console.log(`Added ${servingSize} serving(s) of ${food.name} to tracker`);
    // You can add your tracking logic here
    setDetailsOpen(false);
  };

  const filteredItems = foodItems.filter((item) => {
    const matchesFilter =
      activeFilter === "all" || item.category === activeFilter;
    return matchesFilter;
  });

  const toggleFavorite = (itemId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="food-search"
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 overflow-auto">
        <div className="min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Section with Glassmorphism */}
            <div className="relative mb-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    {/* Mobile menu button */}
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="lg:hidden p-2 mr-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-300"
                    >
                      <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        Food Search
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Discover nutritional information for any food
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl text-white transition-all duration-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Enhanced Search Bar */}
                <div className="relative">
                  <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Search className="w-6 h-6 text-gray-400 mr-3" />
                    <input
                      type="text"
                      placeholder="Search for foods (e.g., apple, chicken breast, spinach)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-lg"
                    />
                    {loading && (
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin ml-3" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">
                    Found{" "}
                    <span className="font-semibold text-green-600">
                      {filteredItems.length}
                    </span>{" "}
                    food items
                    {searchQuery && <span> for "{searchQuery}"</span>}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Info className="w-4 h-4 mr-1" />
                    Nutritional database
                  </div>
                </div>
              </div>
            </div>

            {/* Food Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  {/* Food Image & Nutrition Score */}
                  <div className="relative mb-4">
                    <div className="text-6xl text-center mb-4 filter group-hover:scale-110 transition-transform duration-300">
                      {item.image}
                    </div>
                    <div
                      className={`absolute top-0 right-0 ${getNutritionScoreColor(
                        item.nutritionScore
                      )} text-white text-xs px-2 py-1 rounded-full font-bold`}
                    >
                      {item.nutritionScore}
                    </div>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`absolute top-0 left-0 p-2 rounded-full transition-all duration-300 ${
                        favorites.has(item.id)
                          ? "bg-red-500 text-white"
                          : "bg-white/80 text-gray-400 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.has(item.id) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Food Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Food Type Indicators */}
                    {item.foodTypes && item.foodTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.foodTypes.slice(0, 3).map((type, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium"
                          >
                            {type}
                          </span>
                        ))}
                        {item.foodTypes.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{item.foodTypes.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Main Nutrition Info */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Calories:</span>
                          <span className="font-semibold text-orange-600">
                            {item.calories}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Protein:</span>
                          <span className="font-semibold text-blue-600">
                            {item.protein}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Carbs:</span>
                          <span className="font-semibold text-green-600">
                            {item.carbs}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Fat:</span>
                          <span className="font-semibold text-purple-600">
                            {item.fat}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Nutrients */}
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Fiber:</span>
                        <span>{item.fiber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sugar:</span>
                        <span>{item.sugar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sodium:</span>
                        <span>{item.sodium}</span>
                      </div>
                    </div>

                    {/* Health Benefits */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Health Benefits:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.healthBenefits.map((benefit, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-xl font-medium hover:from-green-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    {/* USDA Verification Link */}
                    <a
                      href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${item.fdcId}/nutrients`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-300 flex items-center justify-center space-x-2 mt-2"
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
                      <span>Verify on USDA</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <div className="p-8 max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No foods found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try a different search term or browse all categories
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

            {/* Quick Nutrition Tips */}
            <div className="fixed bottom-6 right-6">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 p-4 rounded-full shadow-2xl text-white hover:scale-110 transition-transform duration-300 cursor-pointer group">
                <Info className="w-6 h-6" />
                <div className="absolute bottom-16 right-0 bg-white text-gray-800 p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 text-sm">
                  <p className="font-medium mb-1">Quick Tip:</p>
                  <p>
                    Search by nutrients or health goals to find the perfect
                    foods for your diet!
                  </p>
                </div>
              </div>
            </div>
            {/* Add ViewDetails Panel */}
            <ViewDetails
              food={selectedFood}
              isOpen={detailsOpen}
              onClose={handleCloseDetails}
              onAddToTracker={handleAddToTracker}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodSearch;
