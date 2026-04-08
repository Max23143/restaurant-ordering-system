import Review from "../models/Review.js";
import MenuItem from "../models/MenuItem.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

const updateMenuRatingStats = async (menuItemId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        menuItem: MenuItem.db.base.Types.ObjectId.createFromHexString(menuItemId.toString()),
        isApproved: true
      }
    },
    {
      $group: {
        _id: "$menuItem",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length === 0) {
    await MenuItem.findByIdAndUpdate(menuItemId, {
      ratingAverage: 0,
      ratingCount: 0
    });
    return;
  }

  await MenuItem.findByIdAndUpdate(menuItemId, {
    ratingAverage: Number(stats[0].averageRating.toFixed(1)),
    ratingCount: stats[0].reviewCount
  });
};

export const createReview = catchAsync(async (req, res) => {
  const { menuItem, rating, comment } = req.body;

  if (!menuItem || !rating) {
    throw new ApiError("Menu item and rating are required.", 400);
  }

  const numericRating = Number(rating);

  if (numericRating < 1 || numericRating > 5) {
    throw new ApiError("Rating must be between 1 and 5.", 400);
  }

  const existingMenuItem = await MenuItem.findById(menuItem);

  if (!existingMenuItem) {
    throw new ApiError("Menu item not found.", 404);
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    menuItem
  });

  if (existingReview) {
    throw new ApiError("You have already reviewed this menu item.", 400);
  }

  const review = await Review.create({
    user: req.user._id,
    menuItem,
    rating: numericRating,
    comment: comment || ""
  });

  await updateMenuRatingStats(menuItem);

  const populatedReview = await Review.findById(review._id)
    .populate("user", "fullName email")
    .populate("menuItem", "name category price image");

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: populatedReview
  });
});

export const getReviewsByMenuItem = catchAsync(async (req, res) => {
  const reviews = await Review.find({
    menuItem: req.params.menuItemId,
    isApproved: true
  })
    .populate("user", "fullName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

export const getMyReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate("menuItem", "name category price image")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

export const updateMyReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!review) {
    throw new ApiError("Review not found.", 404);
  }

  if (rating !== undefined) {
    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      throw new ApiError("Rating must be between 1 and 5.", 400);
    }

    review.rating = numericRating;
  }

  if (comment !== undefined) {
    review.comment = comment;
  }

  await review.save();
  await updateMenuRatingStats(review.menuItem);

  const updatedReview = await Review.findById(review._id)
    .populate("user", "fullName email")
    .populate("menuItem", "name category price image");

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: updatedReview
  });
});

export const deleteMyReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!review) {
    throw new ApiError("Review not found.", 404);
  }

  const menuItemId = review.menuItem;

  await Review.findByIdAndDelete(review._id);
  await updateMenuRatingStats(menuItemId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully"
  });
});

export const getAllReviews = catchAsync(async (req, res) => {
  const { approved } = req.query;

  const filter = {};

  if (approved !== undefined) {
    filter.isApproved = approved === "true";
  }

  const reviews = await Review.find(filter)
    .populate("user", "fullName email")
    .populate("menuItem", "name category price image")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

export const toggleReviewApproval = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError("Review not found.", 404);
  }

  review.isApproved = !review.isApproved;
  await review.save();

  await updateMenuRatingStats(review.menuItem);

  const updatedReview = await Review.findById(review._id)
    .populate("user", "fullName email")
    .populate("menuItem", "name category price image");

  res.status(200).json({
    success: true,
    message: `Review ${review.isApproved ? "approved" : "unapproved"} successfully`,
    data: updatedReview
  });
});