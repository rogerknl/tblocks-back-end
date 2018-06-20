const passport = require("passport");
const passportService = require("./services/passport");
const Authentication = require('./controllers/authentication');

const requireSignin = passport.authenticate('local', {session: false});
const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = app => {
  app.get("/", (req, res) => {
    res.send({ hi: "there" });
  });
  app.post('/signin', requireSignin,  Authentication.signin)

app.post('/signup', Authentication.signup)

};
