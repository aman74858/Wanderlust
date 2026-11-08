const express = require('express');
const router = express.Router();
const Listing = require('../models/listing.js');
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, isOwner, validateListing, isHost } = require('../authMiddleware.js');
const listingControllers = require('../controllers/listings.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// Index Route and Create Route (Create is Host only)
router.route('/')
  .get(wrapAsync(listingControllers.index))
  .post(
    isHost,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingControllers.create)
  );

// New Property Route (Host only)
router.get('/new', isHost, wrapAsync(listingControllers.new));

// Show Route and Update Route and Delete Route

router
.route('/:id')
  .get(wrapAsync(listingControllers.show))
  .put(
    isLoggedIn,
    isOwner,
      upload.single("listing[image]"),
    validateListing, wrapAsync(listingControllers.update))
  .delete(isLoggedIn,isOwner, wrapAsync(listingControllers.delete));
// Edit Route
router.get('/:id/edit',isLoggedIn,isOwner, wrapAsync(listingControllers.edit));

module.exports = router;