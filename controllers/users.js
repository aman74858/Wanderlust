const User = require('../models/user.js');
const Listing = require('../models/listing.js');
const Booking = require('../models/booking.js');

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

// Host Portal / Dashboard
module.exports.renderHostDashboard = async (req, res) => {
  const myListings = await Listing.find({ owner: req.user._id });
  const listingIds = myListings.map((l) => l._id);

  const incomingBookings = await Booking.find({ listing: { $in: listingIds } })
    .populate('listing')
    .populate('user')
    .sort({ createdAt: -1 });

  const totalEarnings = incomingBookings.reduce((acc, b) => acc + (b.basePrice || 0), 0);

  res.render('users/host_dashboard.ejs', {
    myListings,
    incomingBookings,
    totalEarnings,
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