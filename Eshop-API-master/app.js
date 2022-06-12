const express = require("express");
const morgan = require("morgan");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
require('colors');

var a =2;
//Before using any services enable CORS
app.use(cors());
app.options("*", cors()); // * means allow all the http request to pass from any other region

// setting the path for config.env file
dotenv.config({
  path: "./config/config.env",
});

//connect to mongodb server
connectDB();

app.use("/public/uploads", express.static(path.join(__dirname, "/public/uploads")));

//Constants and routes
const api = process.env.API_URL;
const productRouter = require("./route/product");
const categoryRouter = require("./route/category");
const userRouter = require("./route/user");
const orderRouter = require('./route/orders');

//Middleware
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({urlencoded:true}))

//Routers
app.use(`${api}/user`, userRouter);
app.use(`${api}/products`, productRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/orders`, orderRouter);

// Display message in home page
app.get("/", (req, res) => {
  res.send("Hello from express");
});

//Server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000".yellow.underline.bold);
});
