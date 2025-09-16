const express = require('express');
const Progress = require('../models/Progress');
const Goal = require('../models/Goal');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/progress/today
// @desc    Get today's progress for user
// @access  Private
router.get('/today', async (req, res) => {
  try {
    // Get user's current goals
    const goals = await Goal.getCurrentGoals(req.user.userId);
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for today. Please set your daily goals first.' 
      });
    }

    // Get or create today's progress
    const today = new Date();
    const progress = await Progress.getOrCreateProgress(req.user.userId, goals._id, today);

    // Calculate completion stats
    const completionStats = await progress.calculateCompletion();

    res.json({ 
      progress,
      goals,
      completionStats
    });

  } catch (error) {
    console.error('Today progress fetch error:', error);
    res.status(500).json({ message: 'Server error fetching today\'s progress' });
  }
});

// @route   GET /api/progress/:date
// @desc    Get progress for specific date
// @access  Private
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Get goals for that date
    const goals = await Goal.getGoalsForDate(req.user.userId, targetDate);
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for this date' 
      });
    }

    // Get progress for that date
    const progress = await Progress.getOrCreateProgress(req.user.userId, goals._id, targetDate);

    // Calculate completion stats
    const completionStats = await progress.calculateCompletion();

    res.json({ 
      progress,
      goals,
      completionStats
    });

  } catch (error) {
    console.error('Date progress fetch error:', error);
    res.status(500).json({ message: 'Server error fetching progress' });
  }
});

// @route   PUT /api/progress/update/:type
// @desc    Update specific progress type
// @access  Private
router.put('/update/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { value, operation = 'add', date } = req.body;

    // Validate progress type
    const validTypes = ['calories', 'water', 'meals', 'exercise', 'sleep', 'steps'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid progress type' });
    }

    // Validate value
    if (typeof value !== 'number' || value < 0) {
      return res.status(400).json({ message: 'Value must be a positive number' });
    }

    // Get target date
    const targetDate = date ? new Date(date) : new Date();
    
    // Get goals for that date
    const goals = await Goal.getGoalsForDate(req.user.userId, targetDate);
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for this date' 
      });
    }

    // Get or create progress
    const progress = await Progress.getOrCreateProgress(req.user.userId, goals._id, targetDate);

    // Update progress
    await progress.updateProgress(type, value, operation);

    // Calculate completion stats
    const completionStats = await progress.calculateCompletion();

    res.json({
      message: `${type} progress updated successfully`,
      progress,
      completionStats
    });

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: 'Server error updating progress' });
  }
});

// @route   POST /api/progress/activity
// @desc    Add activity to progress
// @access  Private
router.post('/activity', async (req, res) => {
  try {
    const { 
      type, 
      description, 
      value, 
      unit, 
      date,
      foodId, 
      exerciseType, 
      metadata 
    } = req.body;

    // Validate required fields
    if (!type || !description || value === undefined || !unit) {
      return res.status(400).json({ 
        message: 'Type, description, value, and unit are required' 
      });
    }

    // Validate activity type
    const validTypes = ['food', 'water', 'exercise', 'sleep', 'manual'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid activity type' });
    }

    // Get target date
    const targetDate = date ? new Date(date) : new Date();
    
    // Get goals for that date
    const goals = await Goal.getGoalsForDate(req.user.userId, targetDate);
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for this date' 
      });
    }

    // Get or create progress
    const progress = await Progress.getOrCreateProgress(req.user.userId, goals._id, targetDate);

    // Add activity
    await progress.addActivity({
      activityType: type,
      description,
      value,
      unit,
      foodId,
      exerciseType,
      metadata: metadata || {}
    });

    // Calculate completion stats
    const completionStats = await progress.calculateCompletion();

    res.status(201).json({
      message: 'Activity added successfully',
      activity: progress.activities[progress.activities.length - 1],
      progress,
      completionStats
    });

  } catch (error) {
    console.error('Activity add error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error adding activity' });
  }
});

// @route   DELETE /api/progress/activity/:activityId
// @desc    Remove activity from progress
// @access  Private
router.delete('/activity/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { date } = req.query;

    // Get target date
    const targetDate = date ? new Date(date) : new Date();
    
    // Get goals for that date
    const goals = await Goal.getGoalsForDate(req.user.userId, targetDate);
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for this date' 
      });
    }

    // Get progress
    const progress = await Progress.findOne({
      userId: req.user.userId,
      goalId: goals._id,
      date: { $gte: new Date(targetDate).setHours(0, 0, 0, 0) }
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Find and remove activity
    const activityIndex = progress.activities.findIndex(
      activity => activity._id.toString() === activityId
    );

    if (activityIndex === -1) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const removedActivity = progress.activities[activityIndex];
    progress.activities.splice(activityIndex, 1);

    // Reverse the progress changes from the removed activity
    if (removedActivity.activityType === 'food') {
      progress.current.calories = Math.max(0, progress.current.calories - (removedActivity.value || 0));
      progress.current.meals = Math.max(0, progress.current.meals - 1);
    } else if (removedActivity.activityType === 'water') {
      progress.current.water = Math.max(0, progress.current.water - (removedActivity.value || 0));
    } else if (removedActivity.activityType === 'exercise') {
      progress.current.exercise = Math.max(0, progress.current.exercise - (removedActivity.value || 0));
      const caloriesBurned = removedActivity.metadata?.caloriesBurned || 0;
      progress.summary.caloriesBurned = Math.max(0, progress.summary.caloriesBurned - caloriesBurned);
    }

    await progress.save();

    // Calculate completion stats
    const completionStats = await progress.calculateCompletion();

    res.json({
      message: 'Activity removed successfully',
      progress,
      completionStats
    });

  } catch (error) {
    console.error('Activity remove error:', error);
    res.status(500).json({ message: 'Server error removing activity' });
  }
});

// @route   GET /api/progress/range/:startDate/:endDate
// @desc    Get progress for date range
// @access  Private
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Get progress for date range
    const progressData = await Progress.getProgressRange(req.user.userId, start, end);

    // Get corresponding goals for each progress entry
    const progressWithGoals = await Promise.all(
      progressData.map(async (progress) => {
        const goal = await Goal.findById(progress.goalId);
        const completionStats = await progress.calculateCompletion();
        return {
          progress,
          goal,
          completionStats
        };
      })
    );

    res.json({ 
      data: progressWithGoals,
      summary: {
        totalDays: progressData.length,
        dateRange: { start, end }
      }
    });

  } catch (error) {
    console.error('Progress range fetch error:', error);
    res.status(500).json({ message: 'Server error fetching progress range' });
  }
});

// @route   DELETE /api/progress/today
// @desc    Delete today's progress for user
// @access  Private
router.delete('/today', async (req, res) => {
  try {
    // Get user's current goals
    const goals = await Goal.getCurrentGoals(req.user.userId);
    if (!goals) {
      return res.status(404).json({
        message: 'No goals found for today.'
      });
    }

    // Get today's progress
    const today = new Date();
    const progress = await Progress.findOne({
      userId: req.user.userId,
      goalId: goals._id,
      date: {
        $gte: new Date(today).setHours(0, 0, 0, 0),
        $lt: new Date(today).setHours(23, 59, 59, 999)
      }
    });

    if (!progress) {
      return res.status(404).json({ message: 'No progress found for today' });
    }

    await Progress.deleteOne({ _id: progress._id });

    res.json({
      message: 'Today\'s progress deleted successfully'
    });

  } catch (error) {
    console.error('Today progress delete error:', error);
    res.status(500).json({ message: 'Server error deleting today\'s progress' });
  }
});

// @route   GET /api/progress/stats/weekly
// @desc    Get weekly progress statistics
// @access  Private
router.get('/stats/weekly', async (req, res) => {
  try {
    const { date } = req.query;
    const baseDate = date ? new Date(date) : new Date();
    
    // Calculate start of week (Monday)
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get progress for the week
    const weeklyProgress = await Progress.getProgressRange(req.user.userId, startOfWeek, endOfWeek);

    // Calculate weekly stats
    let totalCompletedGoals = 0;
    let totalPossibleGoals = 0;
    let dailyStats = [];

    for (const progress of weeklyProgress) {
      const completionStats = await progress.calculateCompletion();
      totalCompletedGoals += completionStats.completed;
      totalPossibleGoals += completionStats.total;
      
      dailyStats.push({
        date: progress.date,
        completed: completionStats.completed,
        total: completionStats.total,
        percentage: completionStats.percentage
      });
    }

    const weeklyCompletionRate = totalPossibleGoals > 0 
      ? Math.round((totalCompletedGoals / totalPossibleGoals) * 100) 
      : 0;

    res.json({
      weeklyStats: {
        startDate: startOfWeek,
        endDate: endOfWeek,
        totalDays: dailyStats.length,
        completionRate: weeklyCompletionRate,
        totalCompleted: totalCompletedGoals,
        totalPossible: totalPossibleGoals
      },
      dailyStats
    });

  } catch (error) {
    console.error('Weekly stats fetch error:', error);
    res.status(500).json({ message: 'Server error fetching weekly statistics' });
  }
});

module.exports = router;