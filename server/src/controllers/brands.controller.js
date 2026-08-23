import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/** GET /api/brands */
export async function getBrands(req, res, next) {
  try {
    const { search, category, priceSegment, sort = 'name' } = req.query;
    const where = {};

    if (category && category !== 'All') where.category = category;
    if (priceSegment && priceSegment !== 'All') where.priceSegment = priceSegment;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { styles: { contains: search } },
      ];
    }

    const brands = await prisma.brand.findMany({
      where,
      orderBy: sort === 'category' ? { category: 'asc' } : { name: 'asc' },
    });

    const parsed = brands.map(b => ({
      ...b,
      styles: b.styles ? JSON.parse(b.styles) : [],
    }));

    return successResponse(res, parsed);
  } catch (error) { next(error); }
}

/** GET /api/brands/:id */
export async function getBrand(req, res, next) {
  try {
    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!brand) return errorResponse(res, 'Brand not found', 404);
    return successResponse(res, { ...brand, styles: brand.styles ? JSON.parse(brand.styles) : [] });
  } catch (error) { next(error); }
}

/** POST /api/brands/:id/save */
export async function saveBrand(req, res, next) {
  try {
    const existing = await prisma.savedBrand.findUnique({
      where: { userId_brandId: { userId: req.user.id, brandId: req.params.id } },
    });

    if (existing) {
      await prisma.savedBrand.delete({ where: { id: existing.id } });
      return successResponse(res, { saved: false }, 'Brand unsaved');
    }

    await prisma.savedBrand.create({
      data: { userId: req.user.id, brandId: req.params.id },
    });
    return successResponse(res, { saved: true }, 'Brand saved');
  } catch (error) { next(error); }
}

/** GET /api/brands/saved */
export async function getSavedBrands(req, res, next) {
  try {
    const saved = await prisma.savedBrand.findMany({
      where: { userId: req.user.id },
      include: { brand: true },
    });

    const brands = saved.map(s => ({
      ...s.brand,
      styles: s.brand.styles ? JSON.parse(s.brand.styles) : [],
      savedId: s.id,
    }));

    return successResponse(res, brands);
  } catch (error) { next(error); }
}
