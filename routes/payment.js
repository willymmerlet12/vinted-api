const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51HoU8OHjBeHezzTyjHdEfO7czN2PxdjZu30G5vz9PsxWTv8qbNrVHDLQDb6moYN5MAp7Xho5Q1dFDRoBgtNuid3d00wlBoYVXc"
);

router.post("/payment", async (req, res) => {
  const stripeToken = req.fields.stripeToken;
  const response = await stripe.charges.create({
    amount: req.fields.product_price * 100,
    currency: "eur",
    description: req.fields.product_description,
    source: stripeToken,
  });
  console.log(response.statues);
  res.json(response);
});

module.exports = router;
