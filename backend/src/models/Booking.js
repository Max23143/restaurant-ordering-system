import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"]
    },
    bookingTime: {
      type: String,
      required: [true, "Booking time is required"]
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: 1
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending"
    },
    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;