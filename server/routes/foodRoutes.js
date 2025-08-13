/* eslint-disable no-undef */
const express = require('express');
const foodController = require('../controllers/foodController');

const router = express.Router();

router.get('/search', foodController.searchFoods);
router.get('/details/:fdcId', foodController.getFoodDetails);
router.post('/batch', foodController.getMultipleFoods);

module.exports = router;