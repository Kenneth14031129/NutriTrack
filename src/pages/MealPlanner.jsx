import { useState } from "react";
import {
  Plus,
  Clock,
  Users,
  ChefHat,
  ShoppingCart,
  Search,
  Heart,
  Trash2,
  Menu,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const MealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week"); // week, day
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", icon: "🌅", time: "8:00 AM" },
    { id: "lunch", label: "Lunch", icon: "☀️", time: "12:00 PM" },
    { id: "dinner", label: "Dinner", icon: "🌙", time: "6:00 PM" },
    { id: "snack", label: "Snacks", icon: "🍎", time: "Anytime" },
  ];

  const sampleMeals = [
    {
      id: 1,
      name: "Avocado Toast with Eggs",
      type: "breakfast",
      calories: 350,
      protein: 18,
      carbs: 25,
      fat: 22,
      time: "15 min",
      servings: 1,
      image: "🥑",
      ingredients: ["Whole grain bread", "Avocado", "Eggs", "Salt", "Pepper"],
      favorite: true,
    },
    {
      id: 2,
      name: "Grilled Chicken Salad",
      type: "lunch",
      calories: 420,
      protein: 35,
      carbs: 15,
      fat: 28,
      time: "20 min",
      servings: 1,
      image: "🥗",
      ingredients: [
        "Chicken breast",
        "Mixed greens",
        "Tomatoes",
        "Cucumber",
        "Olive oil",
      ],
      favorite: false,
    },
    {
      id: 3,
      name: "Salmon with Quinoa",
      type: "dinner",
      calories: 520,
      protein: 40,
      carbs: 35,
      fat: 25,
      time: "25 min",
      servings: 2,
      image: "🐟",
      ingredients: ["Salmon fillet", "Quinoa", "Broccoli", "Lemon", "Herbs"],
      favorite: true,
    },
  ];

  const [plannedMeals, setPlannedMeals] = useState({
    "2024-12-09": {
      breakfast: [sampleMeals[0]],
      lunch: [sampleMeals[1]],
      dinner: [sampleMeals[2]],
      snack: [],
    },
  });

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

  const addMealToPlan = (meal, date, mealType) => {
    const dateStr = formatDate(date);
    setPlannedMeals((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [mealType]: [...(prev[dateStr]?.[mealType] || []), meal],
      },
    }));
    setShowAddMeal(false);
  };

  const removeMealFromPlan = (mealId, date, mealType) => {
    const dateStr = formatDate(date);
    setPlannedMeals((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [mealType]:
          prev[dateStr]?.[mealType]?.filter((m) => m.id !== mealId) || [],
      },
    }));
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
                                setSelectedMealType(mealType.id);
                                setSelectedDate(day);
                                setShowAddMeal(true);
                              }}
                              className="text-green-600 hover:bg-green-50 p-1 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            {meals[mealType.id]?.map((meal) => (
                              <div
                                key={meal.id}
                                className="text-xs bg-gray-50 rounded p-2 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium">{meal.name}</div>
                                  <div className="text-gray-500">
                                    {meal.calories} cal
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    removeMealFromPlan(
                                      meal.id,
                                      day,
                                      mealType.id
                                    )
                                  }
                                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
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
        {showAddMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    Add{" "}
                    {mealTypes.find((m) => m.id === selectedMealType)?.label}
                  </h3>
                  <button
                    onClick={() => setShowAddMeal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search meals and recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-4">
                  {sampleMeals
                    .filter(
                      (meal) =>
                        meal.type === selectedMealType ||
                        selectedMealType === "snack"
                    )
                    .filter((meal) =>
                      meal.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((meal) => (
                      <div
                        key={meal.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() =>
                          addMealToPlan(meal, selectedDate, selectedMealType)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{meal.image}</div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {meal.name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {meal.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {meal.servings} serving
                                  {meal.servings > 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {meal.calories} cal
                            </div>
                            <div className="text-xs text-gray-500">
                              P: {meal.protein}g | C: {meal.carbs}g | F:{" "}
                              {meal.fat}g
                            </div>
                            {meal.favorite && (
                              <Heart className="w-4 h-4 text-red-500 fill-current mt-1 ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
