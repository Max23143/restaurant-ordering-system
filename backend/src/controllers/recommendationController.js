import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

const calculateTagOverlap = (sourceTags = [], targetTags = []) => {
  const sourceSet = new Set(sourceTags.map((tag) => String(tag).toLowerCase()));
  const targetSet = new Set(targetTags.map((tag) => String(tag).toLowerCase()));

  let overlap = 0;

  for (const tag of targetSet) {
    if (sourceSet.has(tag)) {
      overlap += 1;
    }
  }

  return overlap;
};

export const getRecommendationsByMenuItem = catchAsync(async (req, res) => {
  const currentItem = await MenuItem.findById(req.params.menuItemId);

  if (!currentItem) {
    throw new ApiError("Menu item not found.", 404);
  }

  const candidates = await MenuItem.find({
    _id: { $ne: currentItem._id },
    isAvailable: true
  });

  const scoredItems = candidates.map((item) => {
    let score = 0;

    if (
      item.category &&
      currentItem.category &&
      item.category.toLowerCase() === currentItem.category.toLowerCase()
    ) {
      score += 5;
    }

    score += calculateTagOverlap(currentItem.tags || [], item.tags || []) * 2;
    score += Number(item.ratingAverage || 0);

    return {
      ...item.toObject(),
      recommendationScore: Number(score.toFixed(2))
    };
  });

  const recommendations = scoredItems
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);

  res.status(200).json({
    success: true,
    basedOn: {
      id: currentItem._id,
      name: currentItem.name,
      category: currentItem.category,
      tags: currentItem.tags
    },
    count: recommendations.length,
    data: recommendations
  });
});

export const getTopRatedRecommendations = catchAsync(async (req, res) => {
  const recommendations = await MenuItem.find({
    isAvailable: true,
    ratingCount: { $gt: 0 }
  })
    .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
    .limit(6);

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations
  });
});

export const getPersonalizedRecommendations = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "items.menuItem",
    "name category tags"
  );

  if (!orders.length) {
    const fallbackItems = await MenuItem.find({ isAvailable: true })
      .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      personalized: false,
      message: "No order history found. Showing top-rated items instead.",
      count: fallbackItems.length,
      data: fallbackItems
    });
  }

  const categoryFrequency = {};
  const tagFrequency = {};

  for (const order of orders) {
    for (const item of order.items || []) {
      if (!item.menuItem) continue;

      const menuItem = item.menuItem;

      const category = menuItem.category?.toLowerCase();
      if (category) {
        categoryFrequency[category] =
          (categoryFrequency[category] || 0) + Number(item.quantity || 0);
      }

      for (const tag of menuItem.tags || []) {
        const normalizedTag = String(tag).toLowerCase();
        tagFrequency[normalizedTag] =
          (tagFrequency[normalizedTag] || 0) + Number(item.quantity || 0);
      }
    }
  }

  const orderedMenuItemIds = orders.flatMap((order) =>
    (order.items || [])
      .map((item) => item.menuItem?._id?.toString())
      .filter(Boolean)
  );

  const uniqueOrderedIds = [...new Set(orderedMenuItemIds)];

  const candidates = await MenuItem.find({
    _id: { $nin: uniqueOrderedIds },
    isAvailable: true
  });

  const scoredItems = candidates.map((item) => {
    let score = 0;

    const category = String(item.category || "").toLowerCase();
    score += categoryFrequency[category] || 0;

    for (const tag of item.tags || []) {
      score += tagFrequency[String(tag).toLowerCase()] || 0;
    }

    score += Number(item.ratingAverage || 0);

    return {
      ...item.toObject(),
      recommendationScore: Number(score.toFixed(2))
    };
  });

  const recommendations = scoredItems
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);

  res.status(200).json({
    success: true,
    personalized: true,
    count: recommendations.length,
    data: recommendations
  });
});

export const searchRecommendationsByPreference = catchAsync(async (req, res) => {
  const query = String(req.query.query || "").trim().toLowerCase();

  if (!query) {
    throw new ApiError("Search query is required.", 400);
  }

  const items = await MenuItem.find({ isAvailable: true });

  const keywords = query
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const scoredItems = items.map((item) => {
    let score = 0;

    const name = String(item.name || "").toLowerCase();
    const description = String(item.description || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const tags = (item.tags || []).map((tag) => String(tag).toLowerCase());

    for (const keyword of keywords) {
      if (tags.includes(keyword)) score += 5;
      if (name.includes(keyword)) score += 4;
      if (description.includes(keyword)) score += 3;
      if (category.includes(keyword)) score += 2;
    }

    score += Number(item.ratingAverage || 0);

    return {
      ...item.toObject(),
      recommendationScore: Number(score.toFixed(2))
    };
  });

  const recommendations = scoredItems
    .filter((item) => item.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 10);

  res.status(200).json({
    success: true,
    query,
    count: recommendations.length,
    data: recommendations
  });
});