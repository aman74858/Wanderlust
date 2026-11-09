const User = require('../models/user.js');
const Listing = require('../models/listing.js');
const Booking = require('../models/booking.js');
const crypto = require('crypto');

// Render Signup Form (supports ?role=host or ?role=guest)
module.exports.renderSignupForm = (req, res) => {
  const selectedRole = req.query.role || 'guest';
  res.render('users/signup.ejs', { selectedRole });
};

// Signup User (creates either Guest or Host)
module.exports.signupForm = async (req, res, next) => {
  try {
    const { username, email, password, role = 'guest', phone } = req.body;

    const newUser = new User({
      username,
      email,
      role: ['host', 'guest'].includes(role) ? role : 'guest',
      phone: phone || '',
    });

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }

      if (registeredUser.role === 'host') {
        req.flash('success', `🎉 Welcome to Wanderlust Hosting, ${registeredUser.username}!`);
        return res.redirect('/host/dashboard');
      } else {
        req.flash('success', `🎉 Welcome to Wanderlust, ${registeredUser.username}! Explore amazing stays.`);
        return res.redirect('/listings');
      }
    });

  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/signup');
  }
};

// Render Login Form (supports ?role=host or ?role=guest)
module.exports.renderLoginForm = (req, res) => {
  const selectedRole = req.query.role || 'guest';
  res.render('users/login.ejs', { selectedRole });
};

// Login User
module.exports.loginForm = (req, res) => {
  req.flash('success', `Welcome back, ${req.user.username}!`);

  if (res.locals.redirectUrl) {
    return res.redirect(res.locals.redirectUrl);
  }

  if (req.user.role === 'host') {
    return res.redirect('/host/dashboard');
  }

  res.redirect('/listings');
};

// Render Forgot Password Form
module.exports.renderForgotPasswordForm = (req, res) => {
  res.render('users/forgot_password.ejs');
};

// Process Forgot Password request (verify username/email and generate reset token)
module.exports.forgotPassword = async (req, res) => {
  const { identifier } = req.body;
  if (!identifier || !identifier.trim()) {
    req.flash('error', 'Please provide your registered username or email address.');
    return res.redirect('/forgot-password');
  }

  const trimmed = identifier.trim();
  // Find user by username or email
  const user = await User.findOne({
    $or: [
      { username: trimmed },
      { email: trimmed.toLowerCase() },
    ],
  });

  if (!user) {
    req.flash('error', 'No account was found with that username or email address.');
    return res.redirect('/forgot-password');
  }

  // Generate 32-byte cryptographic token
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // valid for 1 hour
  await user.save();

  req.flash('success', `✨ Account verified for @${user.username}! Please enter your new password below.`);
  res.redirect(`/reset-password/${token}`);
};

// Render Reset Password Form
module.exports.renderResetPasswordForm = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Password reset link is invalid or has expired. Please request a new one.');
    return res.redirect('/forgot-password');
  }

  res.render('users/reset_password.ejs', { token, user });
};

// Process Reset Password submission
module.exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    req.flash('error', 'Please fill in both password fields.');
    return res.redirect(`/reset-password/${token}`);
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match. Please verify and try again.');
    return res.redirect(`/reset-password/${token}`);
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters long.');
    return res.redirect(`/reset-password/${token}`);
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Password reset link is invalid or has expired. Please request a new one.');
    return res.redirect('/forgot-password');
  }

  // Set the new password with passport-local-mongoose
  await user.setPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  req.flash('success', '🎉 Your password has been successfully updated! You can now log in.');
  res.redirect('/login');
};

// Host Portal / Dashboard
module.exports.renderHostDashboard = async (req, res) => {
  const myListings = await Listing.find({ owner: req.user._id });
  const listingIds = myListings.map((l) => l._id);

  const incomingBookings = await Booking.find({ listing: { $in: listingIds } })
    .populate('listing')
    .populate('user')
    .sort({ createdAt: -1 });

  const totalEarnings = incomingBookings.reduce((acc, b) => acc + (b.basePrice || 0), 0);
  const totalGuests = incomingBookings.reduce((acc, b) => acc + (b.guests || 1), 0);

  const now = new Date();
  let upcomingCount = 0;
  let activeCount = 0;
  let completedCount = 0;

  incomingBookings.forEach((b) => {
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    if (now < checkIn) {
      upcomingCount++;
    } else if (now >= checkIn && now <= checkOut) {
      activeCount++;
    } else {
      completedCount++;
    }
  });

  res.render('users/host_dashboard.ejs', {
    myListings,
    incomingBookings,
    totalEarnings,
    totalGuests,
    upcomingCount,
    activeCount,
    completedCount,
  });
};

// Switch User Role (Host <-> Guest)
module.exports.switchRole = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    req.flash('error', 'User not found!');
    return res.redirect('/login');
  }

  // Toggle role
  user.role = (user.role === 'host') ? 'guest' : 'host';
  await user.save();
  req.user.role = user.role;

  req.flash('success', `✨ Switched mode to ${user.role === 'host' ? 'Host (Property Owner)' : 'Traveler (Guest)'}!`);

  if (user.role === 'host') {
    res.redirect('/host/dashboard');
  } else {
    res.redirect('/listings');
  }
};

// Logout User
module.exports.logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.flash('success', 'You have been logged out!');
    res.redirect('/listings');
  });
};