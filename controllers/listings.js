
const Listing = require('../models/listing.js');

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60";

module.exports.index = async (req, res) => {
  const { q, category } = req.query;
  let filter = {};

  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { country: searchRegex },
      { description: searchRegex }
    ];
  } else if (category && category.trim() && category !== 'Trending') {
    const catRegex = new RegExp(category.trim(), 'i');
    filter.$or = [
      { title: catRegex },
      { description: catRegex },
      { location: catRegex },
      { country: catRegex }
    ];
  }

  const allListings = await Listing.find(filter);
  res.render('listing/index.ejs', { allListings, searchQuery: q || '', selectedCategory: category || '' });
};

module.exports.new = async (req, res) => {
  res.render('listing/new.ejs');
};

module.exports.create = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  } else if (!newListing.image || !newListing.image.url) {
    newListing.image = {
      url: DEFAULT_IMAGE,
      filename: 'default-image'
    };
  }

  await newListing.save();
  req.flash('success', 'New Listing Created!');
  res.redirect('/listings');
};

module.exports.show = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'author'
      }
    })
    .populate('owner');

  if (!listing) {
    req.flash('error', 'Listing Not Found!');
    return res.redirect('/listings');
  }

  let originalImageUrl = listing.image?.url || DEFAULT_IMAGE;
  if (originalImageUrl.includes('/upload')) {
    originalImageUrl = originalImageUrl.replace('/upload', '/upload/w_500');
  }

  res.render('listing/show.ejs', { listing, originalImageUrl });
};

module.exports.edit = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash('error', 'Listing Not Found!');
    return res.redirect('/listings');
  }

  let originalImageUrl = listing.image?.url || DEFAULT_IMAGE;
  if (originalImageUrl.includes('/upload')) {
    originalImageUrl = originalImageUrl.replace('/upload', '/upload/w_300');
  }

  res.render('listing/edit.ejs', { listing, originalImageUrl });
};

module.exports.update = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true, runValidators: true });

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
    await listing.save();
  }

  req.flash('success', 'Listing Updated!');
  res.redirect(`/listings/${id}`);
};

module.exports.delete = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash('success', 'Listing Deleted!');
  res.redirect('/listings');
};