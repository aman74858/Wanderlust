const joi = require('joi');

const listingSchema = joi.object({ 
    listing: joi.object({
        title: joi.string().required(),
        description: joi.string().required(),
        image: joi.any().allow('', null),
        images: joi.any().allow('', null),
        price: joi.number().required().min(0),
        location: joi.string().required(),
        country: joi.string().allow('',null),
        category: joi.string().allow('', null)
    }).required()
});

const reviewSchema = joi.object({
    review: joi.object({
        rating: joi.number().required().min(1).max(5),
        comment: joi.string().required()
        
    }).required()
});      


module.exports = { listingSchema, reviewSchema };