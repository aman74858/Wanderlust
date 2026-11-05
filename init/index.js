if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({ path: '../.env' });
}

const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');
const User = require('../models/user.js');
const Booking = require('../models/booking.js');

const MONGO_URI = process.env.ATLASDB_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for initialization");
}

const initDB = async () => {
  await main();

  // Clear existing collections for clean seeding
  await Listing.deleteMany({});
  await Booking.deleteMany({});

  // 1. Find or create Host user
  let hostUser = await User.findOne({ username: 'demo_host' });
  if (!hostUser) {
    const newHost = new User({
      username: 'demo_host',
      email: 'host@wanderlust.com',
      role: 'host',
      phone: '+91 98765 11111',
    });
    hostUser = await User.register(newHost, 'password123');
    console.log("✅ Created demo Host account:", hostUser.username);
  } else {
    hostUser.role = 'host';
    await hostUser.save();
    console.log("✅ Found existing Host account:", hostUser.username);
  }

  // 2. Find or create Traveler user
  let travelerUser = await User.findOne({ username: 'demo_traveler' });
  if (!travelerUser) {
    const newTraveler = new User({
      username: 'demo_traveler',
      email: 'traveler@wanderlust.com',
      role: 'guest',
      phone: '+91 98765 22222',
    });
    travelerUser = await User.register(newTraveler, 'password123');
    console.log("✅ Created demo Traveler account:", travelerUser.username);
  } else {
    travelerUser.role = 'guest';
    await travelerUser.save();
    console.log("✅ Found existing Traveler account:", travelerUser.username);
  }

  // 3. Insert Listings linked to Host
  const listingsToInsert = initData.data.map((obj) => ({
    ...obj,
    owner: hostUser._id,
    geometry: obj.geometry || {
      type: "Point",
      coordinates: [77.2090, 28.6139],
    }
  }));

  const insertedListings = await Listing.insertMany(listingsToInsert);
  console.log(`✅ Seeded ${insertedListings.length} listings owned by Host (${hostUser.username})`);

  // 4. Insert Sample Traveler Bookings
  const sampleBookings = [
    {
      listing: insertedListings[0]._id,
      user: travelerUser._id,
      checkIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
      checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      nights: 5,
      guests: 2,
      basePrice: insertedListings[0].price * 5,
      cleaningFee: 800,
      serviceFee: Math.round(insertedListings[0].price * 5 * 0.1),
      tax: Math.round((insertedListings[0].price * 5 + 800 + Math.round(insertedListings[0].price * 5 * 0.1)) * 0.18),
      totalPrice: Math.round((insertedListings[0].price * 5 + 800 + Math.round(insertedListings[0].price * 5 * 0.1)) * 1.18),
      guestName: "Aarav Sharma",
      guestEmail: "traveler@wanderlust.com",
      guestPhone: "+91 98765 22222",
      specialRequests: "High floor room with sea view preferred.",
      paymentMethod: "UPI / GPay",
      status: "Confirmed",
      bookingReference: "WNDR-582910",
    },
    {
      listing: insertedListings[1]._id,
      user: travelerUser._id,
      checkIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
      checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      nights: 3,
      guests: 3,
      basePrice: insertedListings[1].price * 3,
      cleaningFee: 800,
      serviceFee: Math.round(insertedListings[1].price * 3 * 0.1),
      tax: Math.round((insertedListings[1].price * 3 + 800 + Math.round(insertedListings[1].price * 3 * 0.1)) * 0.18),
      totalPrice: Math.round((insertedListings[1].price * 3 + 800 + Math.round(insertedListings[1].price * 3 * 0.1)) * 1.18),
      guestName: "Aarav Sharma",
      guestEmail: "traveler@wanderlust.com",
      guestPhone: "+91 98765 22222",
      specialRequests: "Airport transfer required.",
      paymentMethod: "Credit / Debit Card",
      status: "Confirmed",
      bookingReference: "WNDR-739104",
    }
  ];

  await Booking.insertMany(sampleBookings);
  console.log(`✅ Seeded ${sampleBookings.length} confirmed traveler bookings for ${travelerUser.username}`);

  await mongoose.connection.close();
  console.log("Database connection closed");
};

initDB().catch((err) => {
  console.error("Initialization error:", err);
  process.exit(1);
});