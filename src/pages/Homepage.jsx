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
  AlertTriangle,
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
  const [inputValues, setInputValues] = useState({
    calories: "",
    water: "",
    meals: "",
    exercise: "",
    sleep: "",
    steps: "",
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingGoal, setCompletingGoal] = useState(null);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [congratulatedGoal, setCongratulatedGoal] = useState(null);

  // Check if goals are set on component mount
  useEffect(() => {
    const loadGoalsAndProgress = async () => {
      if (hasCheckedGoals) return; // Don't check again if already checked

      try {
        // Check if user is authenticated
        if (!apiService.isAuthenticated()) {
          // Fallback to localStorage for demo with date-based storage
          const dateKey = new Date().toDateString();
          const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
          const goalsData = JSON.parse(savedGoalsData);

          if (goalsData[dateKey]) {
            setDailyGoals(goalsData[dateKey].goals);
            setGoalProgress(goalsData[dateKey].progress || {});
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
        console.error("Error loading goals:", error);
        // Fallback to localStorage for demo with date-based storage
        const dateKey = new Date().toDateString();
        const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
        const goalsData = JSON.parse(savedGoalsData);

        if (goalsData[dateKey]) {
          setDailyGoals(goalsData[dateKey].goals);
          setGoalProgress(goalsData[dateKey].progress || {});
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
            steps: parseInt(goalSetupData.stepsGoal) || 10000,
          },
          nutritionalTargets: {
            protein: parseInt(goalSetupData.proteinGoal) || 0,
            carbs: parseInt(goalSetupData.carbsGoal) || 0,
            fiber: parseInt(goalSetupData.fiberGoal) || 0,
          },
        };

        if (apiService.isAuthenticated()) {
          const response = await apiService.createGoals(goalsData);
          setDailyGoals(response.goals);
        } else {
          // Fallback to localStorage for demo with date-based storage
          const dateKey = new Date().toDateString();
          const goals = { ...goalSetupData, date: dateKey };
          setDailyGoals(goals);

          // Update date-based storage
          const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
          const goalsData = JSON.parse(savedGoalsData);
          goalsData[dateKey] = { goals, progress: {} };
          localStorage.setItem("dailyGoalsData", JSON.stringify(goalsData));
        }

        setShowGoalSetup(false);
        setCurrentStep(0);
      } catch (error) {
        console.error("Error saving goals:", error);
        // Fallback to localStorage with date-based storage
        const dateKey = new Date().toDateString();
        const goals = { ...goalSetupData, date: dateKey };
        setDailyGoals(goals);

        // Update date-based storage
        const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
        const goalsData = JSON.parse(savedGoalsData);
        goalsData[dateKey] = { goals, progress: {} };
        localStorage.setItem("dailyGoalsData", JSON.stringify(goalsData));

        setShowGoalSetup(false);
        setCurrentStep(0);
      }
    }
  };

  const updateGoalProgressFromInput = async (goalType) => {
    const inputValue = inputValues[goalType];
    if (!inputValue || isNaN(inputValue)) return;

    const numValue = parseFloat(inputValue);
    if (numValue < 0) return;

    // Check if this would complete the goal
    const goalFieldMap = {
      calories: "calorieGoal",
      water: "waterGoal", 
      meals: "mealsGoal",
      exercise: "exerciseGoal",
      sleep: "sleepGoal",
      steps: "stepsGoal",
    };

    let goal;
    if (dailyGoals?.targets) {
      goal = dailyGoals.targets[goalType];
    } else {
      const fieldName = goalFieldMap[goalType] || goalType;
      goal = dailyGoals?.[fieldName];
    }

    const wouldComplete = goal && numValue >= goal && !isGoalCompleted(goalType);

    if (wouldComplete) {
      setCompletingGoal({ type: goalType, value: numValue });
      setShowCompletionModal(true);
    } else {
      await updateGoalProgress(goalType, numValue);
      setInputValues((prev) => ({ ...prev, [goalType]: "" }));
    }
  };

  const updateGoalProgress = async (goalType, value) => {
    try {
      if (apiService.isAuthenticated()) {
        await apiService.updateProgress(goalType, value, "set");
        const newProgress = { ...goalProgress, [goalType]: value };
        setGoalProgress(newProgress);
      } else {
        // Fallback to localStorage with date-based storage
        const dateKey = new Date().toDateString();
        const newProgress = { ...goalProgress, [goalType]: value };
        setGoalProgress(newProgress);

        // Update date-based storage
        const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
        const goalsData = JSON.parse(savedGoalsData);
        if (!goalsData[dateKey]) {
          goalsData[dateKey] = { goals: dailyGoals, progress: {} };
        }
        goalsData[dateKey].progress = newProgress;
        localStorage.setItem("dailyGoalsData", JSON.stringify(goalsData));
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      // Fallback to localStorage with date-based storage
      const dateKey = new Date().toDateString();
      const newProgress = { ...goalProgress, [goalType]: value };
      setGoalProgress(newProgress);

      // Update date-based storage
      const savedGoalsData = localStorage.getItem("dailyGoalsData") || "{}";
      const goalsData = JSON.parse(savedGoalsData);
      if (!goalsData[dateKey]) {
        goalsData[dateKey] = { goals: dailyGoals, progress: {} };
      }
      goalsData[dateKey].progress = newProgress;
      localStorage.setItem("dailyGoalsData", JSON.stringify(goalsData));
    }
  };

  const handleRestart = () => {
    // Clear all data
    localStorage.removeItem("dailyGoals");
    localStorage.removeItem("goalProgress");
    localStorage.removeItem("dailyGoalsData");
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

    // Map goal types to correct field names
    const goalFieldMap = {
      calories: "calorieGoal",
      water: "waterGoal",
      meals: "mealsGoal",
      exercise: "exerciseGoal",
      sleep: "sleepGoal",
      steps: "stepsGoal",
    };

    let goal;
    if (dailyGoals.targets) {
      // Backend structure
      goal = dailyGoals.targets[goalType];
    } else {
      // localStorage structure - use mapped field name
      const fieldName = goalFieldMap[goalType] || goalType;
      goal = dailyGoals[fieldName];
    }

    if (!goal) return 0;
    return (progress / goal) * 100;
  };

  const isGoalCompleted = (goalType) => {
    return getProgressPercentage(goalType) >= 100;
  };

  const isGoalExceeded = (goalType) => {
    return getProgressPercentage(goalType) > 100;
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

  const handleConfirmCompletion = async () => {
    if (completingGoal) {
      await updateGoalProgress(completingGoal.type, completingGoal.value);
      setInputValues((prev) => ({ ...prev, [completingGoal.type]: "" }));
      setCongratulatedGoal(completingGoal.type);
      setShowCompletionModal(false);
      setCompletingGoal(null);
      setShowCongratulationsModal(true);
    }
  };

  const handleCancelCompletion = () => {
    setCompletingGoal({ type: completingGoal.type, value: 0 });
    setShowCompletionModal(false);
    setCompletingGoal(null);
  };

  const handleCloseCongratulations = () => {
    setShowCongratulationsModal(false);
    setCongratulatedGoal(null);
  };

  const getGoalDisplayName = (goalType) => {
    const displayNames = {
      calories: "Calories",
      water: "Water",
      meals: "Meals", 
      exercise: "Exercise",
      sleep: "Sleep",
      steps: "Steps"
    };
    return displayNames[goalType] || goalType;
  };

  const currentQuestion = goalSetupQuestions[currentStep];
  const currentIcon = currentQuestion?.icon;
  const todayStats = getTodayStats();

  // Show welcome screen if no goals are set and setup is not shown
  if (!dailyGoals && !showGoalSetup && hasCheckedGoals) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome to NutriTrack
              </h1>
              <p className="text-gray-400 mb-6">
                Set your daily goals to start tracking your nutrition and
                fitness journey
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
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  <span className="hidden sm:inline">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    - Track your daily progress and stay motivated
                  </span>
                  <span className="sm:hidden">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Day</span>
                <span className="sm:hidden">Reset</span>
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
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "morning"
                      : new Date().getHours() < 17
                      ? "afternoon"
                      : "evening"}
                    ! 🌟
                  </h2>
                  <p className="text-green-100 text-base sm:text-lg mb-1">
                    You've completed {todayStats.completed} of{" "}
                    {todayStats.total} goals today
                  </p>
                  <p className="text-green-200/80 text-sm">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold mb-2">
                    {Math.round(
                      (todayStats.completed / todayStats.total) * 100
                    )}
                    %
                  </div>
                  <div className="text-green-100 text-sm sm:text-base">
                    Complete
                  </div>
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
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Calories
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Energy intake
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isGoalCompleted("calories") && (
                    <>
                      <input
                        type="number"
                        value={inputValues.calories}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            calories: e.target.value,
                          }))
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          updateGoalProgressFromInput("calories")
                        }
                        placeholder="0"
                        className="w-16 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateGoalProgressFromInput("calories")}
                        className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                        title="Set current calories"
                      >
                        Set
                      </button>
                    </>
                  )}
                  {isGoalCompleted("calories") && !isGoalExceeded("calories") && (
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {isGoalExceeded("calories") && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {goalProgress.calories || 0}
                  </span>
                  <span className="text-gray-400 text-sm sm:text-base">
                    / {dailyGoals?.targets?.calories || dailyGoals?.calorieGoal}{" "}
                    cal
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(getProgressPercentage("calories"), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("calories") && !isGoalExceeded("calories") && (
                <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm font-medium">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Goal completed!</span>
                  <span className="sm:hidden">Done!</span>
                </div>
              )}
              {isGoalExceeded("calories") && (
                <div className="flex items-center gap-2 text-yellow-600 text-xs sm:text-sm font-medium">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Goal exceeded!</span>
                  <span className="sm:hidden">Exceeded!</span>
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
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Water
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Hydration
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isGoalCompleted("water") && (
                    <>
                      <input
                        type="number"
                        value={inputValues.water}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            water: e.target.value,
                          }))
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          updateGoalProgressFromInput("water")
                        }
                        placeholder="0"
                        className="w-12 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateGoalProgressFromInput("water")}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="Set current glasses"
                      >
                        Set
                      </button>
                    </>
                  )}
                  {isGoalCompleted("water") && !isGoalExceeded("water") && (
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {isGoalExceeded("water") && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {goalProgress.water || 0}
                  </span>
                  <span className="text-gray-400 text-sm sm:text-base">
                    / {dailyGoals?.targets?.water || dailyGoals?.waterGoal}{" "}
                    glasses
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getProgressPercentage("water"), 100)}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("water") && !isGoalExceeded("water") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
              {isGoalExceeded("water") && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Goal exceeded!
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
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Meals
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Nutrition
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isGoalCompleted("meals") && (
                    <>
                      <input
                        type="number"
                        value={inputValues.meals}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            meals: e.target.value,
                          }))
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          updateGoalProgressFromInput("meals")
                        }
                        placeholder="0"
                        className="w-12 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:border-green-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateGoalProgressFromInput("meals")}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        title="Set current meals"
                      >
                        Set
                      </button>
                    </>
                  )}
                  {isGoalCompleted("meals") && !isGoalExceeded("meals") && (
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {isGoalExceeded("meals") && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {goalProgress.meals || 0}
                  </span>
                  <span className="text-gray-400">
                    / {dailyGoals?.targets?.meals || dailyGoals?.mealsGoal}{" "}
                    meals
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getProgressPercentage("meals"), 100)}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("meals") && !isGoalExceeded("meals") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
              {isGoalExceeded("meals") && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Goal exceeded!
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
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Exercise
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">Activity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isGoalCompleted("exercise") && (
                    <>
                      <input
                        type="number"
                        value={inputValues.exercise}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            exercise: e.target.value,
                          }))
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          updateGoalProgressFromInput("exercise")
                        }
                        placeholder="0"
                        className="w-12 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateGoalProgressFromInput("exercise")}
                        className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                        title="Set current minutes"
                      >
                        Set
                      </button>
                    </>
                  )}
                  {isGoalCompleted("exercise") && !isGoalExceeded("exercise") && (
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {isGoalExceeded("exercise") && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {goalProgress.exercise || 0}
                  </span>
                  <span className="text-gray-400">
                    /{" "}
                    {dailyGoals?.targets?.exercise || dailyGoals?.exerciseGoal}{" "}
                    min
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(getProgressPercentage("exercise"), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("exercise") && !isGoalExceeded("exercise") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
              {isGoalExceeded("exercise") && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Goal exceeded!
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
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Sleep
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">Recovery</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isGoalCompleted("sleep") && (
                    <>
                      <input
                        type="number"
                        value={inputValues.sleep}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            sleep: e.target.value,
                          }))
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          updateGoalProgressFromInput("sleep")
                        }
                        placeholder="0"
                        className="w-12 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateGoalProgressFromInput("sleep")}
                        className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                        title="Set current hours"
                      >
                        Set
                      </button>
                    </>
                  )}
                  {isGoalCompleted("sleep") && !isGoalExceeded("sleep") && (
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {isGoalExceeded("sleep") && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {goalProgress.sleep || 0}
                  </span>
                  <span className="text-gray-400">
                    / {dailyGoals?.targets?.sleep || dailyGoals?.sleepGoal}{" "}
                    hours
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getProgressPercentage("sleep"), 100)}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("sleep") && !isGoalExceeded("sleep") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
              {isGoalExceeded("sleep") && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Goal exceeded!
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
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Steps
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">Movement</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isGoalCompleted("steps") && (
                    <>
                      <input
                        type="number"
                        value={inputValues.steps}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            steps: e.target.value,
                          }))
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          updateGoalProgressFromInput("steps")
                        }
                        placeholder="0"
                        className="w-16 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:border-red-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateGoalProgressFromInput("steps")}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Set current steps"
                      >
                        Set
                      </button>
                    </>
                  )}
                  {isGoalCompleted("steps") && !isGoalExceeded("steps") && (
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {isGoalExceeded("steps") && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-white">
                    {(goalProgress.steps || 0).toLocaleString()}
                  </span>
                  <span className="text-gray-400">
                    /{" "}
                    {(
                      dailyGoals?.targets?.steps ||
                      dailyGoals?.stepsGoal ||
                      0
                    ).toLocaleString()}{" "}
                    steps
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getProgressPercentage("steps"), 100)}%` }}
                  ></div>
                </div>
              </div>

              {isGoalCompleted("steps") && !isGoalExceeded("steps") && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Goal completed!
                </div>
              )}
              {isGoalExceeded("steps") && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Goal exceeded!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Completion Confirmation Modal */}
      {showCompletionModal && completingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Complete {getGoalDisplayName(completingGoal.type)} Goal?
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you've completed your {getGoalDisplayName(completingGoal.type).toLowerCase()} goal for today?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCancelCompletion}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  No, go back
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Yes, complete it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongratulationsModal && congratulatedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                🎉 Congratulations!
              </h3>
              <p className="text-gray-300 mb-6">
                You've completed your {getGoalDisplayName(congratulatedGoal).toLowerCase()} goal for today! Keep up the great work!
              </p>
              <button
                onClick={handleCloseCongratulations}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all"
              >
                Awesome! 🌟
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
