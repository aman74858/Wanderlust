if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const listingsRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const bookingRouter = require('./routes/booking.js');
const chatRouter = require('./routes/chat.js');
const { isLoggedIn } = require("../middleware.js");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/wanderlust";
main()
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });

async function main() {
  await mongoose.connect(MONGO_URI);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionOptions = {
  secret: process.env.SECRET || 'thisshouldbeabettersecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  if (req.user && !req.user.role) {
    req.user.role = 'guest';
  }
  res.locals.currUser = req.user;
  next();
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/listings');
});

// Routes
app.use('/listings', listingsRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', bookingRouter);
app.use('/', userRouter);
app.use('/api/chat', chatRouter);

// 404 Error handler (Express 5 compatible)
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// General Error Handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render('listing/error.ejs', { error: { message, statusCode } });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/listings`);
});