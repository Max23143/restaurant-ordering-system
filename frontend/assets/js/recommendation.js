function tokenize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function priceBand(price = 0) {
  const amount = Number(price);
  if (amount < 8) return "budget";
  if (amount < 16) return "mid";
  return "premium";
}

function scoreRecommendation(baseItem, candidate) {
  let score = 0;

  if (!baseItem || !candidate || baseItem._id === candidate._id) return -1;

  if (baseItem.category === candidate.category) score += 5;
  if (priceBand(baseItem.price) === priceBand(candidate.price)) score += 3;

  const baseWords = new Set([
    ...tokenize(baseItem.description),
    ...tokenize((baseItem.tags || []).join(" "))
  ]);

  const candidateWords = new Set([
    ...tokenize(candidate.description),
    ...tokenize((candidate.tags || []).join(" "))
  ]);

  let overlap = 0;
  baseWords.forEach((word) => {
    if (candidateWords.has(word)) overlap += 1;
  });

  score += Math.min(overlap, 4);
  score += Number(candidate.rating || 0);

  if (candidate.isAvailable) score += 1;

  return score;
}

function getRecommendations(baseItem, allItems = [], limit = 4) {
  return [...allItems]
    .map((candidate) => ({
      ...candidate,
      recommendationScore: scoreRecommendation(baseItem, candidate)
    }))
    .filter((item) => item.recommendationScore >= 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
}

function getPersonalizedHomeRecommendations(allItems = [], preferredCategory = "") {
  const normalizedItems = allItems.map(normalizeMenuItem);

  if (!normalizedItems.length) return [];

  if (preferredCategory) {
    const matches = normalizedItems
      .filter((item) => item.category.toLowerCase() === preferredCategory.toLowerCase())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    if (matches.length) return matches;
  }

  return normalizedItems
    .sort((a, b) => (b.rating * 2 + (b.reviewsCount || 0)) - (a.rating * 2 + (a.reviewsCount || 0)))
    .slice(0, 4);
}