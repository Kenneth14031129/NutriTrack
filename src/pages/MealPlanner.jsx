import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  ChefHat,
  Search,
  Trash2,
  Menu,
  Check,
  Loader2,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import apiService from "../services/api";

const MealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plannedMeals, setPlannedMeals] = useState({});
  const [isLoadingWeeklyMeals, setIsLoadingWeeklyMeals] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState(null);
  const [mealForm, setMealForm] = useState({
    name: "",
    type: "breakfast",
    plannedTime: "08:00",
    notes: "",
    calories: "",
    protein: "",
  });

  // Loading states for different operations
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [isDeletingMeal, setIsDeletingMeal] = useState({});
  const [isUpdatingMealStatus, setIsUpdatingMealStatus] = useState({});

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

    setIsLoadingWeeklyMeals(true);
    try {
      const response = await apiService.getWeeklyMealPlan(startDate);
      setPlannedMeals(response.mealPlan || {});
    } catch (error) {
      console.error("Error loading weekly meals:", error);

      // Check different types of errors
      if (error.message.includes("Failed to fetch")) {
        console.error(
          "Backend server connection failed. Please check your internet connection and try again."
        );
        alert(
          "Cannot connect to server. Please ensure the backend is running."
        );
      } else if (
        error.message.includes("401") ||
        error.message.includes("token")
      ) {
        console.error("Authentication error:", error);
        alert("Please log in to access your meal planner.");
      } else {
        console.error("API Error:", error);
        alert("Error loading meals: " + error.message);
      }
      setPlannedMeals({});
    } finally {
      setIsLoadingWeeklyMeals(false);
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

    setIsCreatingMeal(true);
    try {
      const mealData = {
        name: mealForm.name,
        type: mealForm.type,
        date: selectedDate.toISOString().split("T")[0],
        plannedTime: mealForm.plannedTime,
        notes: mealForm.notes,
        totalNutrition: {
          calories: parseFloat(mealForm.calories) || 0,
          protein: parseFloat(mealForm.protein) || 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
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
        notes: "",
        calories: "",
        protein: "",
      });
      setShowMealModal(false);
    } catch (error) {
      console.error("Error creating meal:", error);
      alert("Error creating meal: " + error.message);
    } finally {
      setIsCreatingMeal(false);
    }
  };

  // Delete meal
  const handleDeleteMeal = async (mealId, date, type) => {
    setIsDeletingMeal(prev => ({ ...prev, [mealId]: true }));
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
    } finally {
      setIsDeletingMeal(prev => ({ ...prev, [mealId]: false }));
    }
  };

  // Update meal status
  const handleUpdateMealStatus = async (mealId, status) => {
    setIsUpdatingMealStatus(prev => ({ ...prev, [mealId]: true }));
    try {
      if (apiService.isAuthenticated()) {
        await apiService.updateMealStatus(mealId, status);
        // Reload meals to reflect changes
        const startOfWeek = getWeekStart(selectedDate);
        loadWeeklyMeals(startOfWeek);
      }
    } catch (error) {
      console.error("Error updating meal status:", error);
    } finally {
      setIsUpdatingMealStatus(prev => ({ ...prev, [mealId]: false }));
    }
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
        calories:
          totals.calories +
          (meal.totalNutrition?.calories || meal.calories || 0),
        protein:
          totals.protein + (meal.totalNutrition?.protein || meal.protein || 0),
        carbs: totals.carbs + (meal.totalNutrition?.carbs || meal.carbs || 0),
        fat: totals.fat + (meal.totalNutrition?.fat || meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const weekDays = getWeekDays(selectedDate);

  // Show initial loading screen
  if (isLoadingWeeklyMeals && Object.keys(plannedMeals).length === 0) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage="meal-planner"
        />
        <div className="flex flex-col flex-1 lg:ml-0">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Loading Meal Planner
              </h2>
              <p className="text-gray-400">
                Setting up your weekly meal plan...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="meal-planner"
      />
      <div className="flex flex-col flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-gray-900 text-white border-b border-gray-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-300" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <ChefHat className="text-green-500 w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="hidden sm:inline">Meal Planner</span>
                  <span className="sm:hidden">Planner</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base hidden sm:block">
                  Plan your weekly meals and stay on track
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Week Navigation */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                ←
              </button>

              <h2 className="text-lg sm:text-xl font-semibold text-white">
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
                className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Week View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
            {weekDays.map((day, index) => {
              const meals = getMealsForDate(day);
              const totals = getDayTotals(day);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDayForModal(day);
                    setShowDayModal(true);
                  }}
                  className={`bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-3 sm:p-4 cursor-pointer hover:bg-gray-750 transition-colors ${
                    isToday ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="font-medium text-white text-sm sm:text-base">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      className={`text-sm ${
                        isToday ? "text-green-400 font-medium" : "text-gray-400"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="text-xs text-gray-500 sm:hidden">
                      {day.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    {mealTypes.map((mealType) => (
                      <div
                        key={mealType.id}
                        className="border-b border-gray-700 last:border-b-0 pb-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-medium text-gray-300 flex items-center gap-1">
                            <span className="text-xs sm:text-sm">{mealType.icon}</span>
                            <span className="hidden sm:inline">{mealType.label}</span>
                            <span className="sm:hidden">{mealType.label.slice(0, 3)}</span>
                          </div>
                          {day >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(day);
                                setMealForm((prev) => ({
                                  ...prev,
                                  type: mealType.id,
                                }));
                                setShowMealModal(true);
                              }}
                              className="text-green-400 hover:bg-green-500/20 p-1 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          {meals[mealType.id]?.map((meal) => (
                            <div
                              key={meal._id || meal.id}
                              className={`text-xs rounded p-1.5 sm:p-2 flex items-center justify-between transition-colors ${
                                meal.status === "consumed"
                                  ? "bg-green-500/20 border border-green-500/30"
                                  : meal.status === "prepared"
                                  ? "bg-blue-500/20 border border-blue-500/30"
                                  : "bg-gray-700 border border-gray-600"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate text-xs sm:text-sm">
                                  {meal.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {meal.status !== "consumed" &&
                                  day >=
                                    new Date(
                                      new Date().setHours(0, 0, 0, 0)
                                    ) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateMealStatus(
                                          meal._id || meal.id,
                                          "consumed"
                                        );
                                      }}
                                      disabled={isUpdatingMealStatus[meal._id || meal.id]}
                                      className="text-green-400 hover:bg-green-500/20 disabled:opacity-50 p-0.5 sm:p-1 rounded transition-colors"
                                      title="Mark as consumed"
                                    >
                                      {isUpdatingMealStatus[meal._id || meal.id] ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                {day >=
                                  new Date(new Date().setHours(0, 0, 0, 0)) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMeal(
                                        meal._id || meal.id,
                                        day,
                                        mealType.id
                                      );
                                    }}
                                    disabled={isDeletingMeal[meal._id || meal.id]}
                                    className="text-red-400 hover:bg-red-500/20 disabled:opacity-50 p-0.5 sm:p-1 rounded transition-colors"
                                  >
                                    {isDeletingMeal[meal._id || meal.id] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily Totals */}
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium text-white">
                          {totals.calories}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Protein:</span>
                        <span className="font-medium text-white">
                          {totals.protein}g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Meal Modal */}
        {showMealModal && (
          <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
              <div className="p-4 sm:p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Create New Meal
                  </h3>
                  <button
                    onClick={() => setShowMealModal(false)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
                {/* Meal Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter meal name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {mealTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setSelectedDate(new Date(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Nutrition Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={mealForm.calories}
                      onChange={(e) =>
                        setMealForm((prev) => ({
                          ...prev,
                          calories: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={mealForm.protein}
                      onChange={(e) =>
                        setMealForm((prev) => ({
                          ...prev,
                          protein: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add any notes about this meal..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowMealModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeal}
                    disabled={!mealForm.name.trim() || isCreatingMeal}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2 flex items-center justify-center gap-2"
                  >
                    {isCreatingMeal ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Meal"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Detail Modal */}
        {showDayModal && selectedDayForModal && (
          <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
              <div className="p-4 sm:p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white flex items-center gap-2 sm:gap-3">
                    <ChefHat className="text-green-500 w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="truncate">
                      {selectedDayForModal.toLocaleDateString("en-US", {
                        weekday: window.innerWidth < 640 ? "short" : "long",
                        year: "numeric",
                        month: window.innerWidth < 640 ? "short" : "long",
                        day: "numeric",
                      })}
                    </span>
                  </h3>
                  <button
                    onClick={() => {
                      setShowDayModal(false);
                      setSelectedDayForModal(null);
                    }}
                    className="text-gray-400 hover:text-gray-200 transition-colors text-xl sm:text-2xl ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {(() => {
                  const dayMeals = getMealsForDate(selectedDayForModal);
                  const dayTotals = getDayTotals(selectedDayForModal);

                  return (
                    <div className="space-y-6">
                      {/* Daily Summary */}
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3">
                          Daily Summary
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {dayTotals.calories}
                            </div>
                            <div className="text-sm text-gray-300">
                              Calories
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {dayTotals.protein}g
                            </div>
                            <div className="text-sm text-gray-300">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {dayTotals.carbs}g
                            </div>
                            <div className="text-sm text-gray-300">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">
                              {dayTotals.fat}g
                            </div>
                            <div className="text-sm text-gray-300">Fat</div>
                          </div>
                        </div>
                      </div>

                      {/* Meal Details */}
                      <div className="space-y-4">
                        {mealTypes.map((mealType) => {
                          const meals = dayMeals[mealType.id] || [];
                          return (
                            <div
                              key={mealType.id}
                              className="bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-lg font-medium text-white flex items-center gap-2">
                                  <span className="text-xl">
                                    {mealType.icon}
                                  </span>
                                  {mealType.label}
                                  <span className="text-sm text-gray-400">
                                    ({mealType.time})
                                  </span>
                                </h5>
                                {selectedDayForModal >=
                                  new Date(new Date().setHours(0, 0, 0, 0)) && (
                                  <button
                                    onClick={() => {
                                      setSelectedDate(selectedDayForModal);
                                      setMealForm((prev) => ({
                                        ...prev,
                                        type: mealType.id,
                                      }));
                                      setShowDayModal(false);
                                      setShowMealModal(true);
                                    }}
                                    className="text-green-400 hover:bg-green-500/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Meal
                                  </button>
                                )}
                              </div>

                              {meals.length === 0 ? (
                                <div className="text-gray-400 text-center py-4">
                                  No meals planned for{" "}
                                  {mealType.label.toLowerCase()}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {meals.map((meal) => (
                                    <div
                                      key={meal._id || meal.id}
                                      className={`p-3 rounded-lg border transition-colors ${
                                        meal.status === "consumed"
                                          ? "bg-green-500/20 border-green-500/30"
                                          : meal.status === "prepared"
                                          ? "bg-blue-500/20 border-blue-500/30"
                                          : "bg-gray-600 border-gray-500"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <h6 className="font-medium text-white">
                                              {meal.name}
                                            </h6>
                                            {meal.status === "consumed" && (
                                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                                Consumed
                                              </span>
                                            )}
                                            {meal.status === "prepared" && (
                                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                                Prepared
                                              </span>
                                            )}
                                          </div>

                                          <div className="text-sm text-gray-300 mt-1">
                                            <div className="flex items-center gap-4">
                                              <span>
                                                {meal.totalNutrition
                                                  ?.calories ||
                                                  meal.calories ||
                                                  0}{" "}
                                                cal
                                              </span>
                                              {meal.totalNutrition?.protein ||
                                              meal.protein ? (
                                                <span>
                                                  Protein:{" "}
                                                  {Math.round(
                                                    meal.totalNutrition
                                                      ?.protein || meal.protein
                                                  )}
                                                  g
                                                </span>
                                              ) : null}
                                              {meal.plannedTime && (
                                                <span className="flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {meal.plannedTime}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {meal.notes && (
                                            <div className="text-sm text-gray-400 mt-2 italic">
                                              {meal.notes}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                          {meal.status !== "consumed" &&
                                            selectedDayForModal >=
                                              new Date(
                                                new Date().setHours(0, 0, 0, 0)
                                              ) && (
                                              <button
                                                onClick={() =>
                                                  handleUpdateMealStatus(
                                                    meal._id || meal.id,
                                                    "consumed"
                                                  )
                                                }
                                                disabled={isUpdatingMealStatus[meal._id || meal.id]}
                                                className="text-green-400 hover:bg-green-500/20 disabled:opacity-50 p-2 rounded transition-colors"
                                                title="Mark as consumed"
                                              >
                                                {isUpdatingMealStatus[meal._id || meal.id] ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <Check className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                          {selectedDayForModal >=
                                            new Date(
                                              new Date().setHours(0, 0, 0, 0)
                                            ) && (
                                            <button
                                              onClick={() =>
                                                handleDeleteMeal(
                                                  meal._id || meal.id,
                                                  selectedDayForModal,
                                                  mealType.id
                                                )
                                              }
                                              disabled={isDeletingMeal[meal._id || meal.id]}
                                              className="text-red-400 hover:bg-red-500/20 disabled:opacity-50 p-2 rounded transition-colors"
                                            >
                                              {isDeletingMeal[meal._id || meal.id] ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-4 h-4" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;
