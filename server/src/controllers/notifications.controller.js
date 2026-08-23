import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/** GET /api/notifications */
export async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });
    return successResponse(res, { notifications, unreadCount });
  } catch (error) { next(error); }
}

/** PATCH /api/notifications/:id/read */
export async function markRead(req, res, next) {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return errorResponse(res, 'Notification not found', 404);

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    return successResponse(res, null, 'Marked as read');
  } catch (error) { next(error); }
}

/** PATCH /api/notifications/read-all */
export async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
}

/** DELETE /api/notifications/:id */
export async function deleteNotification(req, res, next) {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return errorResponse(res, 'Notification not found', 404);

    await prisma.notification.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Notification deleted');
  } catch (error) { next(error); }
}
