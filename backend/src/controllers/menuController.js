import MenuItem from "../models/MenuItem.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllMenuItems = catchAsync(async (req, res) => {
  const { category, available, search } = req.query;

  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (available !== undefined) {
    filter.isAvailable = available === "true";
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } }
    ];
  }

  const menuItems = await MenuItem.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems
  });
});

export const getMenuItemById = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    throw new ApiError("Menu item not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: menuItem
  });
});

export const createMenuItem = catchAsync(async (req, res) => {
  const { name, description, category, price, image, tags, isAvailable } = req.body;

  if (!name || !description || !category || price === undefined) {
    throw new ApiError("Name, description, category, and price are required.", 400);
  }

  const menuItem = await MenuItem.create({
    name,
    description,
    category,
    price,
    image,
    tags,
    isAvailable
  });

  res.status(201).json({
    success: true,
    message: "Menu item created successfully",
    data: menuItem
  });
});

export const updateMenuItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!menuItem) {
    throw new ApiError("Menu item not found.", 404);
  }

  res.status(200).json({
    success: true,
    message: "Menu item updated successfully",
    data: menuItem
  });
});

export const deleteMenuItem = catchAsync(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

  if (!menuItem) {
    throw new ApiError("Menu item not found.", 404);
  }

  res.status(200).json({
    success: true,
    message: "Menu item deleted successfully"
  });
});