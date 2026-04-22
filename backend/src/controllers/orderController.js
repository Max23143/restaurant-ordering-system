import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import OtpVerification from "../models/OtpVerification.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSmsOtp, checkSmsOtp } from "../utils/sendSmsOtp.js";

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const buildPreparedOrder = async ({
  userId,
  items,
  orderType,
  paymentMethod,
  deliveryAddress,
  specialInstructions,
  paymentDetails
}) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError("Order items are required.", 400);
  }

  const preparedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    if (!item.menuItem || !item.quantity) {
      throw new ApiError("Each order item must include menuItem and quantity.", 400);
    }

    const menuItem = await MenuItem.findById(item.menuItem);

    if (!menuItem) {
      throw new ApiError(`Menu item not found: ${item.menuItem}`, 404);
    }

    if (!menuItem.isAvailable) {
      throw new ApiError(`${menuItem.name} is currently unavailable.`, 400);
    }

    const quantity = Number(item.quantity);

    if (quantity < 1) {
      throw new ApiError("Quantity must be at least 1.", 400);
    }

    const unitPrice = Number(menuItem.price);
    const lineTotal = quantity * unitPrice;

    preparedItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      quantity,
      unitPrice,
      lineTotal
    });

    totalAmount += lineTotal;
  }

  const finalOrderType = orderType || "delivery";
  const finalPaymentMethod = paymentMethod || "cash";

  if (finalOrderType === "delivery" && !deliveryAddress) {
    throw new ApiError("Delivery address is required for delivery orders.", 400);
  }

  let safePaymentDetails = {
    cardHolderName: "",
    cardLast4: "",
    paymentStatus: "pending"
  };

  if (finalPaymentMethod === "card") {
    const cardHolderName = String(paymentDetails?.cardHolderName || "").trim();
    const cardNumber = String(paymentDetails?.cardNumber || "").replace(/\s+/g, "");
    const expiryMonth = String(paymentDetails?.expiryMonth || "").trim();
    const expiryYear = String(paymentDetails?.expiryYear || "").trim();
    const cvv = String(paymentDetails?.cvv || "").trim();

    if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
      throw new ApiError("Complete card details are required for card payments.", 400);
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      throw new ApiError("Card number must be 16 digits.", 400);
    }

    if (!/^\d{2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
      throw new ApiError("Expiry month must be between 01 and 12.", 400);
    }

    if (!/^\d{2,4}$/.test(expiryYear)) {
      throw new ApiError("Expiry year is invalid.", 400);
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      throw new ApiError("CVV must be 3 or 4 digits.", 400);
    }

    safePaymentDetails = {
      cardHolderName,
      cardLast4: cardNumber.slice(-4),
      paymentStatus: "paid"
    };
  }

  if (finalPaymentMethod === "cash") {
    safePaymentDetails = {
      cardHolderName: "",
      cardLast4: "",
      paymentStatus: "pending"
    };
  }

  if (finalPaymentMethod === "online") {
    safePaymentDetails = {
      cardHolderName: "",
      cardLast4: "",
      paymentStatus: "paid"
    };
  }

  return {
    user: userId,
    items: preparedItems,
    orderType: finalOrderType,
    paymentMethod: finalPaymentMethod,
    paymentDetails: safePaymentDetails,
    deliveryAddress: deliveryAddress || "",
    specialInstructions: specialInstructions || "",
    totalAmount
  };
};

export const requestCardPaymentOtp = catchAsync(async (req, res) => {
  if (!req.user.phone) {
    throw new ApiError("Your account does not have a phone number for OTP verification.", 400);
  }

  const orderPayload = await buildPreparedOrder({
    userId: req.user._id,
    ...req.body,
    paymentMethod: "card"
  });

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const identifier = `${req.user._id.toString()}_card_payment`;

  await OtpVerification.findOneAndDelete({
    identifier,
    purpose: "card_payment"
  });

  await OtpVerification.create({
    identifier,
    purpose: "card_payment",
    otpCode,
    expiresAt,
    payload: orderPayload
  });

  await sendSmsOtp(req.user.phone);

  res.status(200).json({
    success: true,
    message: "Payment OTP sent successfully to your registered phone."
  });
});

export const confirmCardPaymentOtp = catchAsync(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError("OTP is required.", 400);
  }

  if (!req.user.phone) {
    throw new ApiError("Your account does not have a phone number for OTP verification.", 400);
  }

  const identifier = `${req.user._id.toString()}_card_payment`;

  const record = await OtpVerification.findOne({
    identifier,
    purpose: "card_payment"
  });

  if (!record) {
    throw new ApiError("Payment OTP request not found or expired.", 404);
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await OtpVerification.deleteOne({ _id: record._id });
    throw new ApiError("OTP has expired.", 400);
  }

  const verificationCheck = await checkSmsOtp(req.user.phone, String(otp).trim());

  if (verificationCheck.status !== "approved") {
    throw new ApiError("Invalid OTP.", 400);
  }

  const order = await Order.create(record.payload);

  await OtpVerification.deleteOne({ _id: record._id });

  const populatedOrder = await Order.findById(order._id)
    .populate("user", "fullName email")
    .populate("items.menuItem", "name category price image");

  res.status(201).json({
    success: true,
    message: "Card payment confirmed and order created successfully.",
    data: populatedOrder
  });
});

export const createOrder = catchAsync(async (req, res) => {
  const orderData = await buildPreparedOrder({
    userId: req.user._id,
    ...req.body
  });

  const order = await Order.create(orderData);

  const populatedOrder = await Order.findById(order._id)
    .populate("user", "fullName email")
    .populate("items.menuItem", "name category price image");

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: populatedOrder
  });
});

export const getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.menuItem", "name category price image")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

export const getMyOrderById = catchAsync(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  })
    .populate("user", "fullName email")
    .populate("items.menuItem", "name category price image");

  if (!order) {
    throw new ApiError("Order not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

export const getAllOrders = catchAsync(async (req, res) => {
  const { status, orderType } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (orderType) {
    filter.orderType = orderType;
  }

  const orders = await Order.find(filter)
    .populate("user", "fullName email phone")
    .populate("items.menuItem", "name category price image")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

export const getOrderByIdAdmin = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "fullName email phone role")
    .populate("items.menuItem", "name category price image");

  if (!order) {
    throw new ApiError("Order not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

export const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "completed",
    "cancelled"
  ];

  if (!status || !validStatuses.includes(status)) {
    throw new ApiError("A valid order status is required.", 400);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError("Order not found.", 404);
  }

  order.status = status;
  await order.save();

  const updatedOrder = await Order.findById(order._id)
    .populate("user", "fullName email phone")
    .populate("items.menuItem", "name category price image");

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: updatedOrder
  });
});