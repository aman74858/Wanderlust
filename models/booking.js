const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  nights: {
    type: Number,
    required: true,
    min: 1,
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  cleaningFee: {
    type: Number,
    default: 800,
  },
  serviceFee: {
    type: Number,
    default: 1200,
  },
  tax: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  guestName: {
    type: String,
    required: true,
  },
  guestEmail: {
    type: String,
    required: true,
  },
  guestPhone: {
    type: String,
  },
  specialRequests: {
    type: String,
  },
  paymentMethod: {
    type: String,
    default: "Credit/Debit Card",
  },
  status: {
    type: String,
    enum: ["Confirmed", "Pending", "Cancelled"],
    default: "Confirmed",
  },
  bookingReference: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate a readable unique booking reference ID
bookingSchema.pre("save", function (next) {
  if (!this.bookingReference) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.bookingReference = `WNDR-${randomNum}`;
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
