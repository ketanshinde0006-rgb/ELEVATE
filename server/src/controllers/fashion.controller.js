import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/** GET /api/fashion/categories */
export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.fashionCategory.findMany({
      include: { _count: { select: { styles: true } } },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, categories);
  } catch (error) {
    next(error);
  }
}

/** GET /api/fashion/styles */
export async function getStyles(req, res, next) {
  try {
    const { search, category, sort = 'name' } = req.query;
    const conditions = [];

    // Clean category
    const cleanCategory = (category && category !== 'All' && category !== 'undefined' && category !== 'null' && category.trim() !== '')
      ? category.trim()
      : null;

    // Clean search
    const cleanSearch = (search && search !== 'undefined' && search !== 'null' && search.trim() !== '')
      ? search.trim()
      : null;

    // Filter by category (matches category name, category slug, style name, or tags)
    if (cleanCategory) {
      const slugCat = cleanCategory.toLowerCase().replace(/[\s&]+/g, '-');
      conditions.push({
        OR: [
          { category: { name: { equals: cleanCategory } } },
          { category: { slug: { equals: slugCat } } },
          { name: { contains: cleanCategory } },
          { tags: { contains: cleanCategory } },
        ],
      });
    }

    // Search query across name, description, tags, and category name
    if (cleanSearch) {
      conditions.push({
        OR: [
          { name: { contains: cleanSearch } },
          { description: { contains: cleanSearch } },
          { tags: { contains: cleanSearch } },
          { category: { name: { contains: cleanSearch } } },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const orderBy = sort === 'category'
      ? { category: { name: 'asc' } }
      : { name: 'asc' };

    const styles = await prisma.style.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy,
    });

    // Parse tags from JSON string
    const parsed = styles.map((s) => ({
      ...s,
      tags: s.tags ? (typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags) : [],
      categoryName: s.category?.name || 'Style',
    }));

    return successResponse(res, parsed);
  } catch (error) {
    next(error);
  }
}

/** GET /api/fashion/styles/:id */
export async function getStyle(req, res, next) {
  try {
    const style = await prisma.style.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!style) return errorResponse(res, 'Style not found', 404);

    return successResponse(res, {
      ...style,
      tags: style.tags ? (typeof style.tags === 'string' ? JSON.parse(style.tags) : style.tags) : [],
    });
  } catch (error) {
    next(error);
  }
}

/** POST /api/fashion/styles/:id/save */
export async function saveStyle(req, res, next) {
  try {
    const existing = await prisma.savedStyle.findUnique({
      where: { userId_styleId: { userId: req.user.id, styleId: req.params.id } },
    });

    if (existing) {
      await prisma.savedStyle.delete({ where: { id: existing.id } });
      return successResponse(res, { saved: false }, 'Style unsaved');
    }

    await prisma.savedStyle.create({
      data: { userId: req.user.id, styleId: req.params.id },
    });
    return successResponse(res, { saved: true }, 'Style saved');
  } catch (error) {
    next(error);
  }
}

/** GET /api/fashion/saved */
export async function getSavedStyles(req, res, next) {
  try {
    const saved = await prisma.savedStyle.findMany({
      where: { userId: req.user.id },
      include: { style: { include: { category: { select: { name: true } } } } },
    });

    const styles = saved.map((s) => ({
      ...s.style,
      tags: s.style.tags ? (typeof s.style.tags === 'string' ? JSON.parse(s.style.tags) : s.style.tags) : [],
      categoryName: s.style.category?.name || 'Style',
      savedId: s.id,
    }));

    return successResponse(res, styles);
  } catch (error) {
    next(error);
  }
}
