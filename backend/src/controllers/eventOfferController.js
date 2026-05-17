import EventOffer from "../models/EventOffer.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

/*
  Public route:
  Customers can view active events and offers.
  Admin route:
  Admin can view all, create, update, and delete.
*/
export const getEventOffers = catchAsync(async (req, res) => {
  const { type, active } = req.query;

  const filter = {};

  if (type) {
    filter.type = type;
  }

  /*
    If active is not provided, public frontend normally gets active only.
    Admin can pass active=all to view everything.
  */
  if (active !== "all") {
    filter.isActive = active === undefined ? true : active === "true";
  }

  const items = await EventOffer.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: items.length,
    data: items
  });
});

export const getEventOfferById = catchAsync(async (req, res) => {
  const item = await EventOffer.findById(req.params.id);

  if (!item) {
    throw new ApiError("Event or offer not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: item
  });
});

export const createEventOffer = catchAsync(async (req, res) => {
  const {
    type,
    title,
    description,
    dateLabel,
    eventDate,
    timeLabel,
    discountLabel,
    image,
    isActive,
    displayOrder
  } = req.body;

  if (!type || !title || !description) {
    throw new ApiError("Type, title, and description are required.", 400);
  }

  if (!["event", "offer"].includes(type)) {
    throw new ApiError("Type must be event or offer.", 400);
  }

  const item = await EventOffer.create({
    type,
    title,
    description,
    dateLabel: dateLabel || "",
    eventDate: eventDate || null,
    timeLabel: timeLabel || "",
    discountLabel: discountLabel || "",
    image: image || "",
    isActive: isActive !== false,
    displayOrder: Number(displayOrder || 0),
    createdBy: req.user?._id || null
  });

  res.status(201).json({
    success: true,
    message: `${type === "event" ? "Event" : "Offer"} created successfully.`,
    data: item
  });
});

export const updateEventOffer = catchAsync(async (req, res) => {
  const item = await EventOffer.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      displayOrder: Number(req.body.displayOrder || 0),
      eventDate: req.body.eventDate || null
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!item) {
    throw new ApiError("Event or offer not found.", 404);
  }

  res.status(200).json({
    success: true,
    message: "Event or offer updated successfully.",
    data: item
  });
});

export const deleteEventOffer = catchAsync(async (req, res) => {
  const item = await EventOffer.findByIdAndDelete(req.params.id);

  if (!item) {
    throw new ApiError("Event or offer not found.", 404);
  }

  res.status(200).json({
    success: true,
    message: "Event or offer deleted successfully."
  });
});