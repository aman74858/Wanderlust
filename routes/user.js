const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require('passport');
const { saveRedirectUrl, isLoggedIn } = require('../authMiddleware.js');
const userController = require('../controllers/users.js');

// Signup routes
router.route('/signup')
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signupForm));

// Login routes
router.route('/login')
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    userController.loginForm
  );

// Forgot Password routes
router.route('/forgot-password')
  .get(userController.renderForgotPasswordForm)
  .post(wrapAsync(userController.forgotPassword));

// Reset Password routes
router.route('/reset-password/:token')
  .get(wrapAsync(userController.renderResetPasswordForm))
  .post(wrapAsync(userController.resetPassword));

// Host Dashboard Portal (Host only)
router.get('/host/dashboard', isLoggedIn, wrapAsync(userController.renderHostDashboard));

// Switch Role (Host <-> Guest)
router.route('/switch-role')
  .get(isLoggedIn, wrapAsync(userController.switchRole))
  .post(isLoggedIn, wrapAsync(userController.switchRole));

// Logout route
router.route('/logout')
  .get(userController.logoutUser);

module.exports = router;