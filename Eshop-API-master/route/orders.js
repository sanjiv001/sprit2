const { Order } = require("../models/order");
const OrderItem = require("../models/order-item");
const express = require("express");
const router = express.Router();

//Get all orders
router.get("/", async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "username")
    .sort({ dateOrdered: -1 });

  if (!orderList)
    res.status(500).json({
      success: false,
    });
  else res.send(orderList);
});

//Get all orders by user
router.get("/get/userorders/:id", async (req, res) => {
  const orders = await Order.find({ user: req.params.id })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });

  if (!orders)
    res.status(500).json({ success: false, message: "Cannot get orders" });
  else
    res.status(200).json({
      success: true,
      data: orders,
    });
});

//Get order by id
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "username")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (!order)
    res.status(500).json({
      success: false,
    });
  else res.send(order);
});

// Change the status of an order
router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );
  if (!order)
    res.status(500).json({
      success: false,
    });
  else res.send(order);
});

//Delete order
router.delete("/:id", async (req, res) => {
  await Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        // Delete all the order items inside the order
        await order.orderItems.map(async (item) => {
          await OrderItem.findByIdAndRemove(item);
        });
        return res.status(200).json({
          success: true,
          message: "Order has been deleted",
        });
      } else {
        return res.status(500).json({
          success: false,
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        success: false,
        error: err,
      });
    });
});

router.post("/", async (req, res) => {
  // Multiple orders will come from the request so we need to loop
  // as user is sending multiple items so we need to combine all the promise
  const orderItemIDs = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });
      newOrderItem = await newOrderItem.save();

      return newOrderItem._id; // we need only id of the order item
    })
  );

  // let them resolve first
  const orderItemsIdsResolved = await orderItemIDs;

  // It will give all the prices from the order
  // e.g if there are two items then [123,123]
  const totalPrice = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product"
      );
      return orderItem.product.price * orderItem.quantity;
    })
  );

  //To add all those items we use reduce function
  // reduce means to get the sum of array
  const totalPrices = totalPrice.reduce((a, b) => a + b, 0);
  console.log(totalPrices);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    address: req.body.address,
    country: req.body.country,
    status: req.body.status,
    totalPrice: totalPrices,
    user: req.body.user,
    phone: req.body.phone,
  });

  order = await order.save();

  if (!order)
    res.status(500).json({
      success: false,
    });
  else res.send(order);
});

// To get the total sales
router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);

  if (!totalSales) {
    return res.status(400).send("The order sales cannot be generated");
  } else {
    //TotalSales will return _id also . so pop only totalsales from    totalSales
    res.send({ totalSales: totalSales.pop().totalSales });
  }
});
module.exports = router;
