
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
      { category: catRegex },
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

// Helper to extract all uploaded photo files from multer
function getUploadedFiles(req) {
  const files = [];
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    if (req.files['listing[images]']) files.push(...req.files['listing[images]']);
    if (req.files['listing[image]']) files.push(...req.files['listing[image]']);
    if (req.files['images']) files.push(...req.files['images']);
    if (req.files['image']) files.push(...req.files['image']);
  } else if (req.file) {
    files.push(req.file);
  }
  return files;
}

module.exports.create = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  const uploadedFiles = getUploadedFiles(req);

  if (uploadedFiles.length > 0) {
    const photoObjects = uploadedFiles.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    newListing.images = photoObjects;
    newListing.image = photoObjects[0]; // Set primary cover image
  } else if (!newListing.image || !newListing.image.url) {
    newListing.image = {
      url: DEFAULT_IMAGE,
      filename: 'default-image',
    };
    newListing.images = [newListing.image];
  } else if (newListing.image && (!newListing.images || newListing.images.length === 0)) {
    newListing.images = [newListing.image];
  }

  await newListing.save();
  const photoCount = newListing.images ? newListing.images.length : 1;
  req.flash('success', `🎉 New Listing Created with ${photoCount} photo${photoCount > 1 ? 's' : ''}!`);
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

  const uploadedFiles = getUploadedFiles(req);
  if (uploadedFiles.length > 0) {
    const photoObjects = uploadedFiles.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    listing.images = photoObjects;
    listing.image = photoObjects[0];
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