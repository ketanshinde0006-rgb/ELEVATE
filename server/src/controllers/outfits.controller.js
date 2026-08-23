import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse.js';

/** GET /api/outfits */
export async function getOutfits(req, res, next) {
  try {
    const { search, occasion, season } = req.query;
    const where = { userId: req.user.id };

    if (search) where.name = { contains: search };
    if (occasion) where.occasion = occasion;
    if (season) where.season = season;

    const outfits = await prisma.outfit.findMany({
      where,
      include: {
        items: {
          include: {
            wardrobeItem: { select: { id: true, name: true, image: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format items by slot
    const formatted = outfits.map(o => ({
      ...o,
      items: o.items.reduce((acc, item) => {
        acc[item.slot] = item.wardrobeItem;
        return acc;
      }, {}),
    }));

    return successResponse(res, formatted);
  } catch (error) { next(error); }
}

/** GET /api/outfits/:id */
export async function getOutfit(req, res, next) {
  try {
    const outfit = await prisma.outfit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: {
          include: { wardrobeItem: true },
        },
      },
    });
    if (!outfit) return errorResponse(res, 'Outfit not found', 404);

    const formatted = {
      ...outfit,
      items: outfit.items.reduce((acc, item) => {
        acc[item.slot] = item.wardrobeItem;
        return acc;
      }, {}),
    };

    return successResponse(res, formatted);
  } catch (error) { next(error); }
}

/** POST /api/outfits */
export async function createOutfit(req, res, next) {
  try {
    const { name, occasion, season, style, notes, items } = req.body;

    // items is expected as { top: wardrobeItemId, bottom: wardrobeItemId, ... }
    const outfitItems = [];
    if (items) {
      for (const [slot, wardrobeItemId] of Object.entries(items)) {
        if (wardrobeItemId) {
          // Verify the item belongs to the user
          const item = await prisma.wardrobeItem.findFirst({
            where: { id: wardrobeItemId, userId: req.user.id },
          });
          if (item) {
            outfitItems.push({ slot, wardrobeItemId });
          }
        }
      }
    }

    const outfit = await prisma.outfit.create({
      data: {
        userId: req.user.id,
        name,
        occasion,
        season,
        style,
        notes,
        items: { create: outfitItems },
      },
      include: {
        items: {
          include: { wardrobeItem: { select: { id: true, name: true, image: true, category: true } } },
        },
      },
    });

    const formatted = {
      ...outfit,
      items: outfit.items.reduce((acc, item) => {
        acc[item.slot] = item.wardrobeItem;
        return acc;
      }, {}),
    };

    return createdResponse(res, formatted, 'Outfit created');
  } catch (error) { next(error); }
}

/** PATCH /api/outfits/:id */
export async function updateOutfit(req, res, next) {
  try {
    const existing = await prisma.outfit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Outfit not found', 404);

    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.occasion !== undefined) data.occasion = req.body.occasion;
    if (req.body.season !== undefined) data.season = req.body.season;
    if (req.body.style !== undefined) data.style = req.body.style;
    if (req.body.notes !== undefined) data.notes = req.body.notes;

    // If items are updated, replace them
    if (req.body.items) {
      await prisma.outfitItem.deleteMany({ where: { outfitId: req.params.id } });
      const outfitItems = [];
      for (const [slot, wardrobeItemId] of Object.entries(req.body.items)) {
        if (wardrobeItemId) {
          outfitItems.push({ slot, wardrobeItemId, outfitId: req.params.id });
        }
      }
      if (outfitItems.length) {
        await prisma.outfitItem.createMany({ data: outfitItems });
      }
    }

    const outfit = await prisma.outfit.update({
      where: { id: req.params.id },
      data,
      include: {
        items: {
          include: { wardrobeItem: { select: { id: true, name: true, image: true, category: true } } },
        },
      },
    });

    const formatted = {
      ...outfit,
      items: outfit.items.reduce((acc, item) => {
        acc[item.slot] = item.wardrobeItem;
        return acc;
      }, {}),
    };

    return successResponse(res, formatted, 'Outfit updated');
  } catch (error) { next(error); }
}

/** PATCH /api/outfits/:id/favorite */
export async function toggleFavorite(req, res, next) {
  try {
    const existing = await prisma.outfit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Outfit not found', 404);

    const outfit = await prisma.outfit.update({
      where: { id: req.params.id },
      data: { favorite: !existing.favorite },
    });
    return successResponse(res, outfit);
  } catch (error) { next(error); }
}

/** DELETE /api/outfits/:id */
export async function deleteOutfit(req, res, next) {
  try {
    const existing = await prisma.outfit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Outfit not found', 404);
    await prisma.outfit.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Outfit deleted');
  } catch (error) { next(error); }
}
