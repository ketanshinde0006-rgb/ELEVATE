import prisma from '../config/database.js';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse.js';

/** GET /api/skills */
export async function getSkills(req, res, next) {
  try {
    const { search, category } = req.query;
    const where = { userId: req.user.id };
    if (search) where.title = { contains: search };
    if (category) where.category = category;

    const skills = await prisma.skill.findMany({
      where,
      include: { milestones: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, skills);
  } catch (error) { next(error); }
}

/** POST /api/skills */
export async function createSkill(req, res, next) {
  try {
    const { title, category, milestones } = req.body;
    const skill = await prisma.skill.create({
      data: {
        userId: req.user.id,
        title,
        category,
        milestones: milestones ? {
          create: milestones.map(m => ({ name: typeof m === 'string' ? m : m.name })),
        } : undefined,
      },
      include: { milestones: true },
    });
    return createdResponse(res, skill, 'Skill created');
  } catch (error) { next(error); }
}

/** PATCH /api/skills/:id */
export async function updateSkill(req, res, next) {
  try {
    const existing = await prisma.skill.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Skill not found', 404);

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.level !== undefined) data.level = req.body.level;
    if (req.body.progress !== undefined) data.progress = Math.max(0, Math.min(100, parseInt(req.body.progress)));
    if (req.body.category !== undefined) data.category = req.body.category;

    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data,
      include: { milestones: true },
    });
    return successResponse(res, skill, 'Skill updated');
  } catch (error) { next(error); }
}

/** PATCH /api/skills/:id/milestones/:milestoneId */
export async function toggleMilestone(req, res, next) {
  try {
    const skill = await prisma.skill.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { milestones: true },
    });
    if (!skill) return errorResponse(res, 'Skill not found', 404);

    const milestone = skill.milestones.find(m => m.id === req.params.milestoneId);
    if (!milestone) return errorResponse(res, 'Milestone not found', 404);

    await prisma.skillMilestone.update({
      where: { id: milestone.id },
      data: { achieved: !milestone.achieved },
    });

    // Recalculate progress based on milestones
    const updatedMilestones = skill.milestones.map(m =>
      m.id === milestone.id ? { ...m, achieved: !m.achieved } : m
    );
    const achievedCount = updatedMilestones.filter(m => m.achieved).length;
    const progress = Math.round((achievedCount / updatedMilestones.length) * 100);

    const updatedSkill = await prisma.skill.update({
      where: { id: skill.id },
      data: { progress },
      include: { milestones: true },
    });

    return successResponse(res, updatedSkill, 'Milestone toggled');
  } catch (error) { next(error); }
}

/** DELETE /api/skills/:id */
export async function deleteSkill(req, res, next) {
  try {
    const existing = await prisma.skill.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Skill not found', 404);
    await prisma.skill.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Skill deleted');
  } catch (error) { next(error); }
}
