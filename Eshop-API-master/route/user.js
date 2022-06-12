const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  //dont show the password
  const userList = await User.find({}).select("-password"); // or go to model class and set select:false
  return res.json(userList);
});

router.post("/", async (req, res) => {
  const user = new User({
    email: req.body.email,
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, 10),
    isAdmin: req.body.isAdmin,
    address: req.body.address,
    country: req.body.country,
    phone: req.body.phone,
  });

  await user
    .save()
    .then(() => {
      res.json({
        success: true,
      });
    })
    .catch((err) => {
      res.status(500).json({
        success:false,
      });
    });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  const secretKey = process.env.SECRET_KEY;

  if (user) {
    // dont use bcryptjs
    if (bcrypt.compareSync(req.body.password, user.password)) {
      // create a token
      const token = jwt.sign(
        {
          email: user.email,
        },
        secretKey,
        { expiresIn: "1d" }
      );

      res.json({ success: true, token: token });
    } else {
      res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }
  } else {
    res.status(404).json({ success: false, error: "User not found" });
  }
});

router.get("/get/count", async (req, res) => {
  const count = await User.count();
  res.json(count);
});

router.delete("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({ success: true });
  } else {
    res.status(404).send("User not found");
  }
});

module.exports = router;
