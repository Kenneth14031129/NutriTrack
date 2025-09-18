import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Clock,
  Dumbbell,
  Trash2,
  Menu,
  Check,
  Loader2,
  Target,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import apiService from "../services/api";

const WorkoutPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plannedWorkouts, setPlannedWorkouts] = useState({});
  const [isLoadingWeeklyWorkouts, setIsLoadingWeeklyWorkouts] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [selectedDayForDetails, setSelectedDayForDetails] = useState(
    new Date()
  );
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    type: "strength",
    plannedTime: "09:00",
    duration: "60",
    exercises: "",
    targetMuscles: "",
  });

  // Loading states for different operations
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState({});
  const [isUpdatingWorkoutStatus, setIsUpdatingWorkoutStatus] = useState({});

  // Helper function to convert 24-hour time to 12-hour format
  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour12 = parseInt(hours, 10);
    const ampm = hour12 >= 12 ? "PM" : "AM";
    const displayHour = hour12 === 0 ? 12 : hour12 > 12 ? hour12 - 12 : hour12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const workoutTypes = [
    {
      id: "strength",
      label: "Strength Training",
      icon: "💪",
      time: "45-90 min",
    },
    { id: "cardio", label: "Cardio", icon: "🏃", time: "30-60 min" },
    { id: "yoga", label: "Yoga", icon: "🧘", time: "30-90 min" },
    { id: "hiit", label: "HIIT", icon: "⚡", time: "20-45 min" },
    { id: "sports", label: "Sports", icon: "⚽", time: "60-120 min" },
    { id: "flexibility", label: "Stretching", icon: "🤸", time: "15-30 min" },
  ];

  // Load workouts for the selected week
  const loadWeeklyWorkouts = async (startDate) => {
    if (!apiService.isAuthenticated()) {
      const dateKey = startDate.toISOString().split("T")[0];
      setPlannedWorkouts({
        [dateKey]: {
          strength: [],
          cardio: [],
          yoga: [],
          hiit: [],
          sports: [],
          flexibility: [],
        },
      });
      return;
    }

    setIsLoadingWeeklyWorkouts(true);
    try {
      const response = await apiService.getWeeklyWorkoutPlan(startDate);
      setPlannedWorkouts(response.workoutPlan || {});
    } catch (error) {
      console.error("Error loading weekly workouts:", error);

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
        error.message.includes("unauthorized")
      ) {
        console.error("Authentication error:", error);
        alert("Please log in to access your workout planner.");
      } else {
        console.error("API Error:", error);
        alert("Error loading workouts: " + error.message);
      }
      setPlannedWorkouts({});
    } finally {
      setIsLoadingWeeklyWorkouts(false);
    }
  };

  // Get the start of the week (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Generate week days
  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    loadWeeklyWorkouts(weekStart);
  }, [weekStart]);

  // Show initial loading screen
  if (isLoadingWeeklyWorkouts && Object.keys(plannedWorkouts).length === 0) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage="workout-planner"
        />
        <div className="flex flex-col flex-1 lg:ml-0">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Loading Workout Planner
              </h2>
              <p className="text-gray-400">
                Setting up your weekly workout plan...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateWorkout = async () => {
    if (!workoutForm.name.trim()) return;

    setIsCreatingWorkout(true);
    try {
      const workoutData = {
        ...workoutForm,
        date: selectedDayForDetails?.toISOString().split("T")[0],
        duration: parseInt(workoutForm.duration),
        status: "planned",
      };

      const response = await apiService.createWorkout(workoutData);
      const newWorkout = response.workout;

      // Update local state
      const dateKey = selectedDayForDetails.toISOString().split("T")[0];
      setPlannedWorkouts((prev) => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [workoutForm.type]: [
            ...(prev[dateKey]?.[workoutForm.type] || []),
            newWorkout,
          ],
        },
      }));

      // Reset form and close modal
      setWorkoutForm({
        name: "",
        type: "strength",
        plannedTime: "09:00",
        duration: "60",
        exercises: "",
        targetMuscles: "",
      });
      setShowWorkoutModal(false);
    } catch (error) {
      console.error("Error creating workout:", error);
    } finally {
      setIsCreatingWorkout(false);
    }
  };

  const handleDeleteWorkout = async (workoutId, date, type) => {
    setIsDeletingWorkout({ [workoutId]: true });
    try {
      await apiService.deleteWorkout(workoutId);

      // Update local state
      const dateKey = date.toISOString().split("T")[0];
      setPlannedWorkouts((prev) => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [type]: prev[dateKey][type].filter(
            (workout) => (workout._id || workout.id) !== workoutId
          ),
        },
      }));
    } catch (error) {
      console.error("Error deleting workout:", error);
    } finally {
      setIsDeletingWorkout({ [workoutId]: false });
    }
  };

  const handleConfirmDelete = async () => {
    if (workoutToDelete) {
      await handleDeleteWorkout(
        workoutToDelete.id,
        workoutToDelete.date,
        workoutToDelete.type
      );
      setShowDeleteModal(false);
      setWorkoutToDelete(null);
    }
  };

  const handleWorkoutStatusToggle = async (workoutId, date, type) => {
    setIsUpdatingWorkoutStatus({ [workoutId]: true });
    try {
      // Get current workout to determine new status
      const dateKey = date.toISOString().split("T")[0];
      const currentWorkout = plannedWorkouts[dateKey]?.[type]?.find(
        (workout) => (workout._id || workout.id) === workoutId
      );

      const newStatus =
        currentWorkout?.status === "completed" ? "planned" : "completed";

      await apiService.updateWorkoutStatus(workoutId, newStatus);

      // Update local state
      setPlannedWorkouts((prev) => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [type]: prev[dateKey][type].map((workout) =>
            (workout._id || workout.id) === workoutId
              ? {
                  ...workout,
                  status: newStatus,
                }
              : workout
          ),
        },
      }));
    } catch (error) {
      console.error("Error updating workout status:", error);
    } finally {
      setIsUpdatingWorkoutStatus({ [workoutId]: false });
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="workout-planner"
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
                  <Dumbbell className="text-green-400 w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="hidden sm:inline">Workout Planner</span>
                  <span className="sm:hidden">Workouts</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  <span className="hidden sm:inline">
                    Plan and track your fitness routine
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
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Week Navigation */}
          <div className="mb-6 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors"
                title="Previous week"
              >
                ←
              </button>

              <h2 className="text-lg font-semibold text-white text-center">
                {weekStart.toLocaleDateString("en-US", {
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
                title="Next week"
              >
                →
              </button>
            </div>

            {isLoadingWeeklyWorkouts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                <span className="ml-2 text-gray-400">Loading workouts...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                {weekDays.map((day, index) => {
                  const dateKey = day.toISOString().split("T")[0];
                  const dayWorkouts = plannedWorkouts[dateKey] || {};
                  const totalWorkouts =
                    Object.values(dayWorkouts).flat().length;
                  const completedWorkouts = Object.values(dayWorkouts)
                    .flat()
                    .filter((w) => w.status === "completed").length;
                  const isToday =
                    day.toDateString() === new Date().toDateString();
                  const isPastDate =
                    day < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <div
                      key={index}
                      className={`border border-gray-600 bg-gray-700/50 rounded-lg p-4 hover:border-green-400 hover:bg-gray-700 transition-all cursor-pointer ${
                        isToday ? "ring-2 ring-green-500" : ""
                      } ${isPastDate ? "opacity-75" : ""} ${
                        selectedDayForDetails.toDateString() ===
                        day.toDateString()
                          ? "ring-2 ring-blue-400"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedDayForDetails(day);
                      }}
                      title={day.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    >
                      <div className="text-center mb-3">
                        <div className="text-sm font-medium text-gray-300">
                          {day.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            isToday ? "text-green-400" : "text-white"
                          }`}
                        >
                          {day.getDate()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {totalWorkouts === 0 ? (
                          <div className="text-center py-2">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-1">
                              <Plus className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400">No workouts</p>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 text-center">
                            {completedWorkouts}/{totalWorkouts} completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Date Details */}
          <div className="mb-6 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedDayForDetails.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <p className="text-gray-400 text-sm">
                  {selectedDayForDetails.toDateString() ===
                  new Date().toDateString()
                    ? "Today's Schedule"
                    : selectedDayForDetails <
                      new Date(new Date().setHours(0, 0, 0, 0))
                    ? "Past Workout History"
                    : "Planned Workouts"}
                </p>
              </div>
              {selectedDayForDetails >=
                new Date(new Date().setHours(0, 0, 0, 0)) && (
                <button
                  onClick={() => {
                    setShowWorkoutModal(true);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all flex items-center gap-1 sm:gap-2"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Quick Add</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const dateKey = selectedDayForDetails
                  .toISOString()
                  .split("T")[0];
                const dayWorkouts = plannedWorkouts[dateKey] || {};
                const allWorkouts = Object.entries(dayWorkouts)
                  .flatMap(([type, workouts]) =>
                    workouts.map((workout) => ({ ...workout, type }))
                  )
                  .sort((a, b) => a.plannedTime.localeCompare(b.plannedTime));

                if (allWorkouts.length === 0) {
                  return (
                    <div className="col-span-full text-center py-8">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-white mb-2">
                        No Workouts Planned
                      </h4>
                      <p className="text-gray-400">
                        {selectedDayForDetails >=
                        new Date(new Date().setHours(0, 0, 0, 0))
                          ? "Use the Quick Add button above to start planning your workout for this day"
                          : "No workouts were scheduled for this day"}
                      </p>
                    </div>
                  );
                }

                return allWorkouts.map((workout) => {
                  const isPastDate =
                    selectedDayForDetails <
                    new Date(new Date().setHours(0, 0, 0, 0));
                  const isMissed = isPastDate && workout.status !== "completed";
                  const workoutType = workoutTypes.find(
                    (t) => t.id === workout.type
                  );

                  return (
                    <div
                      key={workout._id || workout.id}
                      className={`p-4 rounded-lg border transition-all ${
                        workout.status === "completed"
                          ? "bg-green-600/20 border-green-600"
                          : isMissed
                          ? "bg-red-600/20 border-red-600"
                          : "bg-blue-600/20 border-blue-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="text-lg sm:text-2xl flex-shrink-0">
                            {workoutType?.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium sm:font-semibold text-sm sm:text-base text-white truncate">
                              {workout.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              {workoutType?.label}
                            </p>
                          </div>
                        </div>
                        {selectedDayForDetails >=
                        new Date(new Date().setHours(0, 0, 0, 0)) ? (
                          <button
                            onClick={() =>
                              handleWorkoutStatusToggle(
                                workout._id || workout.id,
                                selectedDayForDetails,
                                workout.type
                              )
                            }
                            disabled={
                              isUpdatingWorkoutStatus[workout._id || workout.id]
                            }
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                              workout.status === "completed"
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          >
                            {isUpdatingWorkoutStatus[
                              workout._id || workout.id
                            ] ? (
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            ) : workout.status === "completed" ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        ) : (
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              workout.status === "completed"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {workout.status === "completed" ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-300">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {formatTime12Hour(workout.plannedTime)} (
                            {workout.duration} min)
                          </span>
                        </div>
                        {workout.exercises && (
                          <div className="flex items-center text-gray-300">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {workout.exercises}
                            </span>
                          </div>
                        )}
                        {workout.targetMuscles && (
                          <div className="text-gray-400 truncate">
                            Target: {workout.targetMuscles}
                          </div>
                        )}
                        {workout.notes && (
                          <div className="text-gray-400 italic text-xs line-clamp-2">
                            "{workout.notes}"
                          </div>
                        )}
                      </div>

                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-600 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                            workout.status === "completed"
                              ? "bg-green-600 text-white"
                              : isMissed
                              ? "bg-red-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {workout.status === "completed"
                            ? "Completed"
                            : isMissed
                            ? "Missed"
                            : "Planned"}
                        </span>
                        {selectedDayForDetails >=
                          new Date(new Date().setHours(0, 0, 0, 0)) && (
                          <button
                            onClick={() => {
                              setWorkoutToDelete({
                                id: workout._id || workout.id,
                                name: workout.name,
                                date: selectedDayForDetails,
                                type: workout.type,
                              });
                              setShowDeleteModal(true);
                            }}
                            disabled={
                              isDeletingWorkout[workout._id || workout.id]
                            }
                            className="p-1 sm:p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                          >
                            {isDeletingWorkout[workout._id || workout.id] ? (
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Workout Creation Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 backdrop-blur bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-xs sm:max-w-md lg:max-w-lg w-full border border-gray-700">
            <div className="border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Add New Workout
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Plan your workout session
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={workoutForm.name}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, name: e.target.value })
                  }
                  placeholder="e.g., Upper Body Strength"
                  className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Workout Type
                </label>
                <select
                  value={workoutForm.type}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, type: e.target.value })
                  }
                  className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {workoutTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Planned Time
                  </label>
                  <input
                    type="time"
                    value={workoutForm.plannedTime}
                    onChange={(e) =>
                      setWorkoutForm({
                        ...workoutForm,
                        plannedTime: e.target.value,
                      })
                    }
                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={workoutForm.duration}
                    onChange={(e) =>
                      setWorkoutForm({
                        ...workoutForm,
                        duration: e.target.value,
                      })
                    }
                    placeholder="60"
                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Exercises/Focus
                  </label>
                  <input
                    type="text"
                    value={workoutForm.exercises}
                    onChange={(e) =>
                      setWorkoutForm({
                        ...workoutForm,
                        exercises: e.target.value,
                      })
                    }
                    placeholder="Push-ups, Pull-ups"
                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Target Muscles
                  </label>
                  <input
                    type="text"
                    value={workoutForm.targetMuscles}
                    onChange={(e) =>
                      setWorkoutForm({
                        ...workoutForm,
                        targetMuscles: e.target.value,
                      })
                    }
                    placeholder="Chest, Back"
                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkout}
                disabled={isCreatingWorkout || !workoutForm.name.trim()}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isCreatingWorkout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Workout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && workoutToDelete && (
        <div className="fixed inset-0 backdrop-blur bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-xs sm:max-w-md w-full border border-gray-700">
            <div className="border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Delete Workout
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                This action cannot be undone
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
                Are you sure you want to delete "{workoutToDelete.name}"?
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                This workout will be permanently removed from your schedule.
              </p>
            </div>

            <div className="border-t border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWorkoutToDelete(null);
                }}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={
                  workoutToDelete && isDeletingWorkout[workoutToDelete.id]
                }
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {workoutToDelete && isDeletingWorkout[workoutToDelete.id] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Workout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlanner;
