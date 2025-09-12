import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  ChefHat,
  Search,
  Trash2,
  Menu,
  Check,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import apiService from "../services/api";

const MealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week"); // week, day
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plannedMeals, setPlannedMeals] = useState({});
  const [, setLoading] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealForm, setMealForm] = useState({
    name: "",
    type: "breakfast",
    plannedTime: "08:00",
    foods: [],
    notes: "",
  });
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [searchedFoods, setSearchedFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", icon: "🌅", time: "8:00 AM" },
    { id: "lunch", label: "Lunch", icon: "☀️", time: "12:00 PM" },
    { id: "dinner", label: "Dinner", icon: "🌙", time: "6:00 PM" },
    { id: "snack", label: "Snacks", icon: "🍎", time: "Anytime" },
  ];

  // Load meals for the selected week
  const loadWeeklyMeals = async (startDate) => {
    if (!apiService.isAuthenticated()) {
      const dateKey = startDate.toISOString().split("T")[0];
      setPlannedMeals({
        [dateKey]: { breakfast: [], lunch: [], dinner: [], snack: [] },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getWeeklyMealPlan(startDate);
      setPlannedMeals(response.mealPlan || {});
    } catch (error) {
      console.error("Error loading weekly meals:", error);
      setPlannedMeals({});
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get start of week
  const getWeekStart = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    return startOfWeek;
  };

  // Load meals when component mounts or date changes
  useEffect(() => {
    const startOfWeek = getWeekStart(selectedDate);
    loadWeeklyMeals(startOfWeek);
  }, [selectedDate]);

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const getMealsForDate = (date) => {
    const dateStr = formatDate(date);
    return (
      plannedMeals[dateStr] || {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      }
    );
  };

  // Create new meal
  const handleCreateMeal = async () => {
    if (!mealForm.name.trim()) return;

    try {
      const mealData = {
        ...mealForm,
        date: selectedDate.toISOString().split("T")[0],
        foods: mealForm.foods || [],
      };

      if (apiService.isAuthenticated()) {
        await apiService.createMeal(mealData);
        // Reload meals
        const startOfWeek = getWeekStart(selectedDate);
        loadWeeklyMeals(startOfWeek);
      } else {
        // Fallback for demo mode
        const newMeal = {
          _id: Date.now().toString(),
          ...mealData,
          totalNutrition: { calories: 300, protein: 15, carbs: 25, fat: 12 },
          status: "planned",
        };

        const dateKey = selectedDate.toISOString().split("T")[0];
        const currentMeals = plannedMeals[dateKey] || {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
        };

        setPlannedMeals((prev) => ({
          ...prev,
          [dateKey]: {
            ...currentMeals,
            [mealForm.type]: [...(currentMeals[mealForm.type] || []), newMeal],
          },
        }));
      }

      // Reset form
      setMealForm({
        name: "",
        type: "breakfast",
        plannedTime: "08:00",
        foods: [],
        notes: "",
      });
      setShowMealModal(false);
    } catch (error) {
      console.error("Error creating meal:", error);
    }
  };

  // Delete meal
  const handleDeleteMeal = async (mealId, date, type) => {
    try {
      if (apiService.isAuthenticated()) {
        await apiService.deleteMeal(mealId);
        // Reload meals
        const startOfWeek = getWeekStart(selectedDate);
        loadWeeklyMeals(startOfWeek);
      } else {
        // Fallback for demo mode
        const dateKey =
          typeof date === "string" ? date : date.toISOString().split("T")[0];
        setPlannedMeals((prev) => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            [type]:
              prev[dateKey]?.[type]?.filter((meal) => meal._id !== mealId) ||
              [],
          },
        }));
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  // Update meal status
  const handleUpdateMealStatus = async (mealId, status) => {
    try {
      if (apiService.isAuthenticated()) {
        await apiService.updateMealStatus(mealId, status);
        // Reload meals to reflect changes
        const startOfWeek = getWeekStart(selectedDate);
        loadWeeklyMeals(startOfWeek);
      }
    } catch (error) {
      console.error("Error updating meal status:", error);
    }
  };

  // Search foods
  const searchFoods = async (query) => {
    if (!query.trim()) {
      setSearchedFoods([]);
      return;
    }

    setLoadingFoods(true);
    try {
      if (apiService.isAuthenticated()) {
        const response = await apiService.searchFoods(query, { limit: 10 });
        setSearchedFoods(response.foods || []);
      } else {
        // Sample foods for demo
        const sampleFoods = [
          {
            _id: "1",
            name: "Chicken Breast",
            nutrition: {
              calories: 165,
              protein: 31,
              carbs: 0,
              fat: 3.6,
              servingSize: 100,
              servingUnit: "g",
            },
          },
          {
            _id: "2",
            name: "Brown Rice",
            nutrition: {
              calories: 123,
              protein: 2.6,
              carbs: 23,
              fat: 0.9,
              servingSize: 100,
              servingUnit: "g",
            },
          },
          {
            _id: "3",
            name: "Broccoli",
            nutrition: {
              calories: 34,
              protein: 2.8,
              carbs: 7,
              fat: 0.4,
              servingSize: 100,
              servingUnit: "g",
            },
          },
          {
            _id: "4",
            name: "Salmon",
            nutrition: {
              calories: 208,
              protein: 22,
              carbs: 0,
              fat: 13,
              servingSize: 100,
              servingUnit: "g",
            },
          },
          {
            _id: "5",
            name: "Avocado",
            nutrition: {
              calories: 160,
              protein: 2,
              carbs: 9,
              fat: 15,
              servingSize: 100,
              servingUnit: "g",
            },
          },
        ].filter((food) =>
          food.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchedFoods(sampleFoods);
      }
    } catch (error) {
      console.error("Error searching foods:", error);
      setSearchedFoods([]);
    } finally {
      setLoadingFoods(false);
    }
  };

  // Add food to meal
  const addFoodToMeal = (food, quantity = 100) => {
    const newFood = {
      foodId: food._id,
      name: food.name,
      quantity: quantity,
      unit: food.nutrition.servingUnit || "g",
      calories: Math.round(
        (food.nutrition.calories * quantity) / food.nutrition.servingSize
      ),
      nutrition: {
        protein:
          Math.round(
            ((food.nutrition.protein * quantity) / food.nutrition.servingSize) *
              10
          ) / 10,
        carbs:
          Math.round(
            ((food.nutrition.carbs * quantity) / food.nutrition.servingSize) *
              10
          ) / 10,
        fat:
          Math.round(
            ((food.nutrition.fat * quantity) / food.nutrition.servingSize) * 10
          ) / 10,
      },
    };

    setMealForm((prev) => ({
      ...prev,
      foods: [...prev.foods, newFood],
    }));
    setShowFoodSearch(false);
    setFoodSearchQuery("");
    setSearchedFoods([]);
  };

  // Remove food from meal
  const removeFoodFromMeal = (index) => {
    setMealForm((prev) => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index),
    }));
  };

  // Calculate meal totals
  const calculateMealTotals = () => {
    return mealForm.foods.reduce(
      (totals, food) => ({
        calories: totals.calories + (food.calories || 0),
        protein:
          Math.round((totals.protein + (food.nutrition?.protein || 0)) * 10) /
          10,
        carbs:
          Math.round((totals.carbs + (food.nutrition?.carbs || 0)) * 10) / 10,
        fat: Math.round((totals.fat + (food.nutrition?.fat || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getDayTotals = (date) => {
    const meals = getMealsForDate(date);
    const allMeals = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner,
      ...meals.snack,
    ];

    return allMeals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
        carbs: totals.carbs + meal.carbs,
        fat: totals.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const weekDays = getWeekDays(selectedDate);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="meal-planner"
      />
      <div className="flex flex-col flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <ChefHat className="text-green-600" />
                  Meal Planner
                </h1>
                <p className="text-gray-600 mt-1">
                  Plan your weekly meals and stay on track
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-white rounded-lg shadow-sm border">
                <button
                  onClick={() => setView("week")}
                  className={`px-4 py-2 rounded-l-lg font-medium ${
                    view === "week"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`px-4 py-2 rounded-r-lg font-medium ${
                    view === "day"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>

              <h2 className="text-xl font-semibold">
                {weekDays[0].toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 7);
                  setSelectedDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>
          </div>

          {/* Week View */}
          {view === "week" && (
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const meals = getMealsForDate(day);
                const totals = getDayTotals(day);
                const isToday =
                  day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg shadow-sm border p-4 ${
                      isToday ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <div className="text-center mb-4">
                      <div className="font-medium text-gray-900">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div
                        className={`text-sm ${
                          isToday
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {mealTypes.map((mealType) => (
                        <div
                          key={mealType.id}
                          className="border-b border-gray-100 last:border-b-0 pb-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                              <span>{mealType.icon}</span>
                              {mealType.label}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedDate(day);
                                setMealForm((prev) => ({
                                  ...prev,
                                  type: mealType.id,
                                }));
                                setShowMealModal(true);
                              }}
                              className="text-green-600 hover:bg-green-50 p-1 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            {meals[mealType.id]?.map((meal) => (
                              <div
                                key={meal._id || meal.id}
                                className={`text-xs rounded p-2 flex items-center justify-between transition-colors ${
                                  meal.status === "consumed"
                                    ? "bg-green-50 border border-green-200"
                                    : meal.status === "prepared"
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-gray-50 border border-gray-200"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{meal.name}</div>
                                  <div className="text-gray-500">
                                    {meal.totalNutrition?.calories ||
                                      meal.calories ||
                                      0}{" "}
                                    cal
                                    {meal.totalNutrition && (
                                      <span className="ml-2">
                                        P:{" "}
                                        {Math.round(
                                          meal.totalNutrition.protein || 0
                                        )}
                                        g
                                      </span>
                                    )}
                                  </div>
                                  {meal.plannedTime && (
                                    <div className="text-gray-400 text-xs mt-1">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {meal.plannedTime}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {meal.status !== "consumed" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateMealStatus(
                                          meal._id || meal.id,
                                          "consumed"
                                        )
                                      }
                                      className="text-green-600 hover:bg-green-50 p-1 rounded"
                                      title="Mark as consumed"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleDeleteMeal(
                                        meal._id || meal.id,
                                        day,
                                        mealType.id
                                      )
                                    }
                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Daily Totals */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Calories:</span>
                          <span className="font-medium">{totals.calories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protein:</span>
                          <span className="font-medium">{totals.protein}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Meal Modal */}
        {showMealModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Create New Meal</h3>
                  <button
                    onClick={() => setShowMealModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Meal Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Name *
                    </label>
                    <input
                      type="text"
                      value={mealForm.name}
                      onChange={(e) =>
                        setMealForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter meal name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Type
                    </label>
                    <select
                      value={mealForm.type}
                      onChange={(e) =>
                        setMealForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {mealTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Time
                    </label>
                    <input
                      type="time"
                      value={mealForm.plannedTime}
                      onChange={(e) =>
                        setMealForm((prev) => ({
                          ...prev,
                          plannedTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setSelectedDate(new Date(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Foods Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Foods & Ingredients
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFoodSearch(true)}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Food
                    </button>
                  </div>

                  {/* Added Foods List */}
                  {mealForm.foods.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {mealForm.foods.map((food, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {food.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {food.quantity}
                              {food.unit} • {food.calories} cal • P:{" "}
                              {food.nutrition?.protein || 0}g
                            </div>
                          </div>
                          <button
                            onClick={() => removeFoodFromMeal(index)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* Meal Totals */}
                      {mealForm.foods.length > 0 &&
                        (() => {
                          const totals = calculateMealTotals();
                          return (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="font-medium text-sm text-green-800 mb-1">
                                Meal Totals:
                              </div>
                              <div className="text-sm text-green-700 grid grid-cols-4 gap-2">
                                <div>{totals.calories} cal</div>
                                <div>{totals.protein}g protein</div>
                                <div>{totals.carbs}g carbs</div>
                                <div>{totals.fat}g fat</div>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <ChefHat className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No foods added yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Click "Add Food" to start building your meal
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={mealForm.notes}
                    onChange={(e) =>
                      setMealForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add any notes about this meal..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowMealModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeal}
                    disabled={!mealForm.name.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Food Search Modal */}
        {showFoodSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Search Foods</h3>
                  <button
                    onClick={() => {
                      setShowFoodSearch(false);
                      setFoodSearchQuery("");
                      setSearchedFoods([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for foods..."
                    value={foodSearchQuery}
                    onChange={(e) => {
                      setFoodSearchQuery(e.target.value);
                      searchFoods(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {loadingFoods ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Searching foods...</div>
                    </div>
                  ) : searchedFoods.length > 0 ? (
                    <div className="space-y-2">
                      {searchedFoods.map((food) => (
                        <div
                          key={food._id}
                          onClick={() => addFoodToMeal(food)}
                          className="border border-gray-200 rounded-lg p-3 hover:border-green-300 cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-sm">{food.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Per {food.nutrition.servingSize}
                            {food.nutrition.servingUnit}:{" "}
                            {food.nutrition.calories} cal,{" "}
                            {food.nutrition.protein}g protein
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : foodSearchQuery ? (
                    <div className="text-center py-8 text-gray-500">
                      No foods found for "{foodSearchQuery}"
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Start typing to search for foods
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;
