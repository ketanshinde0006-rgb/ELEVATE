import Joi from 'joi';

export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name must be at most 50 characters',
  }),
  lastName: Joi.string().trim().min(1).max(50).optional().allow(''),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
  }),
  phone: Joi.string().trim().min(8).max(20).optional().allow(''),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required',
  }),
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

export const googleAuthSchema = Joi.object({
  credential: Joi.string().trim().optional(),
  idToken: Joi.string().trim().optional(),
}).or('credential', 'idToken');

export const appleAuthSchema = Joi.object({
  credential: Joi.string().trim().optional(),
  idToken: Joi.string().trim().optional(),
  user: Joi.object().optional(),
}).or('credential', 'idToken');

export const microsoftAuthSchema = Joi.object({
  credential: Joi.string().trim().optional(),
  idToken: Joi.string().trim().optional(),
}).or('credential', 'idToken');

export const phoneSendOtpSchema = Joi.object({
  phone: Joi.string().trim().min(8).max(20).required().messages({
    'string.empty': 'Mobile number is required',
  }),
});

export const phoneVerifyOtpSchema = Joi.object({
  phone: Joi.string().trim().min(8).max(20).required(),
  code: Joi.string().trim().min(4).max(10).required().messages({
    'string.empty': 'Verification code is required',
  }),
});

export const emailOtpSendSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
  }),
});

export const emailOtpVerifySchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  otp: Joi.string().trim().length(6).required().messages({
    'string.empty': '6-digit code is required',
  }),
});

export const magicLinkSendSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
  }),
});

export const magicLinkVerifySchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  token: Joi.string().trim().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  token: Joi.string().trim().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  token: Joi.string().trim().required(),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min': 'New password must be at least 8 characters',
    'string.empty': 'New password is required',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min': 'New password must be at least 8 characters',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).optional(),
});

export const setPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).optional(),
});

export const mfaEnableSchema = Joi.object({
  token: Joi.string().trim().length(6).required().messages({
    'string.empty': '6-digit authenticator code is required',
  }),
});

export const mfaVerifyLoginSchema = Joi.object({
  tempToken: Joi.string().trim().required(),
  code: Joi.string().trim().required().messages({
    'string.empty': 'Authenticator or recovery code is required',
  }),
});

export const mfaDisableSchema = Joi.object({
  password: Joi.string().optional(),
  code: Joi.string().optional(),
}).or('password', 'code');

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
