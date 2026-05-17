import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const unique = (items = []) => [...new Set(items.filter(Boolean))];

const getWords = (query = "") => {
  return normalizeText(query)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
};

/*
  Cuisine map:
  When user types "Italian food", it expands search to pizza, pasta,
  spaghetti, risotto, lasagne etc.
*/
const cuisineMap = {
  italian: ["italian", "pizza", "pasta", "spaghetti", "lasagne", "lasagna", "risotto", "carbonara", "bolognese", "margherita"],
  english: ["english", "british", "uk", "fish and chips", "roast", "pie", "breakfast", "beans", "sausage", "chips"],
  british: ["english", "british", "fish and chips", "roast", "pie", "breakfast", "sausage"],
  indian: ["indian", "curry", "masala", "tikka", "biryani", "naan", "rice", "spicy"],
  nepali: ["nepali", "momo", "chowmein", "thukpa", "dal bhat", "sekuwa", "achar"],
  chinese: ["chinese", "noodles", "fried rice", "chow mein", "dumpling", "sweet sour"],
  thai: ["thai", "pad thai", "green curry", "red curry", "coconut", "lemongrass"],
  american: ["american", "burger", "fries", "bbq", "wings", "hot dog"],
  mexican: ["mexican", "taco", "burrito", "nachos", "quesadilla", "salsa"],
  japanese: ["japanese", "sushi", "ramen", "teriyaki", "katsu"],
  korean: ["korean", "kimchi", "bbq", "bulgogi", "bibimbap"]
};

const flavourMap = {
  spicy: ["spicy", "hot", "chilli", "chili", "pepper", "masala"],
  sweet: ["sweet", "dessert", "cake", "chocolate", "caramel", "vanilla", "honey"],
  cheesy: ["cheesy", "cheese", "mozzarella", "cheddar"],
  creamy: ["creamy", "cream", "sauce", "white sauce"],
  grilled: ["grilled", "bbq", "barbecue", "smoky", "charcoal"],
  crispy: ["crispy", "crunchy", "fried"],
  mild: ["mild", "light", "soft"],
  sour: ["sour", "tangy", "lemon", "lime"],
  healthy: ["healthy", "salad", "light", "fresh", "vegetable"],
  vegetarian: ["vegetarian", "veg", "plant"],
  vegan: ["vegan", "plant-based"]
};

const foodIntentWords = [
  "food",
  "meal",
  "dish",
  "dishes",
  "restaurant",
  "eat",
  "eating",
  "flavour",
  "flavor",
  "taste",
  "type",
  "show",
  "want",
  "with"
];

const expandQuery = (query = "") => {
  const words = getWords(query);
  const expanded = new Set(words);

  for (const word of words) {
    if (cuisineMap[word]) {
      cuisineMap[word].forEach((term) => expanded.add(term));
    }

    if (flavourMap[word]) {
      flavourMap[word].forEach((term) => expanded.add(term));
    }
  }

  return unique([...expanded].filter((word) => !foodIntentWords.includes(word)));
};

const itemSearchText = (item) => {
  return normalizeText([
    item.name,
    item.description,
    item.category,
    item.cuisine,
    ...(item.tags || []),
    ...(item.flavours || [])
  ].join(" "));
};

const getPriceTier = (price) => {
  const value = Number(price || 0);

  if (value <= 8) return "budget";
  if (value <= 18) return "mid";
  return "premium";
};

const calculateItemScore = (item, queryWords, expandedTerms) => {
  const text = itemSearchText(item);

  const name = normalizeText(item.name);
  const description = normalizeText(item.description);
  const category = normalizeText(item.category);
  const cuisine = normalizeText(item.cuisine);
  const tags = normalizeText((item.tags || []).join(" "));
  const flavours = normalizeText((item.flavours || []).join(" "));

  let score = 0;
  let matchedTerms = [];

  for (const term of expandedTerms) {
    if (!term) continue;

    const normalizedTerm = normalizeText(term);

    if (name.includes(normalizedTerm)) {
      score += 12;
      matchedTerms.push(term);
    }

    if (cuisine.includes(normalizedTerm)) {
      score += 14;
      matchedTerms.push(term);
    }

    if (category.includes(normalizedTerm)) {
      score += 9;
      matchedTerms.push(term);
    }

    if (tags.includes(normalizedTerm)) {
      score += 8;
      matchedTerms.push(term);
    }

    if (flavours.includes(normalizedTerm)) {
      score += 8;
      matchedTerms.push(term);
    }

    if (description.includes(normalizedTerm)) {
      score += 5;
      matchedTerms.push(term);
    }

    if (text.includes(normalizedTerm)) {
      score += 2;
      matchedTerms.push(term);
    }
  }

  /*
    Price intent:
    budget/cheap/affordable returns cheaper items higher.
  */
  const joinedQuery = queryWords.join(" ");

  if (joinedQuery.includes("cheap") || joinedQuery.includes("budget") || joinedQuery.includes("affordable")) {
    const tier = getPriceTier(item.price);
    if (tier === "budget") score += 10;
    if (tier === "mid") score += 4;
    if (tier === "premium") score -= 6;
  }

  if (joinedQuery.includes("premium") || joinedQuery.includes("expensive") || joinedQuery.includes("luxury")) {
    const tier = getPriceTier(item.price);
    if (tier === "premium") score += 10;
  }

  /*
    Rating helps good items appear slightly higher,
    but search relevance is still the main factor.
  */
  score += Number(item.ratingAverage || 0) * 1.2;
  score += Math.min(Number(item.ratingCount || 0) * 0.08, 3);

  return {
    score: Number(score.toFixed(2)),
    matchedTerms: unique(matchedTerms)
  };
};

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
      score += 6;
    }

    if (
      item.cuisine &&
      currentItem.cuisine &&
      item.cuisine.toLowerCase() === currentItem.cuisine.toLowerCase()
    ) {
      score += 8;
    }

    score += calculateTagOverlap(currentItem.tags || [], item.tags || []) * 3;
    score += calculateTagOverlap(currentItem.flavours || [], item.flavours || []) * 3;
    score += Number(item.ratingAverage || 0);
    score += Math.min(Number(item.ratingCount || 0) * 0.1, 2);

    return {
      ...item.toObject(),
      recommendationScore: Number(score.toFixed(2))
    };
  });

  const recommendations = scoredItems
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 8);

  res.status(200).json({
    success: true,
    basedOn: {
      id: currentItem._id,
      name: currentItem.name,
      category: currentItem.category,
      cuisine: currentItem.cuisine,
      tags: currentItem.tags,
      flavours: currentItem.flavours
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
    .limit(8);

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations
  });
});

export const getPersonalizedRecommendations = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "items.menuItem",
    "name category cuisine tags flavours price"
  );

  if (!orders.length) {
    const fallbackItems = await MenuItem.find({ isAvailable: true })
      .sort({ ratingAverage: -1, ratingCount: -1, createdAt: -1 })
      .limit(8);

    return res.status(200).json({
      success: true,
      personalized: false,
      message: "No order history found. Showing top-rated items instead.",
      count: fallbackItems.length,
      data: fallbackItems
    });
  }

  const frequency = {};

  for (const order of orders) {
    for (const item of order.items || []) {
      if (!item.menuItem) continue;

      const menuItem = item.menuItem;
      const quantity = Number(item.quantity || 1);

      [
        menuItem.category,
        menuItem.cuisine,
        ...(menuItem.tags || []),
        ...(menuItem.flavours || [])
      ].forEach((term) => {
        const key = normalizeText(term);
        if (key) {
          frequency[key] = (frequency[key] || 0) + quantity;
        }
      });
    }
  }

  const orderedIds = orders.flatMap((order) =>
    (order.items || [])
      .map((item) => item.menuItem?._id?.toString())
      .filter(Boolean)
  );

  const candidates = await MenuItem.find({
    _id: { $nin: unique(orderedIds) },
    isAvailable: true
  });

  const scoredItems = candidates.map((item) => {
    let score = 0;

    [
      item.category,
      item.cuisine,
      ...(item.tags || []),
      ...(item.flavours || [])
    ].forEach((term) => {
      const key = normalizeText(term);
      score += frequency[key] || 0;
    });

    score += Number(item.ratingAverage || 0);
    score += Math.min(Number(item.ratingCount || 0) * 0.05, 2);

    return {
      ...item.toObject(),
      recommendationScore: Number(score.toFixed(2))
    };
  });

  const recommendations = scoredItems
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 8);

  res.status(200).json({
    success: true,
    personalized: true,
    count: recommendations.length,
    data: recommendations
  });
});

export const searchRecommendationsByPreference = catchAsync(async (req, res) => {
  const query = String(req.query.query || "").trim();

  if (!query) {
    throw new ApiError("Search query is required.", 400);
  }

  const queryWords = getWords(query);
  const expandedTerms = expandQuery(query);

  if (!expandedTerms.length) {
    return res.status(200).json({
      success: true,
      query,
      count: 0,
      data: []
    });
  }

  const items = await MenuItem.find({ isAvailable: true });

  const scoredItems = items
    .map((item) => {
      const result = calculateItemScore(item, queryWords, expandedTerms);

      return {
        ...item.toObject(),
        recommendationScore: result.score,
        matchedTerms: result.matchedTerms
      };
    })
    .filter((item) => item.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  res.status(200).json({
    success: true,
    query,
    expandedTerms,
    count: scoredItems.length,
    data: scoredItems.slice(0, 20)
  });
});