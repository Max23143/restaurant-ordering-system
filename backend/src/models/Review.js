import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: "",
      trim: true
    },
    isApproved: {
      type: Boolean,
      // New customer reviews stay pending until the admin approves them.
      // This keeps the code consistent with the frontend message and admin moderation workflow.
      default: false
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ user: 1, menuItem: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
