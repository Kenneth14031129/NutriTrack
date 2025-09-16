const express = require('express');
const Goal = require('../models/Goal');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/goals
// @desc    Create daily goals for user
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { date, targets, nutritionalTargets, customGoals } = req.body;

    // Validate required targets
    const requiredTargets = ['calories', 'water', 'meals', 'exercise', 'sleep', 'steps'];
    for (const target of requiredTargets) {
      if (!targets[target]) {
        return res.status(400).json({ 
          message: `${target} target is required` 
        });
      }
    }

    // Check if goals already exist for this date
    const existingGoals = await Goal.getGoalsForDate(req.user.userId, date || new Date());
    if (existingGoals) {
      return res.status(400).json({ 
        message: 'Goals already exist for this date. Use PUT to update.' 
      });
    }

    // Create new goals with normalized date (start of day)
    const goalDate = date ? new Date(date) : new Date();
    goalDate.setHours(0, 0, 0, 0); // Normalize to start of day

    const goals = new Goal({
      userId: req.user.userId,
      date: goalDate,
      targets,
      nutritionalTargets: nutritionalTargets || {},
      customGoals: customGoals || []
    });

    await goals.save();

    res.status(201).json({
      message: 'Goals created successfully',
      goals
    });

  } catch (error) {
    console.error('Goal creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error creating goals' });
  }
});

// @route   GET /api/goals/current
// @desc    Get current user's daily goals
// @access  Private
router.get('/current', async (req, res) => {
  try {
    const goals = await Goal.getCurrentGoals(req.user.userId);
    
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for today. Please set your daily goals.' 
      });
    }

    res.json({ goals });

  } catch (error) {
    console.error('Current goals fetch error:', error);
    res.status(500).json({ message: 'Server error fetching current goals' });
  }
});

// @route   GET /api/goals/:date
// @desc    Get user's goals for specific date
// @access  Private
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const goals = await Goal.getGoalsForDate(req.user.userId, targetDate);
    
    if (!goals) {
      return res.status(404).json({ 
        message: 'No goals found for this date' 
      });
    }

    res.json({ goals });

  } catch (error) {
    console.error('Goals fetch error:', error);
    res.status(500).json({ message: 'Server error fetching goals' });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update user's goals
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { targets, nutritionalTargets, customGoals } = req.body;

    const goals = await Goal.findById(id);
    
    if (!goals) {
      return res.status(404).json({ message: 'Goals not found' });
    }

    // Check ownership
    if (goals.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update these goals' });
    }

    // Update fields
    if (targets) goals.targets = { ...goals.targets, ...targets };
    if (nutritionalTargets) goals.nutritionalTargets = { ...goals.nutritionalTargets, ...nutritionalTargets };
    if (customGoals) goals.customGoals = customGoals;

    await goals.save();

    res.json({
      message: 'Goals updated successfully',
      goals
    });

  } catch (error) {
    console.error('Goals update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error updating goals' });
  }
});

// @route   PUT /api/goals/:id/custom-goal/:goalIndex
// @desc    Update a specific custom goal
// @access  Private
router.put('/:id/custom-goal/:goalIndex', async (req, res) => {
  try {
    const { id, goalIndex } = req.params;
    const { isCompleted } = req.body;

    const goals = await Goal.findById(id);
    
    if (!goals) {
      return res.status(404).json({ message: 'Goals not found' });
    }

    // Check ownership
    if (goals.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update these goals' });
    }

    // Validate goal index
    if (goalIndex >= goals.customGoals.length) {
      return res.status(400).json({ message: 'Custom goal not found' });
    }

    // Update custom goal
    goals.customGoals[goalIndex].isCompleted = isCompleted;
    await goals.save();

    res.json({
      message: 'Custom goal updated successfully',
      customGoal: goals.customGoals[goalIndex]
    });

  } catch (error) {
    console.error('Custom goal update error:', error);
    res.status(500).json({ message: 'Server error updating custom goal' });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete user's goals
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const goals = await Goal.findById(id);
    
    if (!goals) {
      return res.status(404).json({ message: 'Goals not found' });
    }

    // Check ownership
    if (goals.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete these goals' });
    }

    // Soft delete by setting isActive to false
    goals.isActive = false;
    await goals.save();

    res.json({ message: 'Goals deleted successfully' });

  } catch (error) {
    console.error('Goals delete error:', error);
    res.status(500).json({ message: 'Server error deleting goals' });
  }
});

// @route   GET /api/goals/range/:startDate/:endDate
// @desc    Get user's goals for date range
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

    const goals = await Goal.find({
      userId: req.user.userId,
      date: { $gte: start, $lte: end },
      isActive: true
    }).sort({ date: -1 });

    res.json({ goals });

  } catch (error) {
    console.error('Goals range fetch error:', error);
    res.status(500).json({ message: 'Server error fetching goals range' });
  }
});

module.exports = router;