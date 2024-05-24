const mongoose = require('mongoose')
require('dotenv').config();

const Movies = require('./models/movies.js')

// ! Array of movies!
const moviesData = [
  { name: 'Diehard', year: 1989, rating: 5 },
  { name: 'Legally Blonde', year: 2001, rating: 3 },
  { name: 'Dune Part 2', year: 2023, rating: 5 }
]

async function seed() {
  console.log('Seeding has begun! 🌱')

  // ! We need to AWAIT mongoose.connect first, before we drop our database.
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connection successful! 🚀')

  // ! When seeding, we can clear the database like so:
  await mongoose.connection.db.dropDatabase()

  // ! Replace diehard with an array of movies!
  const movies = await Movies.create(moviesData)

  console.log(movies)

  mongoose.disconnect()
}

seed()