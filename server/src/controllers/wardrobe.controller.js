import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js';

/** GET /api/wardrobe */
export async function getItems(req, res, next) {
  try {
    const { search, category, season, sort = 'name', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id };

    if (category && category !== 'All') where.category = category;
    if (season && season !== 'All Season') where.season = season;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { color: { contains: search } },
      ];
    }

    let orderBy;
    switch (sort) {
      case 'brand': orderBy = { brand: 'asc' }; break;
      case 'category': orderBy = { category: 'asc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'favorites': orderBy = { favorite: 'desc' }; break;
      default: orderBy = { name: 'asc' };
    }

    const [items, total] = await Promise.all([
      prisma.wardrobeItem.findMany({ where, orderBy, skip, take: parseInt(limit) }),
      prisma.wardrobeItem.count({ where }),
    ]);

    return successResponse(res, items, 'Items retrieved', 200, paginationMeta(parseInt(page), parseInt(limit), total));
  } catch (error) { next(error); }
}

/** GET /api/wardrobe/:id */
export async function getItem(req, res, next) {
  try {
    const item = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return errorResponse(res, 'Item not found', 404);
    return successResponse(res, item);
  } catch (error) { next(error); }
}

/** POST /api/wardrobe */
export async function createItem(req, res, next) {
  try {
    const { name, category, subcategory, brand, color, size, season, occasion, style, notes, image } = req.body;

    // If file was uploaded via multer
    let imageUrl = image || null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: req.user.id,
        name, category: category || 'Tops', subcategory, brand, color, size,
        season: season || 'All Season', occasion: occasion || 'Casual',
        style, notes, image: imageUrl,
      },
    });
    return createdResponse(res, item, 'Item added to wardrobe');
  } catch (error) { next(error); }
}

/** PATCH /api/wardrobe/:id */
export async function updateItem(req, res, next) {
  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Item not found', 404);

    const data = {};
    const fields = ['name', 'category', 'subcategory', 'brand', 'color', 'size', 'season', 'occasion', 'style', 'notes', 'image'];
    fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const item = await prisma.wardrobeItem.update({ where: { id: req.params.id }, data });
    return successResponse(res, item, 'Item updated');
  } catch (error) { next(error); }
}

/** PATCH /api/wardrobe/:id/favorite */
export async function toggleFavorite(req, res, next) {
  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Item not found', 404);

    const item = await prisma.wardrobeItem.update({
      where: { id: req.params.id },
      data: { favorite: !existing.favorite },
    });
    return successResponse(res, item, existing.favorite ? 'Removed from favorites' : 'Added to favorites');
  } catch (error) { next(error); }
}

/** DELETE /api/wardrobe/:id */
export async function deleteItem(req, res, next) {
  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Item not found', 404);
    await prisma.wardrobeItem.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Item deleted');
  } catch (error) { next(error); }
}

/** GET /api/wardrobe/stats */
export async function getStats(req, res, next) {
  try {
    const categories = await prisma.wardrobeItem.groupBy({
      by: ['category'],
      where: { userId: req.user.id },
      _count: true,
    });
    const total = await prisma.wardrobeItem.count({ where: { userId: req.user.id } });
    const favorites = await prisma.wardrobeItem.count({ where: { userId: req.user.id, favorite: true } });

    return successResponse(res, { total, favorites, categories: categories.map(c => ({ category: c.category, count: c._count })) });
  } catch (error) { next(error); }
}
