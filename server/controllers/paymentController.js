require("dotenv").config();
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create an order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `order_rcpt_${Math.floor(Math.random() * 1000)}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Handle payment verification
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Save payment details in MongoDB
    const payment = new Payment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: req.body.amount,
      currency: "INR",
      status: "success",
    });

    await payment.save();
    res.json({ message: "Payment successful!", payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
