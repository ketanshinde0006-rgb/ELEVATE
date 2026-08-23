import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js';

/** GET /api/journal */
export async function getEntries(req, res, next) {
  try {
    const { page = 1, limit = 20, search, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({ where, orderBy, skip, take: parseInt(limit) }),
      prisma.journalEntry.count({ where }),
    ]);

    return successResponse(res, entries, 'Entries retrieved', 200, paginationMeta(parseInt(page), parseInt(limit), total));
  } catch (error) { next(error); }
}

/** POST /api/journal */
export async function createEntry(req, res, next) {
  try {
    const { title, content, mood } = req.body;
    const entry = await prisma.journalEntry.create({
      data: { userId: req.user.id, title, content: content || '', mood },
    });
    return createdResponse(res, entry, 'Entry created');
  } catch (error) { next(error); }
}

/** PATCH /api/journal/:id */
export async function updateEntry(req, res, next) {
  try {
    const existing = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Entry not found', 404);

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.content !== undefined) data.content = req.body.content;
    if (req.body.mood !== undefined) data.mood = req.body.mood;

    const entry = await prisma.journalEntry.update({ where: { id: req.params.id }, data });
    return successResponse(res, entry, 'Entry updated');
  } catch (error) { next(error); }
}

/** DELETE /api/journal/:id */
export async function deleteEntry(req, res, next) {
  try {
    const existing = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Entry not found', 404);
    await prisma.journalEntry.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Entry deleted');
  } catch (error) { next(error); }
}
