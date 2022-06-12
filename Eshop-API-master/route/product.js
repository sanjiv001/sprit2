const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
// we have to use {} in Product because model is returning an object
const { Product } = require("../models/product");
const mongoose = require("mongoose");
const jwt = require("../middleware/jwt");
const multer = require("multer");
const { findOneAndRemove } = require("../models/order-item");
// router.get("/", async (req, res) => {
//   // const productList = await Product.find().select("name image -_id"); // if you want the specific columns
//   const productList = await Product.find();
//   if (!productList) {
//     res.status(500).json({ success: false });
//   } else {
//     res.status(201).json({ success: true, data: productList });
//   }
// });

router.get("/:id", jwt, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category"); // display category in product
  if (!product) {
    res.status(401).json({
      success: false,
      message: "Cannot find the product",
    });
  } else {
    res.status(201).json({
      success: true,
      data: product,
    });
  }
});

//Validate upload file
const FILE_TYPE_MAP = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/jpg": "jpg",
};

//Upload image to server
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    //validate weather the file is a valid image
    if (!isValid) cb(new Error("Invalid file type"), "./public/uploads");
    else cb(null,"./public/uploads"); // path where we upload an image
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `IMG-${Date.now()}.${extension}`);
  },
});

var uploadOptions = multer({ storage: storage });

//Upload a single image to server
router.post("/", uploadOptions.single("image"), async (req, res) => {
  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    // image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });
  const category = await Category.findById(req.body.category);
  const file = req.file;
  if (!category) {
    return res.status(400).send("Invalid category");
  }
  // else if(!file){   
    
  //   return res.status(400).send("Please upload an image");
  // }  
  else if(file){
    // Get the filename from multer
    const fileName = req.file.filename;
    // req.protocol = "http";
    // req.get = localhost:3000/
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    product.image = basePath + fileName;
    
    // const product = new Product({
    //   name: req.body.name,
    //   description: req.body.description,
    //   richDescription: req.body.richDescription,
    //   image: `${basePath}${fileName}`,
    //   brand: req.body.brand,
    //   price: req.body.price,
    //   category: req.body.category,
    //   countInStock: req.body.countInStock,
    //   rating: req.body.rating,
    //   numReviews: req.body.numReviews,
    //   isFeatured: req.body.isFeatured,
    // });
  }
    //You can use .then() and .catch() or you can use async and await
    await product
      .save()
      .then((createdProduct) => {
        res.status(201).json({ success: true, createdProduct });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
          success: false,
        });
      });
  
});

// Add product without image
// router.post("/", async (req, res) => {
//   const category = await Category.findById(req.body.category);
//   if (!category) {
//     return res.status(400).send("Invalid category");
//   } else {
//     const product = new Product({
//       name: req.body.name,
//       description: req.body.description,
//       richDescription: req.body.richDescription,
//       image: req.body.image,
//       brand: req.body.brand,
//       price: req.body.price,
//       category: req.body.category,
//       countInStock: req.body.countInStock,
//       rating: req.body.rating,
//       numReviews: req.body.numReviews,
//       isFeatured: req.body.isFeatured,
//     });

//     //You can use .then() and .catch() or you can use async and await
//     await product
//       .save()
//       .then((createdProduct) => {
//         res.status(201).json({ success: true, createdProduct });
//       })
//       .catch((err) => {
//         res.status(500).json({
//           error: err,
//           success: false,
//         });
//       });
//   }
// });
router.put("/:id", async (req, res) => {
  //If the :id is not in _id format then this message will be shown
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid product id");
  }

  const category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).send("Invalid category");
  } else {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
      },
      {
        new: true,
      }
    );

    if (!product) {
      res.status(500).json({
        success: false,
        message: "Update error",
      });
    } else {
      res.status(201).json({ success: true, data: product });
    }
  }
});

router.delete("/:id", async (req, res) => {
  //If the :id is not in _id format then this message will be shown
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid product id");
  }

  await Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product)
        res
          .status(200)
          .json({ success: true, message: "Deleted successfully" });
      else
        res
          .status(404)
          .json({ success: false, message: "Cannot deleted a product" });
    })
    .catch((err) => {
      return res.status(500).json({
        success: false,
        error: err,
      });
    });
});

//Count the number of product using MONGOOSE METHOD
router.get("/get/count/", async (req, res) => {
  const productCount = await Product.countDocuments((count) => count);
  if (!productCount) {
    res.status(500).json({ success: false });
  } else {
    res.status(200).json({ success: true, data: productCount });
  }
});

// Get featured product , you have to pass how many featured product you want to show
// :count means how many data we want
router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  console.log(count);
  const featuredProducts = await Product.find({ isFeatured: true })
    .populate("category")
    .limit(+count); //+ means convert string to number

  if (!featuredProducts) {
    res.status(500).json({ success: false });
  } else {
    res.status(200).json({ success: true, data: featuredProducts });
  }
});

//get all products based on categories using query parameter not as params or body
// get all the product and also the categories if user is passing through the query parameter
router.get("/", async (req, res) => {
  // localhost:3000/api/v1/products?categories=1234,345
  let categories = {};
  if (req.query.categories) {
    categories = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(categories).populate("category");

  if (!productList) {
    res.status(500).json({ success: false });
  } else {
    res.status(201).json({ success: true, data: productList });
  }
});

module.exports = router;
