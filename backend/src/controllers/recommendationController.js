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

const synonymMap = {
  veg: ["vegetarian", "veg"],
  vegetarian: ["vegetarian", "veg"],
  vegan: ["vegan"],
  spicy: ["spicy", "hot", "chilli", "chili", "masala"],
  hot: ["spicy", "hot", "chilli", "chili"],
  sweet: ["sweet", "dessert", "sugary"],
  dessert: ["dessert", "sweet", "cake", "ice cream", "chocolate"],
  cheesy: ["cheesy", "cheese"],
  cheese: ["cheesy", "cheese"],
  grilled: ["grilled", "bbq", "barbecue", "barbeque"],
  chicken: ["chicken"],
  fish: ["fish", "seafood", "prawn", "shrimp"],
  cheap: ["cheap", "budget", "low price", "affordable"],
  affordable: ["cheap", "budget", "affordable"],
  expensive: ["expensive", "premium", "luxury"],
  lunch: ["lunch"],
  dinner: ["dinner"],
  breakfast: ["breakfast"],
  burger: ["burger"],
  curry: ["curry"],
  pizza: ["pizza"],
  pasta: ["pasta"]
};

const nonVegWords = [
  "chicken",
  "beef",
  "mutton",
  "lamb",
  "pork",
  "fish",
  "seafood",
  "prawn",
  "shrimp",
  "meat",
  "egg",
  "turkey",
  "bacon",
  "ham"
];

const sweetWords = [
  "sweet",
  "dessert",
  "cake",
  "ice cream",
  "chocolate",
  "caramel",
  "vanilla",
  "strawberry",
  "honey",
  "sugar"
];

const spicyWords = [
  "spicy",
  "hot",
  "chilli",
  "chili",
  "pepper",
  "masala"
];

const dinnerWords = [
  "main course",
  "curry",
  "rice",
  "pasta",
  "noodles",
  "burger",
  "pizza",
  "steak",
  "meal"
];

const breakfastWords = [
  "breakfast",
  "toast",
  "omelette",
  "egg",
  "coffee",
  "tea",
  "sandwich"
];

const lunchWords = [
  "lunch",
  "burger",
  "wrap",
  "sandwich",
  "rice",
  "pasta",
  "meal"
];

const expandKeywords = (keywords = []) => {
  const expanded = new Set();

  for (const keyword of keywords) {
    expanded.add(keyword);
    const synonyms = synonymMap[keyword] || [];
    synonyms.forEach((entry) => expanded.add(entry));
  }

  return [...expanded];
};

const normalizeItemForSearch = (item) => {
  const name = String(item.name || "").toLowerCase();
  const description = String(item.description || "").toLowerCase();
  const category = String(item.category || "").toLowerCase();
  const tags = (item.tags || []).map((tag) => String(tag).toLowerCase());
  const combinedText = `${name} ${description} ${category} ${tags.join(" ")}`;

  return { name, description, category, tags, combinedText };
};

const getPriceTier = (price) => {
  const value = Number(price || 0);

  if (value <= 8) return "cheap";
  if (value <= 18) return "mid";
  return "premium";
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
      score += 6;
    }

    score += calculateTagOverlap(currentItem.tags || [], item.tags || []) * 3;
    score += Number(item.ratingAverage || 0);
    score += Math.min(Number(item.ratingCount || 0) * 0.1, 2);

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
    "name category tags price"
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
  const priceTierFrequency = {};

  for (const order of orders) {
    for (const item of order.items || []) {
      if (!item.menuItem) continue;

      const menuItem = item.menuItem;
      const quantity = Number(item.quantity || 0);

      const category = String(menuItem.category || "").toLowerCase();
      if (category) {
        categoryFrequency[category] = (categoryFrequency[category] || 0) + quantity;
      }

      for (const tag of menuItem.tags || []) {
        const normalizedTag = String(tag).toLowerCase();
        tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + quantity;
      }

      const priceTier = getPriceTier(menuItem.price);
      priceTierFrequency[priceTier] = (priceTierFrequency[priceTier] || 0) + quantity;
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

    score += priceTierFrequency[getPriceTier(item.price)] || 0;
    score += Number(item.ratingAverage || 0);
    score += Math.min(Number(item.ratingCount || 0) * 0.05, 2);

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

  const rawKeywords = query
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

  const keywords = expandKeywords(rawKeywords);

  const hasVegetarianIntent = keywords.includes("vegetarian") || keywords.includes("veg");
  const hasVeganIntent = keywords.includes("vegan");
  const hasSweetIntent = keywords.includes("sweet") || keywords.includes("dessert");
  const hasSpicyIntent = keywords.includes("spicy") || keywords.includes("hot");
  const hasChickenIntent = keywords.includes("chicken");
  const hasFishIntent = keywords.includes("fish") || keywords.includes("seafood");
  const wantsCheap = keywords.includes("cheap") || keywords.includes("budget") || keywords.includes("affordable");
  const wantsPremium = keywords.includes("premium") || keywords.includes("expensive") || keywords.includes("luxury");
  const wantsDinner = keywords.includes("dinner");
  const wantsLunch = keywords.includes("lunch");
  const wantsBreakfast = keywords.includes("breakfast");

  const scoredItems = items
    .map((item) => {
      let score = 0;

      const { name, description, category, tags, combinedText } = normalizeItemForSearch(item);

      const containsNonVegWord = nonVegWords.some((word) => combinedText.includes(word));
      const containsSweetWord = sweetWords.some((word) => combinedText.includes(word));
      const containsSpicyWord = spicyWords.some((word) => combinedText.includes(word));

      const isVegetarianTagged =
        tags.includes("vegetarian") ||
        tags.includes("veg") ||
        category.includes("vegetarian") ||
        category.includes("veg");

      const isVeganTagged =
        tags.includes("vegan") ||
        category.includes("vegan");

      if (hasVegetarianIntent) {
        if (containsNonVegWord) return null;
        if (isVegetarianTagged) score += 12;
      }

      if (hasVeganIntent) {
        if (containsNonVegWord) return null;
        if (!isVeganTagged) return null;
        score += 14;
      }

      if (hasSweetIntent) {
        if (containsSweetWord) score += 10;
        else score -= 8;
      }

      if (hasSpicyIntent) {
        if (containsSpicyWord) score += 9;
        else score -= 5;
      }

      if (hasChickenIntent) {
        if (combinedText.includes("chicken")) score += 12;
        else score -= 6;
      }

      if (hasFishIntent) {
        if (
          combinedText.includes("fish") ||
          combinedText.includes("seafood") ||
          combinedText.includes("prawn") ||
          combinedText.includes("shrimp")
        ) {
          score += 12;
        } else {
          score -= 6;
        }
      }

      if (wantsCheap) {
        const tier = getPriceTier(item.price);
        if (tier === "cheap") score += 8;
        if (tier === "mid") score += 2;
        if (tier === "premium") score -= 6;
      }

      if (wantsPremium) {
        const tier = getPriceTier(item.price);
        if (tier === "premium") score += 8;
        if (tier === "cheap") score -= 3;
      }

      if (wantsDinner) {
        if (dinnerWords.some((word) => combinedText.includes(word))) score += 6;
        if (containsSweetWord) score -= 3;
      }

      if (wantsLunch) {
        if (lunchWords.some((word) => combinedText.includes(word))) score += 6;
      }

      if (wantsBreakfast) {
        if (breakfastWords.some((word) => combinedText.includes(word))) score += 6;
        else score -= 2;
      }

      for (const keyword of keywords) {
        if (tags.includes(keyword)) score += 7;
        if (name.includes(keyword)) score += 6;
        if (description.includes(keyword)) score += 4;
        if (category.includes(keyword)) score += 3;
      }

      score += Number(item.ratingAverage || 0) * 1.2;
      score += Math.min(Number(item.ratingCount || 0) * 0.08, 3);

      return {
        ...item.toObject(),
        recommendationScore: Number(score.toFixed(2))
      };
    })
    .filter(Boolean);

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