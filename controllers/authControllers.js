const express = require("express");
const authRouter = express.Router();
const UserModel = require("../models/users.js");
const bcrypt = require("bcrypt");

authRouter.get("/sign-up", (req, res) => {
  return res.render("auth/sign-up.ejs");
});

authRouter.post("/sign-up", async (req, res) => {
  const hash = bcrypt.hashSync(req.body.password, 10);
  req.body.password = hash;

  try {
    const newUser = await UserModel.create(req.body);
    res.redirect("/");
  } catch (error) {
    if (error.errmsg.includes("duplicate key error")) {
      res.send(`Username not available <a href="/auth/sign-up">Try again</a>`);
    }
  }
});

authRouter.get("/sign-in", (req, res) => {
  return res.render("auth/sign-in.ejs");
});

authRouter.post("/sign-in", async (req, res) => {
  const userFromDatabase = await UserModel.findOne({
    username: req.body.username,
  });

  const passwordsMatch = await bcrypt.compare(
    req.body.password,
    userFromDatabase.password
  );

  req.session.user = { 
    username: userFromDatabase.username,
    userId: userFromDatabase._id,
  };

  if (passwordsMatch) {
    res.redirect("/");
  } else {
    return res.send(`Login Failed`);
  }
});

module.exports = authRouter;
