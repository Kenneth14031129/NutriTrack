const express = require('express');
const Workout = require('../models/Workout');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/workouts
// @desc    Create a new workout
// @access  Private
router.post('/', async (req, res) => {
  try {
    const workoutData = {
      ...req.body,
      userId: req.user.userId
    };

    const workout = new Workout(workoutData);
    await workout.save();

    res.status(201).json({
      message: 'Workout created successfully',
      workout
    });

  } catch (error) {
    console.error('Workout creation error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ message: 'Server error creating workout' });
  }
});

// @route   GET /api/workouts/today
// @desc    Get today's workouts
// @access  Private
router.get('/today', async (req, res) => {
  try {
    const workouts = await Workout.getWorkoutsForDate(req.user.userId, new Date());

    // Group workouts by type
    const workoutsByType = {
      strength: [],
      cardio: [],
      yoga: [],
      hiit: [],
      sports: [],
      flexibility: []
    };

    workouts.forEach(workout => {
      if (workoutsByType[workout.type]) {
        workoutsByType[workout.type].push(workout);
      }
    });

    // Calculate daily totals
    let dailyTotals = {
      totalWorkouts: workouts.length,
      completedWorkouts: workouts.filter(w => w.status === 'completed').length,
      totalDuration: 0,
      totalCaloriesBurned: 0
    };

    workouts.forEach(workout => {
      if (workout.status === 'completed') {
        dailyTotals.totalDuration += workout.actualDuration || workout.duration || 0;
        dailyTotals.totalCaloriesBurned += workout.caloriesBurned || 0;
      }
    });

    res.json({
      workouts: workoutsByType,
      dailyTotals,
      date: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Error fetching today\'s workouts:', error);
    res.status(500).json({ message: 'Server error fetching workouts' });
  }
});

// @route   GET /api/workouts/week/:startDate
// @desc    Get weekly workout plan
// @access  Private
router.get('/week/:startDate', async (req, res) => {
  try {
    const { startDate } = req.params;
    const startOfWeek = new Date(startDate);

    if (isNaN(startOfWeek.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const workouts = await Workout.getWeeklyWorkoutPlan(req.user.userId, startOfWeek);

    // Group workouts by date and type
    const workoutPlan = {};

    // Initialize empty structure for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];

      workoutPlan[dateKey] = {
        strength: [],
        cardio: [],
        yoga: [],
        hiit: [],
        sports: [],
        flexibility: []
      };
    }

    // Populate with actual workouts
    workouts.forEach(workout => {
      const dateKey = workout.date.toISOString().split('T')[0];
      if (workoutPlan[dateKey] && workoutPlan[dateKey][workout.type]) {
        workoutPlan[dateKey][workout.type].push(workout);
      }
    });

    res.json({
      workoutPlan,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Error fetching weekly workouts:', error);
    res.status(500).json({ message: 'Server error fetching weekly workouts' });
  }
});

// @route   GET /api/workouts/date/:date
// @desc    Get workouts for a specific date
// @access  Private
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const workouts = await Workout.getWorkoutsForDate(req.user.userId, targetDate);

    // Group workouts by type
    const workoutsByType = {
      strength: [],
      cardio: [],
      yoga: [],
      hiit: [],
      sports: [],
      flexibility: []
    };

    workouts.forEach(workout => {
      if (workoutsByType[workout.type]) {
        workoutsByType[workout.type].push(workout);
      }
    });

    res.json({
      workouts: workoutsByType,
      date: targetDate.toISOString().split('T')[0],
      totalWorkouts: workouts.length
    });

  } catch (error) {
    console.error('Error fetching workouts for date:', error);
    res.status(500).json({ message: 'Server error fetching workouts' });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get a specific workout
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json({ workout });

  } catch (error) {
    console.error('Error fetching workout:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID' });
    }

    res.status(500).json({ message: 'Server error fetching workout' });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update a workout
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Update workout fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && key !== '_id') {
        workout[key] = req.body[key];
      }
    });

    await workout.save();

    res.json({
      message: 'Workout updated successfully',
      workout
    });

  } catch (error) {
    console.error('Workout update error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID' });
    }

    res.status(500).json({ message: 'Server error updating workout' });
  }
});

// @route   PATCH /api/workouts/:id/status
// @desc    Update workout status
// @access  Private
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['planned', 'in_progress', 'completed', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    await workout.updateStatus(status);

    res.json({
      message: 'Workout status updated successfully',
      workout
    });

  } catch (error) {
    console.error('Workout status update error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID' });
    }

    res.status(500).json({ message: 'Server error updating workout status' });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted successfully' });

  } catch (error) {
    console.error('Workout deletion error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID' });
    }

    res.status(500).json({ message: 'Server error deleting workout' });
  }
});

// @route   POST /api/workouts/:id/duplicate
// @desc    Duplicate a workout for another date
// @access  Private
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { date, type } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const originalWorkout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!originalWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const duplicatedWorkout = await originalWorkout.duplicateForDate(newDate, type);

    res.status(201).json({
      message: 'Workout duplicated successfully',
      workout: duplicatedWorkout
    });

  } catch (error) {
    console.error('Workout duplication error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID' });
    }

    res.status(500).json({ message: 'Server error duplicating workout' });
  }
});

module.exports = router;