import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';

let mongod;

// ── Setup in-memory MongoDB before all tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

// ── Disconnect and stop after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Clear all collections between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─────────────────────────────────────────────────
//  AUTH TESTS
// ─────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new member and return a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('member');
    expect(res.body.user.password).toBeUndefined(); // password never exposed
  });

  it('should reject duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: 'dup@example.com',
      password: 'Password1',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'dup@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'noname@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'Password1',
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should reject wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPass',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unknown email with 401 (not 404 — prevents enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user when token is valid', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Me User',
      email: 'me@example.com',
      password: 'Password1',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
//  ROLE ENFORCEMENT TESTS
// ─────────────────────────────────────────────────

describe('Role enforcement — member cannot access admin-only routes', () => {
  let memberToken;
  let leadId;

  beforeEach(async () => {
    // Register a member
    const memberReg = await request(app).post('/api/auth/register').send({
      name: 'Test Member',
      email: 'member@example.com',
      password: 'Password1',
      role: 'member',
    });
    memberToken = memberReg.body.token;

    // Create a lead via public form
    const leadRes = await request(app).post('/api/leads').send({
      name: 'Role Test Lead',
      email: 'lead@example.com',
    });
    leadId = leadRes.body.data._id;
  });

  it('member cannot call PATCH /api/leads/:id/assign (403)', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: null });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('member cannot call GET /api/users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});
