/**
.. * seed.js — Populates the database with demo accounts and sample leads.
 * Run with: node seed.js
 *
 * Demo credentials (put these in README for the recruiter):
 *   Admin  → admin@demo.com  / Admin@1234
 *   Member → member@demo.com / Member@1234
 */

import mongoose from 'mongoose';
import User  from './src/models/User.js';
import Lead from './src/models/Lead.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();
const DEMO_USERS = [
  { name: 'Alex Rivera (Admin)', email: 'admin@demo.com', password: 'Admin@1234', role: 'admin' },
  { name: 'Jamie Chen (Member)', email: 'member@demo.com', password: 'Member@1234', role: 'member' },
];

const SAMPLE_LEADS = [
  { name: 'Sarah Mitchell', email: 'sarah@acmecorp.com', company: 'Acme Corp', message: 'Interested in the enterprise plan. Team of 50.', status: 'qualified' },
  { name: 'Tom Bergmann', email: 'tom@techflow.io', company: 'TechFlow', message: 'Saw your demo at the conference, want to learn more.', status: 'contacted' },
  { name: 'Priya Nair', email: 'priya@globalventures.in', company: 'Global Ventures', message: 'Need a solution for our sales team ASAP.', status: 'proposal' },
  { name: 'Daniel Osei', email: 'daniel@startupxyz.com', company: 'StartupXYZ', message: 'Just browsing, early stage.', status: 'new' },
  { name: 'Lena Müller', email: 'lena@eurotrade.de', company: 'EuroTrade GmbH', message: 'Already using a competitor. Open to switching.', status: 'new' },
  { name: 'Ravi Shankar', email: 'ravi@innotech.co.in', company: 'InnoTech', message: 'Our current CRM is a nightmare. Please help!', status: 'won' },
  { name: 'Carlos Mendez', email: 'carlos@latamgroup.mx', company: 'LATAM Group', message: 'Budget approved, ready to proceed.', status: 'won' },
  { name: 'Fiona Walsh', email: 'fiona@irishbiz.ie', company: 'Irish Biz', message: 'Not sure about pricing.', status: 'lost' },
];

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await User.deleteMany({});
  await Lead.deleteMany({});

  // Create users
  const users = await User.create(DEMO_USERS);
  const admin = users.find((u) => u.role === 'admin');
  const member = users.find((u) => u.role === 'member');
  console.log(`✓ Created ${users.length} users`);

  // Create leads with realistic activity trails
  const leadDocs = SAMPLE_LEADS.map((l, i) => ({
    ...l,
    assignedTo: i < 4 ? member._id : null, // Assign first 4 leads to member
    activity: [
      { action: 'lead_created', performedBy: null, meta: { source: 'public_capture_form' } },
      ...(i < 4
        ? [{ action: 'assigned', performedBy: admin._id, meta: { to: member._id } }]
        : []),
      ...(l.status !== 'new'
        ? [{ action: 'status_changed', performedBy: admin._id, meta: { from: 'new', to: l.status } }]
        : []),
    ],
    notes:
      i < 3
        ? [
            {
              text: 'Initial call completed. Follow up scheduled.',
              createdBy: member._id,
              createdAt: new Date(),
            },
          ]
        : [],
  }));

  await Lead.create(leadDocs);
  console.log(`✓ Created ${leadDocs.length} sample leads`);

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Credentials:');
  console.log('  Admin  → admin@demo.com  / Admin@1234');
  console.log('  Member → member@demo.com / Member@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
