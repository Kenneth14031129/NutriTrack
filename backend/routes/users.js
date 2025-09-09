const express = require('express');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Progress = require('../models/Progress');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const user = req.user.user;
    
    // Get current goals
    const currentGoals = await Goal.getCurrentGoals(req.user.userId);
    
    // Get today's progress if goals exist
    let todayProgress = null;
    let completionStats = null;
    
    if (currentGoals) {
      todayProgress = await Progress.getOrCreateProgress(
        req.user.userId, 
        currentGoals._id, 
        new Date()
      );
      completionStats = await todayProgress.calculateCompletion();
    }

    // Calculate user stats
    const bmi = user.calculateBMI();
    const dailyCalories = user.calculateDailyCalories();
    
    // Get weekly completion rate
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = await Progress.getProgressRange(
      req.user.userId, 
      oneWeekAgo, 
      new Date()
    );
    
    let totalCompleted = 0;
    let totalPossible = 0;
    
    for (const progress of weeklyProgress) {
      const stats = await progress.calculateCompletion();
      totalCompleted += stats.completed;
      totalPossible += stats.total;
    }
    
    const weeklyCompletionRate = totalPossible > 0 
      ? Math.round((totalCompleted / totalPossible) * 100) 
      : 0;

    res.json({
      user: user.getPublicProfile(),
      currentGoals,
      todayProgress,
      completionStats,
      userStats: {
        bmi,
        dailyCalories,
        weeklyCompletionRate,
        totalActiveDays: weeklyProgress.length
      }
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = req.user.user;
    
    // Calculate additional stats
    const bmi = user.calculateBMI();
    const dailyCalories = user.calculateDailyCalories();
    
    const profile = {
      ...user.getPublicProfile(),
      calculatedStats: {
        bmi,
        dailyCalories
      }
    };

    res.json({ profile });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allowedFields = [
      'name', 'bio', 'age', 'gender', 'height', 'weight', 
      'activityLevel', 'dietaryPreferences', 'allergies', 
      'primaryGoal', 'units', 'notifications'
    ];

    // Update only allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Calculate updated stats
    const bmi = user.calculateBMI();
    const dailyCalories = user.calculateDailyCalories();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
      calculatedStats: {
        bmi,
        dailyCalories
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysBack = parseInt(period);
    
    if (daysBack > 365 || daysBack < 1) {
      return res.status(400).json({ 
        message: 'Period must be between 1 and 365 days' 
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get progress for the period
    const progressData = await Progress.getProgressRange(
      req.user.userId, 
      startDate, 
      new Date()
    );

    // Calculate statistics
    let totalDays = 0;
    let completedDays = 0;
    let totalActivities = 0;
    let goalStats = {
      calories: { completed: 0, total: 0 },
      water: { completed: 0, total: 0 },
      meals: { completed: 0, total: 0 },
      exercise: { completed: 0, total: 0 },
      sleep: { completed: 0, total: 0 },
      steps: { completed: 0, total: 0 }
    };

    for (const progress of progressData) {
      totalDays++;
      totalActivities += progress.activities.length;
      
      const goal = await Goal.findById(progress.goalId);
      if (goal) {
        const completionStats = goal.getCompletionStats(progress);
        
        if (completionStats.percentage === 100) {
          completedDays++;
        }

        // Track individual goal completions
        Object.keys(goalStats).forEach(goalType => {
          goalStats[goalType].total++;
          if (goal.isGoalCompleted(goalType, progress.current)) {
            goalStats[goalType].completed++;
          }
        });
      }
    }

    // Calculate rates
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const avgActivitiesPerDay = totalDays > 0 ? Math.round(totalActivities / totalDays) : 0;

    const goalCompletionRates = {};
    Object.keys(goalStats).forEach(goalType => {
      const { completed, total } = goalStats[goalType];
      goalCompletionRates[goalType] = total > 0 ? Math.round((completed / total) * 100) : 0;
    });

    res.json({
      period: `${daysBack} days`,
      summary: {
        totalDays,
        completedDays,
        completionRate,
        totalActivities,
        avgActivitiesPerDay
      },
      goalCompletionRates,
      streaks: {
        // TODO: Calculate streaks
        current: 0,
        longest: 0
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements (placeholder for future implementation)
// @access  Private
router.get('/achievements', async (req, res) => {
  try {
    // Placeholder for achievement system
    const achievements = [
      {
        id: 'first_goal',
        name: 'Goal Setter',
        description: 'Set your first daily goal',
        earned: true,
        earnedDate: new Date()
      },
      {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Complete all goals for 7 consecutive days',
        earned: false,
        progress: 0,
        target: 7
      }
    ];

    res.json({ achievements });

  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({ message: 'Server error fetching achievements' });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });

  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({ message: 'Server error deactivating account' });
  }
});

module.exports = router;