const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware.js');
const reviewsController = require('../controllers/reviews.js');

// POST Review Route
router.post(
  '/',
  isLoggedIn,
  validateReview,
  wrapAsync(reviewsController.createReview)
);

// DELETE Review Route
router.delete(
  '/:reviewId',
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewsController.deleteReview)
);

module.exports = router;