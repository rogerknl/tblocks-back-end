const User = require("../models/user");
const jwt = require("jwt-simple");
const config = require("../config.js");

const tokenForUser = user => {
  const timestamp = new Date().getTime();

  return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
};

exports.signin = (req, res, next) => {
console.log('hi there');
  res.send({token: tokenForUser(req.user)});

}

exports.signup = (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res
      .status(422)
      .send({ error: "you must provide a username and a password" });
  }
  User.findOne({ username }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      return res.status(422).send({ error: "username already exists!" });
    }
    const user = new User({
      username,
      password
    });
    user.save(err => {
      if (err) {
        return next(err);
      }
      console.log("you have added a user");
      res.json({ token: tokenForUser(user) });
    });
  });
};
