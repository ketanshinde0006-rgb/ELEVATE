import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js';

/** GET /api/tasks */
export async function getTasks(req, res, next) {
  try {
    const { page = 1, limit = 50, status, priority, category, search, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id };

    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();
    if (category) where.category = category;
    if (search) where.title = { contains: search };

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' }
      : sort === 'priority' ? { priority: 'asc' }
      : sort === 'dueDate' ? { dueDate: 'asc' }
      : { createdAt: 'desc' };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy, skip, take: parseInt(limit) }),
      prisma.task.count({ where }),
    ]);

    return successResponse(res, tasks, 'Tasks retrieved', 200, paginationMeta(parseInt(page), parseInt(limit), total));
  } catch (error) { next(error); }
}

/** POST /api/tasks */
export async function createTask(req, res, next) {
  try {
    const { title, dueDate, priority, category } = req.body;
    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: (priority || 'MEDIUM').toUpperCase(),
        category,
      },
    });
    return createdResponse(res, task, 'Task created');
  } catch (error) { next(error); }
}

/** PATCH /api/tasks/:id */
export async function updateTask(req, res, next) {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Task not found', 404);

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.dueDate !== undefined) data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (req.body.priority !== undefined) data.priority = req.body.priority.toUpperCase();
    if (req.body.status !== undefined) data.status = req.body.status.toUpperCase();
    if (req.body.category !== undefined) data.category = req.body.category;

    const task = await prisma.task.update({ where: { id: req.params.id }, data });
    return successResponse(res, task, 'Task updated');
  } catch (error) { next(error); }
}

/** PATCH /api/tasks/:id/toggle */
export async function toggleTask(req, res, next) {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Task not found', 404);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: existing.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' },
    });
    return successResponse(res, task, 'Task toggled');
  } catch (error) { next(error); }
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req, res, next) {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Task not found', 404);
    await prisma.task.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Task deleted');
  } catch (error) { next(error); }
}
