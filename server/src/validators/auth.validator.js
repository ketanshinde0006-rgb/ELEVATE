import Joi from 'joi';

export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name must be at most 50 characters',
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Last name is required',
    'string.max': 'Last name must be at most 50 characters',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).optional().messages({
    'string.email': 'Enter a valid email address',
  }),
  phone: Joi.string().trim().min(8).max(20).optional().messages({
    'string.min': 'Enter a valid mobile number',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required',
  }),
}).or('email', 'phone').messages({
  'object.missing': 'Either email or mobile number is required',
});

export const loginSchema = Joi.object({
  identifier: Joi.string().trim().optional(),
  email: Joi.string().trim().optional(),
  phone: Joi.string().trim().optional(),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password is required',
  }),
}).or('identifier', 'email', 'phone').messages({
  'object.missing': 'Email or mobile number is required',
});

export const sendOtpSchema = Joi.object({
  phone: Joi.string().trim().min(8).max(20).required().messages({
    'string.empty': 'Mobile number is required',
    'string.min': 'Enter a valid mobile number',
  }),
});

export const verifyOtpSchema = Joi.object({
  phone: Joi.string().trim().min(8).max(20).required().messages({
    'string.empty': 'Mobile number is required',
  }),
  otp: Joi.string().trim().length(6).required().messages({
    'string.empty': '6-digit OTP is required',
    'string.length': 'OTP must be exactly 6 digits',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required',
  }),
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'First name is required',
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Last name is required',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).optional(),
});

/**
 * Validation middleware factory
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    req.body = value;
    next();
  };
}
