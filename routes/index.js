const express = require('express'),
  router = express.Router(),
  passport = require("passport"),
  bcrypt = require('bcrypt'),
  saltRounds = 10,
  db = require("./../database/connection.js");

const authenticationMiddleWare = function (req, res, next) {
  console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

router.get("/", function (req, res) {
  // console.log(req.user);
  // console.log(req.isAuthenticated());
  res.render("home", { title: "Home" });
});

router.get("/profile", authenticationMiddleWare, function (req, res) {
  res.render("profile", { title: "Profile" });
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login"
}));

router.get("/logout", (req, res) => {
  //logout on express
  req.logout();
  //removes the session in the database
  req.session.destroy();

  res.redirect("/");
});

/* GET home page. */
router.get('/register', (req, res, next) => {
  res.render('register', { title: 'Registration' });
});

router.post("/register", (req, res, next) => {
  const { body: { username, email, password } } = req;

  // express validator
  req.checkBody('username', 'Username field cannot be empty.').notEmpty();
  req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
  req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
  req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
  req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
  req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
  req.checkBody('passwordMatch', 'Password must be between 8-100 characters long.').len(8, 100);
  req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(password);

  // Additional validation to ensure username is alphanumeric with underscores and dashes
  req.checkBody('username', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i');

  const validateErrors = req.validationErrors();

  if (validateErrors) {
    res.render("register", {
      title: "Registration Error",
      errors: validateErrors
    });
    return;
  }

  // Encryption
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) throw err;

    const queryString = "INSERT INTO users SET ?;";
    const mode = { username, email, password: hash };
    db.query(queryString, mode, (err, data, fields) => {

      if (err) {
        console.log("Error Code", err.code);
        console.log("Sql Message", err.sqlMessage);
        res.render("register", { title: "Registration Error: Email or Password does not match" });
        return;
      }

      console.log(data);
      db.query("SELECT LAST_INSERT_ID() as user_id", (error, results, fields) => {
        if (error) throw error;

        const user_id = results[0];
        req.login(user_id, function (err) {
          res.redirect("/");
          return;
        });
      });
    });
  });
});

module.exports = router;
