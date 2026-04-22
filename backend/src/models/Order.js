import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    cardHolderName: {
      type: String,
      default: ""
    },
    cardLast4: {
      type: String,
      default: ""
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true
    },
    orderType: {
      type: String,
      enum: ["delivery", "pickup", "dine-in"],
      default: "delivery"
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      default: "cash"
    },
    paymentDetails: {
      type: paymentDetailsSchema,
      default: () => ({})
    },
    deliveryAddress: {
      type: String,
      default: ""
    },
    specialInstructions: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;