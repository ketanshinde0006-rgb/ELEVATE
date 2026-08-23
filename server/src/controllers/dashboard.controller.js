import prisma from '../config/database.js';
import { successResponse } from '../utils/apiResponse.js';

/** GET /api/dashboard */
export async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const [
      activeGoals,
      pendingTasks,
      habits,
      wardrobeCount,
      outfitCount,
      savedStylesCount,
      recentJournal,
      notifications,
    ] = await Promise.all([
      prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { userId, status: 'PENDING' } }),
      prisma.habit.findMany({
        where: { userId },
        include: {
          completions: {
            where: {
              completedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          },
        },
        orderBy: { currentStreak: 'desc' },
      }),
      prisma.wardrobeItem.count({ where: { userId } }),
      prisma.outfit.count({ where: { userId } }),
      prisma.savedStyle.count({ where: { userId } }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Best habit streak
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak)) : 0;

    // Goals progress
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, progress: true, deadline: true },
    });

    // Upcoming tasks
    const upcomingTasks = await prisma.task.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { dueDate: 'asc' },
      take: 5,
      select: { id: true, title: true, dueDate: true, priority: true },
    });

    // Habits today
    const habitsToday = habits.map(h => ({
      id: h.id,
      name: h.title,
      done: h.completions.length > 0,
      streak: h.currentStreak,
    }));

    const stats = {
      activeGoals,
      pendingTasks,
      bestStreak,
      wardrobeCount,
      outfitCount,
      savedStylesCount,
    };

    return successResponse(res, {
      stats,
      goals,
      upcomingTasks,
      habitsToday,
      recentJournal,
      notifications,
    });
  } catch (error) { next(error); }
}
