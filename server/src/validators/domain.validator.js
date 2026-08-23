import Joi from 'joi';

export const goalSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Goal title is required',
    'string.max': 'Goal title cannot exceed 200 characters',
  }),
  description: Joi.string().trim().max(1000).allow('', null),
  deadline: Joi.date().iso().allow(null, ''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'low', 'medium', 'high').default('MEDIUM'),
  progress: Joi.number().integer().min(0).max(100).default(0),
});

export const updateGoalSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(1000).allow('', null),
  deadline: Joi.date().iso().allow(null, ''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'low', 'medium', 'high'),
  progress: Joi.number().integer().min(0).max(100),
  status: Joi.string().valid('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED', 'active', 'completed', 'paused', 'cancelled'),
});

export const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Task title is required',
  }),
  dueDate: Joi.date().iso().allow(null, ''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'low', 'medium', 'high').default('MEDIUM'),
  category: Joi.string().trim().max(50).allow('', null),
});

export const habitSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Habit title is required',
  }),
  frequency: Joi.string().valid('Daily', 'Weekly', 'Monthly').default('Daily'),
});

export const skillSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).required(),
  category: Joi.string().trim().max(50).allow('', null),
  level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert').default('Beginner'),
  progress: Joi.number().integer().min(0).max(100).default(0),
  milestones: Joi.array().items(
    Joi.alternatives().try(
      Joi.string().trim(),
      Joi.object({ name: Joi.string().trim().required(), achieved: Joi.boolean().default(false) })
    )
  ).optional(),
});

export const journalSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().trim().allow('', null),
  mood: Joi.string().trim().max(20).allow('', null),
});

export const wardrobeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  category: Joi.string().trim().valid('Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories').required(),
  subcategory: Joi.string().trim().max(50).allow('', null),
  brand: Joi.string().trim().max(100).allow('', null),
  color: Joi.string().trim().max(50).allow('', null),
  size: Joi.string().trim().max(30).allow('', null),
  season: Joi.string().trim().default('All Season'),
  occasion: Joi.string().trim().default('Casual'),
  style: Joi.string().trim().max(50).allow('', null),
  notes: Joi.string().trim().max(1000).allow('', null),
  image: Joi.string().trim().uri({ allowRelative: true }).allow('', null),
});

export const outfitSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  occasion: Joi.string().trim().max(50).allow('', null),
  season: Joi.string().trim().max(50).allow('', null),
  style: Joi.string().trim().max(50).allow('', null),
  notes: Joi.string().trim().max(1000).allow('', null),
  items: Joi.object().pattern(
    Joi.string(),
    Joi.string().allow(null)
  ).optional(),
});
