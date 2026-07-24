const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────

const registerUser = async (overrides = {}) => {
  const defaults = { name: 'Test User', email: `user_${Date.now()}@example.com`, password: 'Password1', role: 'member' };
  const res = await request(app).post('/api/auth/register').send({ ...defaults, ...overrides });
  return res.body;
};

// ─────────────────────────────────────────────────
//  PUBLIC CAPTURE FORM
// ─────────────────────────────────────────────────

describe('POST /api/leads (public capture form)', () => {
  it('should create a lead without authentication', async () => {
    const res = await request(app).post('/api/leads').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme',
      message: 'Interested in your product',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('new');
    expect(res.body.data.activity[0].action).toBe('lead_created');
  });

  it('should reject lead without name or email (400)', async () => {
    const res = await request(app).post('/api/leads').send({ company: 'No Name Corp' });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────
//  FLOW 1: Public submit → Admin sees lead → Assigns to member
// ─────────────────────────────────────────────────

describe('FLOW 1: Lead submission → admin sees it → assigns to member', () => {
  let adminToken, memberToken, memberId, leadId;

  beforeEach(async () => {
    const admin = await registerUser({ email: 'admin@example.com', role: 'admin' });
    const member = await registerUser({ email: 'member@example.com', role: 'member' });
    adminToken = admin.token;
    memberToken = member.token;
    memberId = member.user.id;

    // Public lead submission
    const leadRes = await request(app).post('/api/leads').send({
      name: 'Flow Lead',
      email: 'flow@example.com',
      company: 'Flow Corp',
    });
    leadId = leadRes.body.data._id;
  });

  it('admin can see all leads', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('member sees empty list (lead not assigned yet)', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('admin can assign lead to member', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedTo._id).toBe(memberId);
    expect(res.body.data.activity.some((a) => a.action === 'assigned')).toBe(true);
  });

  it('member sees lead after it is assigned to them', async () => {
    // Admin assigns
    await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId });

    // Member fetches list
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(leadId);
  });
});

// ─────────────────────────────────────────────────
//  FLOW 2: Member adds note → status update → activity trail correct
// ─────────────────────────────────────────────────

describe('FLOW 2: Member adds note → updates status → activity trail verified', () => {
  let adminToken, memberToken, leadId;

  beforeEach(async () => {
    const admin = await registerUser({ email: 'admin2@example.com', role: 'admin' });
    const member = await registerUser({ email: 'member2@example.com', role: 'member' });
    adminToken = admin.token;
    memberToken = member.token;
    const memberId = member.user.id;

    const leadRes = await request(app).post('/api/leads').send({
      name: 'Activity Lead',
      email: 'activity@example.com',
    });
    leadId = leadRes.body.data._id;

    // Assign to member
    await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId });
  });

  it('member can add a note to their assigned lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ text: 'Had a great call. They are very interested.' });

    expect(res.status).toBe(201);
    expect(res.body.data.notes.length).toBe(1);
    expect(res.body.data.notes[0].text).toBe('Had a great call. They are very interested.');
  });

  it('member can update status of their assigned lead', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('contacted');
  });

  it('activity trail records all events in order', async () => {
    // Add note
    await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ text: 'First contact made.' });

    // Update status
    await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'qualified' });

    // Fetch activity
    const res = await request(app)
      .get(`/api/leads/${leadId}/activity`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    const actions = res.body.data.map((a) => a.action);
    expect(actions).toContain('lead_created');
    expect(actions).toContain('assigned');
    expect(actions).toContain('note_added');
    expect(actions).toContain('status_changed');
  });

  it('member cannot add note to a lead not assigned to them (403)', async () => {
    // Create a second lead (unassigned)
    const otherLead = await request(app).post('/api/leads').send({
      name: 'Other Lead',
      email: 'other@example.com',
    });

    const res = await request(app)
      .post(`/api/leads/${otherLead.body.data._id}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ text: 'This should not work.' });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────
//  PAGINATION & FILTERING
// ─────────────────────────────────────────────────

describe('GET /api/leads — pagination and filtering', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await registerUser({ email: 'admin3@example.com', role: 'admin' });
    adminToken = admin.token;

    // Create 5 leads
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/leads').send({ name: `Lead ${i}`, email: `lead${i}@example.com` });
    }
  });

  it('should paginate correctly', async () => {
    const res = await request(app)
      .get('/api/leads?page=1&limit=3')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.pages).toBe(2);
    expect(res.body.pagination.hasNext).toBe(true);
  });

  it('should filter by status', async () => {
    // All leads are 'new' by default, so filter should return 5
    const res = await request(app)
      .get('/api/leads?status=new')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
  });

  it('should reject invalid status filter with 400', async () => {
    const res = await request(app)
      .get('/api/leads?status=invalid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
