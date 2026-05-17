import mongoose from "mongoose";

const eventOfferSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["event", "offer"],
      required: [true, "Type must be event or offer"]
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },

    /*
      dateLabel is used for simple text like:
      "Every Friday", "This Weekend", "25 May 2026"
    */
    dateLabel: {
      type: String,
      default: "",
      trim: true
    },

    /*
      eventDate is optional.
      Use it when you want real date-based sorting/filtering later.
    */
    eventDate: {
      type: Date,
      default: null
    },

    timeLabel: {
      type: String,
      default: "",
      trim: true
    },

    /*
      discountLabel is useful for offers:
      "20% OFF", "Free Dessert", "Buy 1 Get 1"
    */
    discountLabel: {
      type: String,
      default: "",
      trim: true
    },

    image: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

    displayOrder: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

const EventOffer = mongoose.model("EventOffer", eventOfferSchema);

export default EventOffer;