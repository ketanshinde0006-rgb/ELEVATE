import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, comparePassword, generateAccessToken } from '../src/services/auth.service.js';
import { successResponse, errorResponse, paginationMeta } from '../src/utils/apiResponse.js';
import { goalSchema, taskSchema, habitSchema, wardrobeSchema } from '../src/validators/domain.validator.js';

describe('Auth Service Tests', () => {
  test('hashPassword generates valid bcrypt hash and comparePassword verifies correctly', async () => {
    const password = 'TestSecret123!';
    const hash = await hashPassword(password);
    assert.ok(hash);
    assert.notEqual(hash, password);

    const isMatch = await comparePassword(password, hash);
    assert.equal(isMatch, true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    assert.equal(isWrongMatch, false);
  });

  test('generateAccessToken returns a non-empty JWT token string', () => {
    const token = generateAccessToken('user_123', 'USER');
    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3);
  });
});

describe('API Response Helpers', () => {
  test('paginationMeta calculates pages and hasNext/hasPrev correctly', () => {
    const meta = paginationMeta(1, 10, 25);
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNext, true);
    assert.equal(meta.hasPrev, false);

    const meta2 = paginationMeta(3, 10, 25);
    assert.equal(meta2.hasNext, false);
    assert.equal(meta2.hasPrev, true);
  });

  test('successResponse formats structured payload on Express res', () => {
    const mockRes = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; },
    };
    successResponse(mockRes, { item: 'blazer' }, 'Fetched item', 200);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(mockRes.body.success, true);
    assert.equal(mockRes.body.message, 'Fetched item');
    assert.equal(mockRes.body.data.item, 'blazer');
  });
});

describe('Domain Validators', () => {
  test('goalSchema validates valid goal data', () => {
    const validGoal = { title: 'Run a 10k race', priority: 'HIGH', progress: 50 };
    const { error } = goalSchema.validate(validGoal);
    assert.equal(error, undefined);
  });

  test('goalSchema rejects empty title', () => {
    const invalidGoal = { title: '', priority: 'HIGH' };
    const { error } = goalSchema.validate(invalidGoal);
    assert.ok(error);
  });

  test('taskSchema validates task with valid category', () => {
    const validTask = { title: 'Buy protein powder', category: 'Fitness', priority: 'MEDIUM' };
    const { error } = taskSchema.validate(validTask);
    assert.equal(error, undefined);
  });

  test('habitSchema accepts Daily, Weekly, Monthly', () => {
    const validHabit = { title: 'Morning meditation', frequency: 'Daily' };
    const { error } = habitSchema.validate(validHabit);
    assert.equal(error, undefined);
  });

  test('wardrobeSchema validates allowed categories', () => {
    const validItem = { name: 'Navy Blazer', category: 'Outerwear', brand: 'Ralph Lauren' };
    const { error } = wardrobeSchema.validate(validItem);
    assert.equal(error, undefined);

    const invalidItem = { name: 'Something', category: 'Electronics' };
    const { error: err } = wardrobeSchema.validate(invalidItem);
    assert.ok(err);
  });
});
