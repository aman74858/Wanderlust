const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.renderReserveForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Pre-calculate default dates: checkIn tomorrow, checkOut 3 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkInDate = req.query.checkIn || tomorrow.toISOString().split("T")[0];

  const future = new Date(tomorrow);
  future.setDate(future.getDate() + 3);
  const checkOutDate = req.query.checkOut || future.toISOString().split("T")[0];

  const guests = parseInt(req.query.guests) || 2;

  res.render("listing/reserve.ejs", {
    listing,
    checkInDate,
    checkOutDate,
    guests,
  });
};

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const {
    checkIn,
    checkOut,
    guests,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
    paymentMethod,
  } = req.body.booking;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const basePrice = listing.price * nights;
  const cleaningFee = 800;
  const serviceFee = Math.round(basePrice * 0.1);
  const tax = Math.round((basePrice + cleaningFee + serviceFee) * 0.18);
  const totalPrice = basePrice + cleaningFee + serviceFee + tax;

  const newBooking = new Booking({
    listing: listing._id,
    user: req.user._id,
    checkIn: start,
    checkOut: end,
    nights,
    guests: parseInt(guests) || 1,
    basePrice,
    cleaningFee,
    serviceFee,
    tax,
    totalPrice,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
    paymentMethod: paymentMethod || "Credit/Debit Card",
    status: "Confirmed",
  });

  await newBooking.save();

  req.flash("success", "🎉 Stay reservation confirmed successfully!");
  res.redirect(`/bookings/${newBooking._id}`);
};

module.exports.showConfirmation = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id)
    .populate({
      path: "listing",
      populate: {
        path: "owner",
      },
    })
    .populate("user");

  if (!booking) {
    req.flash("error", "Reservation not found!");
    return res.redirect("/listings");
  }

  // Security check: only the booking user or listing owner can view the voucher
  if (
    !booking.user._id.equals(req.user._id) &&
    !booking.listing.owner._id.equals(req.user._id)
  ) {
    req.flash("error", "You do not have permission to view this reservation.");
    return res.redirect("/listings");
  }

  res.render("listing/confirmation.ejs", { booking });
};

module.exports.userBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });

  res.render("listing/user_bookings.ejs", { bookings });
};
