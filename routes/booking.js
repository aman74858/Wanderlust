const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingsController = require("../controllers/bookings.js");

// Reserve form & submit booking for a listing
router
  .route("/listings/:id/reserve")
  .get(isLoggedIn, wrapAsync(bookingsController.renderReserveForm))
  .post(isLoggedIn, wrapAsync(bookingsController.createBooking));

// Booking confirmation page
router.get("/bookings/:id", isLoggedIn, wrapAsync(bookingsController.showConfirmation));

// User's my bookings list
router.get("/bookings", isLoggedIn, wrapAsync(bookingsController.userBookings));

module.exports = router;
