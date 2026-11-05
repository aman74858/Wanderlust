const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require('./review.js');
const user = require("./user.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  image: {
    url: String,
    filename: String

  },
  price: { type: Number, required: true },
  location: { type: String },
  country: { type: String },
  reviews: [
    {
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }
],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [77.2090, 28.6139] // Default coordinates
    }
  }
});

listingSchema.post('findOneAndDelete', async function(doc) {
  if(doc){
    await mongoose.model('Review').deleteMany({_id: {$in: doc.reviews}});
  }
});



const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
