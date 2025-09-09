import { useState, useEffect } from "react";
import {
  Home,
  Target,
  Plus,
  Edit3,
  Check,
  Zap,
  Menu,
  ChevronRight,
  Activity,
  Utensils,
  Droplets,
  Moon,
  Dumbbell,
  X,
  RotateCcw,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import apiService from "../services/api";

const Homepage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [hasCheckedGoals, setHasCheckedGoals] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dailyGoals, setDailyGoals] = useState(null);
  const [goalProgress, setGoalProgress] = useState({});

  // Check if goals are set on component mount
  useEffect(() => {
    const loadGoalsAndProgress = async () => {
      if (hasCheckedGoals) return; // Don't check again if already checked
      
      try {
        // Check if user is authenticated
        if (!apiService.isAuthenticated()) {
          // Fallback to localStorage for demo
          const savedGoals = localStorage.getItem("dailyGoals");
          if (savedGoals) {
            setDailyGoals(JSON.parse(savedGoals));
            const savedProgress = localStorage.getItem("goalProgress") || "{}";
            setGoalProgress(JSON.parse(savedProgress));
          }
          // Don't automatically show goal setup - let user click "Edit Goals" if needed
          setHasCheckedGoals(true);
          return;
        }

        // Try to load current goals from backend
        const goalsResponse = await apiService.getCurrentGoals();
        if (goalsResponse.goals) {
          setDailyGoals(goalsResponse.goals);
          
          // Load today's progress
          const progressResponse = await apiService.getTodayProgress();
          if (progressResponse.progress) {
            setGoalProgress(progressResponse.progress.current);
          }
        }
        setHasCheckedGoals(true);
      } catch (error) {
        console.error('Error loading goals:', error);
        // Fallback to localStorage for demo
        const savedGoals = localStorage.getItem("dailyGoals");
        if (savedGoals) {
          setDailyGoals(JSON.parse(savedGoals));
          const savedProgress = localStorage.getItem("goalProgress") || "{}";
          setGoalProgress(JSON.parse(savedProgress));
        }
        setHasCheckedGoals(true);
      }
    };

    loadGoalsAndProgress();
  }, [hasCheckedGoals]);

  const [goalSetupData, setGoalSetupData] = useState({
    calorieGoal: "",
    waterGoal: 8,
    mealsGoal: 3,
    exerciseGoal: 30,
    sleepGoal: 8,
    stepsGoal: 10000,
    proteinGoal: "",
    carbsGoal: "",
    fiberGoal: "",
    customGoals: [],
  });

  const goalSetupQuestions = [
    {
      title: "What's your daily calorie goal?",
      subtitle: "This helps us track your energy intake",
      field: "calorieGoal",
      type: "number",
      placeholder: "2000",
      suffix: "calories",
      icon: Zap,
      color: "orange",
    },
    {
      title: "How much water do you want to drink?",
      subtitle: "Stay hydrated throughout the day",
      field: "waterGoal",
      type: "range",
      min: 4,
      max: 16,
      suffix: "glasses",
      icon: Droplets,
      color: "blue",
    },
    {
      title: "How many meals do you plan to eat?",
      subtitle: "Include snacks if you track them as meals",
      field: "mealsGoal",
      type: "range",
      min: 2,
      max: 6,
      suffix: "meals",
      icon: Utensils,
      color: "green",
    },
    {
      title: "How many minutes of exercise?",
      subtitle: "Any physical activity counts",
      field: "exerciseGoal",
      type: "range",
      min: 15,
      max: 120,
      suffix: "minutes",
      icon: Dumbbell,
      color: "purple",
    },
    {
      title: "What's your sleep goal?",
      subtitle: "Quality rest is essential for health",
      field: "sleepGoal",
      type: "range",
      min: 6,
      max: 10,
      suffix: "hours",
      icon: Moon,
      color: "indigo",
    },
    {
      title: "Daily steps target?",
      subtitle: "Keep moving throughout the day",
      field: "stepsGoal",
      type: "number",
      placeholder: "10000",
      suffix: "steps",
      icon: Activity,
      color: "red",
    },
  ];

  const handleGoalSetupNext = async () => {
    if (currentStep < goalSetupQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save goals to backend
      try {
        const goalsData = {
          targets: {
            calories: parseInt(goalSetupData.calorieGoal) || 2000,
            water: parseInt(goalSetupData.waterGoal) || 8,
            meals: parseInt(goalSetupData.mealsGoal) || 3,
            exercise: parseInt(goalSetupData.exerciseGoal) || 30,
            sleep: parseInt(goalSetupData.sleepGoal) || 8,
            steps: parseInt(goalSetupData.stepsGoal) || 10000
          },
          nutritionalTargets: {
            protein: parseInt(goalSetupData.proteinGoal) || 0,
            carbs: parseInt(goalSetupData.carbsGoal) || 0,
            fiber: parseInt(goalSetupData.fiberGoal) || 0
          }
        };

        if (apiService.isAuthenticated()) {
          const response = await apiService.createGoals(goalsData);
          setDailyGoals(response.goals);
        } else {
          // Fallback to localStorage for demo
          const goals = { ...goalSetupData, date: new Date().toDateString() };
          setDailyGoals(goals);
          localStorage.setItem("dailyGoals", JSON.stringify(goals));
        }
        
        setShowGoalSetup(false);
        setCurrentStep(0);
      } catch (error) {
        console.error('Error saving goals:', error);
        // Fallback to localStorage
        const goals = { ...goalSetupData, date: new Date().toDateString() };
        setDailyGoals(goals);
        localStorage.setItem("dailyGoals", JSON.stringify(goals));
        setShowGoalSetup(false);
        setCurrentStep(0);
      }
    }
  };

  const updateGoalProgress = async (goalType, value) => {
    try {
      if (apiService.isAuthenticated()) {
        await apiService.updateProgress(goalType, value, 'set');
        const newProgress = { ...goalProgress, [goalType]: value };
        setGoalProgress(newProgress);
      } else {
        // Fallback to localStorage
        const newProgress = { ...goalProgress, [goalType]: value };
        setGoalProgress(newProgress);
        localStorage.setItem("goalProgress", JSON.stringify(newProgress));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Fallback to localStorage
      const newProgress = { ...goalProgress, [goalType]: value };
      setGoalProgress(newProgress);
      localStorage.setItem("goalProgress", JSON.stringify(newProgress));
    }
  };

  const handleRestart = () => {
    // Clear all data
    localStorage.removeItem("dailyGoals");
    localStorage.removeItem("goalProgress");
    apiService.logout();
    
    // Reset state
    setDailyGoals(null);
    setGoalProgress({});
    setHasCheckedGoals(false);
    setGoalSetupData({
      calorieGoal: "",
      waterGoal: 8,
      mealsGoal: 3,
      exerciseGoal: 30,
      sleepGoal: 8,
      stepsGoal: 10000,
      proteinGoal: "",
      carbsGoal: "",
      fiberGoal: "",
      customGoals: [],
    });
    setCurrentStep(0);
    setShowGoalSetup(true);
  };

  const getProgressPercentage = (goalType) => {
    if (!dailyGoals || !goalProgress[goalType]) return 0;
    const progress = goalProgress[goalType];
    
    // Handle backend data structure (targets) vs localStorage structure
    let goal;
    if (dailyGoals.targets) {
      // Backend structure
      goal = dailyGoals.targets[goalType] || dailyGoals.targets[goalType.replace('Goal', '')];
    } else {
      // localStorage structure
      goal = dailyGoals[goalType];
    }
    
    if (!goal) return 0;
    return Math.min((progress / goal) * 100, 100);
  };

  const isGoalCompleted = (goalType) => {
    return getProgressPercentage(goalType) >= 100;
  };

  const getTodayStats = () => {
    if (!dailyGoals) return { completed: 0, total: 0 };
    const goalTypes = [
      "calories",
      "water",
      "meals",
      "exercise", 
      "sleep",
      "steps",
    ];
    const completed = goalTypes.filter((type) => isGoalCompleted(type)).length;
    return { completed, total: goalTypes.length };
  };

  const currentQuestion = goalSetupQuestions[currentStep];
  const currentIcon = currentQuestion?.icon;
  const todayStats = getTodayStats();

  // Show welcome screen if no goals are set and setup is not shown
  if (!dailyGoals && !showGoalSetup && hasCheckedGoals) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome to NutriTrack
              </h1>
              <p className="text-gray-400 mb-6">
                Set your daily goals to start tracking your nutrition and fitness journey
              </p>
            </div>
            
            <button
              onClick={() => setShowGoalSetup(true)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              <Target className="w-5 h-5" />
              Set Your Goals
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showGoalSetup) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full">
            {/* Progress Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Set Your Daily Goals
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-xs sm:text-sm text-gray-400">
                    {currentStep + 1} of {goalSetupQuestions.length}
                  </span>
                  <button
                    onClick={() => {
                      setShowGoalSetup(false);
                      setCurrentStep(0);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentStep + 1) / goalSetupQuestions.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              {currentIcon && (
                <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <currentIcon className="w-10 h-10 text-green-400" />
                </div>
              )}
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 text-center">
                {currentQuestion.title}
              </h3>
              <p className="text-gray-300 text-base sm:text-lg text-center">
                {currentQuestion.subtitle}
              </p>
            </div>

            {/* Input */}
            <div className="mb-8">
              {currentQuestion.type === "number" ? (
                <div className="relative">
                  <input
                    type="number"
                    placeholder={currentQuestion.placeholder}
                    value={goalSetupData[currentQuestion.field]}
                    onChange={(e) =>
                      setGoalSetupData({
                        ...goalSetupData,
                        [currentQuestion.field]: e.target.value,
                      })
                    }
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-xl sm:text-2xl text-center border-2 border-gray-600 bg-gray-700 text-white rounded-2xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    {currentQuestion.suffix}
                  </span>
                </div>
              ) : (
                <div className="px-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm sm:text-lg font-medium text-gray-300">
                      {currentQuestion.min} {currentQuestion.suffix}
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-green-400">
                      {goalSetupData[currentQuestion.field]}{" "}
                      {currentQuestion.suffix}
                    </span>
                    <span className="text-sm sm:text-lg font-medium text-gray-300">
                      {currentQuestion.max} {currentQuestion.suffix}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    value={goalSetupData[currentQuestion.field]}
                    onChange={(e) =>
                      setGoalSetupData({
                        ...goalSetupData,
                        [currentQuestion.field]: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 sm:px-6 py-2 sm:py-3 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                Previous
              </button>
              <button
                onClick={handleGoalSetupNext}
                disabled={
                  currentQuestion.type === "number" &&
                  !goalSetupData[currentQuestion.field]
                }
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
              >
                {currentStep === goalSetupQuestions.length - 1
                  ? "Complete Setup"
                  : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
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
        currentPage="homepage"
      />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-0">
        {/* Header */}
        <div className="bg-gray-900 text-white border-b border-gray-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <Home className="text-green-400 w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="hidden sm:inline">Today's Goals</span>
                  <span className="sm:hidden">Goals</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base hidden sm:block">
                  Track your daily progress and stay motivated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart</span>
                <span className="sm:hidden">Reset</span>
              </button>
              <button
                onClick={() => setShowGoalSetup(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Goals</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Today's Overview */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Good morning! 🌟</h2>
                  <p className="text-green-100 text-base sm:text-lg">
                    You've completed {todayStats.completed} of{" "}
                    {todayStats.total} goals today
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold mb-2">
                    {Math.round(
                      (todayStats.completed / todayStats.total) * 100
                    )}
                    %
                  </div>
                  <div className="text-green-100 text-sm sm:text-base">Complete</div>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="mt-6">
                <div className="w-full bg-green-400/30 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (todayStats.completed / todayStats.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Calories Goal */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Calories</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Energy intake</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !isGoalCompleted("calories") &&
                    updateGoalProgress(
                      "calories",
                      (goalProgress.calories || 0) + 100
                    )
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isGoalCompleted("calorieGoal")
                      ? "bg-green-500/20 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  {isGoalCompleted("calorieGoal") ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {goalProgress.calorieGoal || 0}
                  </span>
                  <span className="text-gray-400 text-sm sm:text-base">
                    / {dailyGoals?.calorieGoal} cal
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${getProgressPercentage("calories")}%`,
                    }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("calories") && (
                <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm font-medium">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Goal completed!</span>
                  <span className="sm:hidden">Done!</span>
                </div>
              )}
            </div>

            {/* Water Goal */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Water</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Hydration</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !isGoalCompleted("water") &&
                    updateGoalProgress(
                      "water",
                      (goalProgress.water || 0) + 1
                    )
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isGoalCompleted("water")
                      ? "bg-green-500/20 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  {isGoalCompleted("water") ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {goalProgress.waterGoal || 0}
                  </span>
                  <span className="text-gray-400 text-sm sm:text-base">
                    / {dailyGoals?.waterGoal} glasses
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage("water")}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("water") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
            </div>

            {/* Meals Goal */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Meals</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Nutrition</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !isGoalCompleted("meals") &&
                    updateGoalProgress(
                      "meals",
                      (goalProgress.meals || 0) + 1
                    )
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isGoalCompleted("meals")
                      ? "bg-green-500/20 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  {isGoalCompleted("meals") ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {goalProgress.mealsGoal || 0}
                  </span>
                  <span className="text-gray-400">
                    / {dailyGoals?.mealsGoal} meals
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage("meals")}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("meals") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
            </div>

            {/* Exercise Goal */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Exercise</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Activity</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !isGoalCompleted("exercise") &&
                    updateGoalProgress(
                      "exercise",
                      (goalProgress.exercise || 0) + 15
                    )
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isGoalCompleted("exercise")
                      ? "bg-green-500/20 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  {isGoalCompleted("exercise") ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {goalProgress.exerciseGoal || 0}
                  </span>
                  <span className="text-gray-400">
                    / {dailyGoals?.exerciseGoal} min
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${getProgressPercentage("exercise")}%`,
                    }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("exercise") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
            </div>

            {/* Sleep Goal */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Sleep</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Recovery</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !isGoalCompleted("sleep") &&
                    updateGoalProgress("sleep", dailyGoals?.targets?.sleep || dailyGoals?.sleepGoal || 8)
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isGoalCompleted("sleep")
                      ? "bg-green-500/20 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  <Check className="w-4 h-4 text-green-400" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {goalProgress.sleepGoal || 0}
                  </span>
                  <span className="text-gray-400">
                    / {dailyGoals?.sleepGoal} hours
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage("sleep")}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("sleep") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
            </div>

            {/* Steps Goal */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Steps</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Movement</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !isGoalCompleted("steps") &&
                    updateGoalProgress(
                      "steps",
                      (goalProgress.steps || 0) + 1000
                    )
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isGoalCompleted("steps")
                      ? "bg-green-500/20 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  {isGoalCompleted("steps") ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {(goalProgress.stepsGoal || 0).toLocaleString()}
                  </span>
                  <span className="text-gray-400">
                    / {(dailyGoals?.stepsGoal || 0).toLocaleString()} steps
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage("steps")}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("steps") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
