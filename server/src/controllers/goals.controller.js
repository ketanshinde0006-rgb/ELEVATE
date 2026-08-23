import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js';

/** GET /api/goals */
export async function getGoals(req, res, next) {
  try {
    const { page = 1, limit = 20, status, priority, search, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id };

    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();
    if (search) where.title = { contains: search };

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' }
      : sort === 'priority' ? { priority: 'asc' }
      : sort === 'deadline' ? { deadline: 'asc' }
      : { createdAt: 'desc' };

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({ where, orderBy, skip, take: parseInt(limit) }),
      prisma.goal.count({ where }),
    ]);

    return successResponse(res, goals, 'Goals retrieved', 200, paginationMeta(parseInt(page), parseInt(limit), total));
  } catch (error) { next(error); }
}

/** GET /api/goals/:id */
export async function getGoal(req, res, next) {
  try {
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return errorResponse(res, 'Goal not found', 404);
    return successResponse(res, goal);
  } catch (error) { next(error); }
}

/** POST /api/goals */
export async function createGoal(req, res, next) {
  try {
    const { title, description, deadline, priority } = req.body;
    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        priority: (priority || 'MEDIUM').toUpperCase(),
      },
    });
    return createdResponse(res, goal, 'Goal created');
  } catch (error) { next(error); }
}

/** PATCH /api/goals/:id */
export async function updateGoal(req, res, next) {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Goal not found', 404);

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.deadline !== undefined) data.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    if (req.body.priority !== undefined) data.priority = req.body.priority.toUpperCase();
    if (req.body.progress !== undefined) data.progress = Math.max(0, Math.min(100, parseInt(req.body.progress)));
    if (req.body.status !== undefined) data.status = req.body.status.toUpperCase();

    // Auto-complete when progress hits 100
    if (data.progress === 100 && !data.status) data.status = 'COMPLETED';

    const goal = await prisma.goal.update({ where: { id: req.params.id }, data });
    return successResponse(res, goal, 'Goal updated');
  } catch (error) { next(error); }
}

/** DELETE /api/goals/:id */
export async function deleteGoal(req, res, next) {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Goal not found', 404);
    await prisma.goal.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Goal deleted');
  } catch (error) { next(error); }
}
