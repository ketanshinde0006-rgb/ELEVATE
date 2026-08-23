import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse.js';

/** GET /api/habits */
export async function getHabits(req, res, next) {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id },
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
      orderBy: { createdAt: 'desc' },
    });

    // Add completedToday flag
    const habitsWithStatus = habits.map(h => ({
      ...h,
      completedToday: h.completions.length > 0,
      completions: undefined, // Don't expose raw completions
    }));

    return successResponse(res, habitsWithStatus);
  } catch (error) { next(error); }
}

/** POST /api/habits */
export async function createHabit(req, res, next) {
  try {
    const { title, frequency } = req.body;
    const habit = await prisma.habit.create({
      data: { userId: req.user.id, title, frequency: frequency || 'Daily' },
    });
    return createdResponse(res, { ...habit, completedToday: false }, 'Habit created');
  } catch (error) { next(error); }
}

/** PATCH /api/habits/:id */
export async function updateHabit(req, res, next) {
  try {
    const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Habit not found', 404);

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.frequency !== undefined) data.frequency = req.body.frequency;

    const habit = await prisma.habit.update({ where: { id: req.params.id }, data });
    return successResponse(res, habit, 'Habit updated');
  } catch (error) { next(error); }
}

/** POST /api/habits/:id/complete */
export async function completeHabit(req, res, next) {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
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
    });
    if (!habit) return errorResponse(res, 'Habit not found', 404);

    const completedToday = habit.completions.length > 0;

    if (completedToday) {
      // Un-complete: remove today's completion, decrement streak
      await prisma.habitCompletion.deleteMany({
        where: {
          habitId: habit.id,
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      });

      const updatedHabit = await prisma.habit.update({
        where: { id: habit.id },
        data: { currentStreak: Math.max(0, habit.currentStreak - 1) },
      });

      return successResponse(res, { ...updatedHabit, completedToday: false }, 'Habit uncompleted');
    } else {
      // Complete: add completion, increment streak
      await prisma.habitCompletion.create({
        data: { habitId: habit.id, completedAt: new Date() },
      });

      const newStreak = habit.currentStreak + 1;
      const updatedHabit = await prisma.habit.update({
        where: { id: habit.id },
        data: {
          currentStreak: newStreak,
          bestStreak: Math.max(habit.bestStreak, newStreak),
        },
      });

      return successResponse(res, { ...updatedHabit, completedToday: true }, 'Habit completed!');
    }
  } catch (error) { next(error); }
}

/** DELETE /api/habits/:id */
export async function deleteHabit(req, res, next) {
  try {
    const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Habit not found', 404);
    await prisma.habit.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Habit deleted');
  } catch (error) { next(error); }
}
