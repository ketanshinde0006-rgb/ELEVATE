/**
 * Standardized API response helpers
 */

export function successResponse(res, data = null, message = 'Success', statusCode = 200, pagination = null) {
  const response = {
    success: true,
    message,
    data,
  };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
}

export function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

export function createdResponse(res, data, message = 'Created successfully') {
  return successResponse(res, data, message, 201);
}

export function noContentResponse(res) {
  return res.status(204).send();
}

export function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
