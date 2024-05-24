
// Makes it possible to reference environment variables from .env into process.env
require('dotenv').config();

// Require express framework -> Provides broad features for building web and mobile applications
const express = require('express');
const app = express();

// Allows us to have POST requests made from html forms
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Allow loggin in
const morgan = require('morgan');

//  Allows the creation and storage of the session data used for authentication or user preferences
const session = require('express-session');

// Built-in module that provides utilities for working with file and directory paths
const path = require("path");

// Library to hash a password
const bcrypt = require("bcrypt");

// Connection to mongoose database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

const Movies = require("./models/movies");
const Users = require("./models/users");
const authRouter = require("./controllers/authControllers");

// Allows request.body object to be read in the handlers
app.use(express.json());

// Tell express to expect data from our form
app.use(express.urlencoded({ extended: false }));

// Adding css
app.use(express.static(path.join(__dirname, "public")));

// Initializing the session
app.use(
    session({
      secret: process.env.SECRET_PASSWORD, // Replace with a strong secret key
      resave: false, // Forces the session to be saved back to the store, even if it wasn't modified
      saveUninitialized: true, // Forces a session that is "uninitialized" to be saved to the store
      cookie: { secure: false }, // Secure should be true in production if you're using HTTPS
    })
);

// enables function globally in the browser
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
  });
  
app.use((req, res, next) => {
    if (req.session.message){
        res.locals.message = req.session.message;
        req.sessions.message = null
    }
    next();
});
app.use("/auth", authRouter);

//-----------------------------------------------------------------------------------------------------------------//

// use, get, post, put, delete and listen are http methods

// Landing page
app.get("/", (req, res) => {
    res.render("home.ejs");
});

// GET sign-up
// Get doesn't have req.body
app.get("/auth/sign-up", async (req, res) => res.render("auth/sign-up.ejs"));

// POST new user
// Post happens when the button is clicked
app.post("/auth/sign-up", async (req, res) => {
    
    // Turning the password into a hash
    const hash = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hash;

    // Saving new user's login information
    const newUser = await User.create(req.body);
    res.redirect("/"); // Redirect to landing page (home)

});

// GET sign-in
app.get("/auth/sign-in", (req, res)=> {
    return res.render("auth/sign-in.ejs")
})

app.post('/auth/sign-in', async (req, res) => { // queries to the database must be asynchronous
    const userFromDatabase = await User.findOne({ username: req.body.username });
    const passwordsMatch = await bcrypt.compare(
        req.body.password,
        userFromDatabase.password
    );

    if(passwordsMatch){
        res.redirect('/')
    }else{
        return res.send(`Login Failed`)
    }
})

// GET movies
app.get("/movies", async (req, res) => {
  try {
    const movies = await Movies.find();
    res.render("movies.ejs", {
      movies: movies,
    });
  } catch (error) {
    res.render("error.ejs", { error: error.message });
  }
});

// GET new-movie
app.get("/new-movie", (req, res) => {
    res.render("new.ejs");
});

app.get("/movies/:movieId", async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movieId).populate("createdBy");
    console.log(movie);
    res.render("show.ejs", {
      movie,
    });
  } catch (error) {
    res.render("error.ejs", { error: error.message });
  }
});

// POST movie
app.post("/movies", async (req, res) => {
  if (req.session.user) {
    try {
      // Add the current users ID to the request body
      req.body.createdBy = req.session.user.userId;

      const movie = await Movies.create(req.body);
      req.session.message = "Movie successfully created.";
      res.redirect("/movies");

    } catch (error) {
      req.session.message = error.message;
      res.redirect("/movies");
    }
  } else {
    res.redirect("/auth/sign-in");
  }
});

// DELETE movie
app.delete("/movies/:movieId", async (req, res) => {
  if (req.session.user) {
    try {
      const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);
      res.send(deletedMovie);
    } catch (error) {
      res.render("error.ejs", { error: error.message });
    }
  } else {
    res.redirect("/auth/sign-in");
  }
});

// PUT (update) movie
app.put("/movies/:movieId", async (req, res) => {
  if (req.session.user) {
    try {
      const updatedMovie = await Movies.findByIdAndUpdate(
        req.params.movieId,
        req.body,
        { new: true }
      );
      res.send(updatedMovie);
    } catch (error) {
      res.render("error.ejs", { error: error.message });
    }
  } else {
    res.redirect("/auth/sign-in");
  }
});

// GET reviews
app.get("/movies/:movieId/reviews", (req, res) => {
  res.render("newReview.ejs", { movieId: req.params.movieId });
});

// POST review
app.post("/movies/:movieId/reviews", async (req, res) => {
  // if the user is signed in then:
  if (req.session.user) {
    // get the id of the movie we are going to add the review to
    const movieId = req.params.movieId;
    // get that movie from the database
    const movieFromDb = await Movies.findById(movieId);
    // we should have the review in the req.body
    // add the reviewers id to the req.body as 'reviewer'
    req.body.reviewer = req.session.user.userId;
    // push the new review into the movies reviews key
    movieFromDb.reviews.push(req.body);
    // save the movie with the new review
    await movieFromDb.save();
    // redirect the user to the
    res.redirect(`/movies/${movieId}`);
  } else {
    res.redirect("/auth/sign-in");
  }
});

// If the port doesn't exist, define it as 3000
const port = process.env.PORT ? process.env.PORT : '4000';

// Keeps the connection open for requests
app.listen(port, () => {
    console.log("Listening on port ", process.env.PORT);
    console.log(`Your secret is ${process.env.SECRET_PASSWORD}`);
    console.log(`My mongo db url is ${process.env.MONGODB_URI}`);
  });
  
