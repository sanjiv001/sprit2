const mongoose = require("mongoose");
require('colors');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    // dbName: "Eshop",

  });

  console.log(
    `MongoDB connected to : ${conn.connection.host}`.cyan.underline.bold
  );
};

module.exports = connectDB;
