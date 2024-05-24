const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
  name: { type: String, required: true },  
  year: { type: Number, required: true },
  rating: { type: Number, required: true },
  createdBy : {type: mongoose.Schema.ObjectId, ref: "User"},
})

module.exports = mongoose.model('Movie', movieSchema)