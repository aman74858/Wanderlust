if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({ path: '../.env' });
  if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: './.env' });
  }
}

const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');
const User = require('../models/user.js');
const Booking = require('../models/booking.js');
const Review = require('../models/review.js');

const MONGO_URI = process.env.MONGODB_URI || process.env.ATLASDB_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wanderlust";

const CATEGORY_GALLERIES = {
  "Beachfront": [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Amazing Pools": [
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Mountains": [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Castles": [
    "https://images.unsplash.com/photo-1585543805890-6051f7829f98?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Iconic Cities": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Camping": [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Farms": [
    "https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1592595896551-12b371d546d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Arctic": [
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Boats": [
    "https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ],
  "Rooms": [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ]
};

const CATEGORY_KEYS = Object.keys(CATEGORY_GALLERIES);

const initDB = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for database initialization");

  // 1. Hosts
  const hosts = [
    { username: 'demo_host', email: 'host@wanderlust.com', role: 'host', phone: '+91 98765 11111' },
    { username: 'host1', email: 'host@gmail.com', role: 'host', phone: '+91 74858 70839' },
    { username: 'aman', email: 'aman123@gmail.com', role: 'host', phone: '+91 98111 22233' }
  ];

  const hostUsers = [];
  for (const h of hosts) {
    let u = await User.findOne({ username: h.username });
    if (!u) {
      const newU = new User({ username: h.username, email: h.email, role: 'host', phone: h.phone });
      u = await User.register(newU, 'password123');
    } else {
      u.role = 'host';
      if (!u.phone) u.phone = h.phone;
      await u.save();
    }
    hostUsers.push(u);
  }

  // 2. Travelers
  const travelers = [
    { username: 'demo_traveler', email: 'traveler@wanderlust.com', role: 'guest', phone: '+91 98765 22222', name: 'Aarav Sharma' },
    { username: 'priya_traveler', email: 'priya.t@example.com', role: 'guest', phone: '+91 98223 34455', name: 'Priya Patel' },
    { username: 'rohit_traveler', email: 'rohit.v@example.com', role: 'guest', phone: '+91 98334 45566', name: 'Rohit Verma' },
    { username: 'sneha_traveler', email: 'sneha.r@example.com', role: 'guest', phone: '+91 97112 23344', name: 'Sneha Reddy' }
  ];

  const travelerUsers = [];
  for (const t of travelers) {
    let u = await User.findOne({ username: t.username });
    if (!u) {
      const newU = new User({ username: t.username, email: t.email, role: 'guest', phone: t.phone });
      u = await User.register(newU, 'password123');
    } else {
      if (!u.phone) {
        u.phone = t.phone;
        await u.save();
      }
    }
    travelerUsers.push({ user: u, name: t.name, phone: t.phone, email: t.email });
  }

  // 3. Clear old reviews and bookings
  await Review.deleteMany({});
  await Booking.deleteMany({});

  const reviewTemplates = [
    { comment: "Absolutely breathtaking views and pristine rooms! The host was super hospitable.", rating: 5 },
    { comment: "Exceeded all expectations. The private pool and sunset views made our vacation unforgettable.", rating: 5 },
    { comment: "Cozy, sparkling clean, and conveniently located. Fast WiFi and comfortable bed.", rating: 4 },
    { comment: "Wonderful stay! Beautiful architecture, peaceful surroundings, and great amenities.", rating: 5 }
  ];

  // 4. Update existing listings or insert
  const listings = await Listing.find({});
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const cat = CATEGORY_KEYS[i % CATEGORY_KEYS.length];
    listing.category = cat;

    const galleryUrls = CATEGORY_GALLERIES[cat] || CATEGORY_GALLERIES["Rooms"];
    const currentCoverUrl = (listing.image && listing.image.url) ? listing.image.url : galleryUrls[0];

    const photoObjects = [
      { url: currentCoverUrl, filename: `cover_${i}` },
      ...galleryUrls.map((u, pIdx) => ({ url: u, filename: `photo_${i}_${pIdx}` }))
    ];

    listing.image = photoObjects[0];
    listing.images = photoObjects;
    listing.owner = hostUsers[i % hostUsers.length]._id;

    // Attach 2 reviews
    const rev1 = new Review({
      comment: reviewTemplates[i % reviewTemplates.length].comment,
      rating: reviewTemplates[i % reviewTemplates.length].rating,
      author: travelerUsers[i % travelerUsers.length].user._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 1))
    });
    const rev2 = new Review({
      comment: reviewTemplates[(i + 1) % reviewTemplates.length].comment,
      rating: reviewTemplates[(i + 1) % reviewTemplates.length].rating,
      author: travelerUsers[(i + 1) % travelerUsers.length].user._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 4))
    });

    await rev1.save();
    await rev2.save();

    listing.reviews = [rev1._id, rev2._id];
    await listing.save();
  }

  // 5. Seed Bookings
  const now = new Date();
  const bookingsToCreate = [];

  for (let bIdx = 0; bIdx < 9; bIdx++) {
    const targetListing = listings[bIdx % listings.length];
    const travelerData = travelerUsers[bIdx % travelerUsers.length];

    let checkIn, checkOut;
    if (bIdx % 3 === 0) {
      // In-House / Active Now
      checkIn = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);
      checkOut = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);
    } else if (bIdx % 3 === 1) {
      // Upcoming
      checkIn = new Date(now.getTime() + 1000 * 60 * 60 * 24 * (3 + bIdx));
      checkOut = new Date(now.getTime() + 1000 * 60 * 60 * 24 * (7 + bIdx));
    } else {
      // Completed
      checkIn = new Date(now.getTime() - 1000 * 60 * 60 * 24 * (14 + bIdx));
      checkOut = new Date(now.getTime() - 1000 * 60 * 60 * 24 * (10 + bIdx));
    }

    const nights = Math.max(1, Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const guests = (bIdx % 3) + 1;
    const basePrice = targetListing.price * nights;
    const cleaningFee = 800;
    const serviceFee = Math.round(basePrice * 0.1);
    const tax = Math.round((basePrice + cleaningFee + serviceFee) * 0.18);
    const totalPrice = basePrice + cleaningFee + serviceFee + tax;

    bookingsToCreate.push({
      listing: targetListing._id,
      user: travelerData.user._id,
      checkIn,
      checkOut,
      nights,
      guests,
      basePrice,
      cleaningFee,
      serviceFee,
      tax,
      totalPrice,
      guestName: travelerData.name,
      guestEmail: travelerData.email,
      guestPhone: travelerData.phone,
      specialRequests: bIdx % 2 === 0 ? "Late check-in requested." : "Quiet room requested.",
      paymentMethod: bIdx % 2 === 0 ? "UPI / GPay" : "Credit/Debit Card",
      status: "Confirmed",
      bookingReference: `WNDR-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * (bIdx + 1))
    });
  }

  await Booking.insertMany(bookingsToCreate);
  console.log(`✅ Seeded ${bookingsToCreate.length} bookings, 114 reviews, and multi-photo listings!`);
  await mongoose.connection.close();
};

initDB().catch(console.error);
