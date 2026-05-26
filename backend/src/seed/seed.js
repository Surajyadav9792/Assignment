import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { Task } from '../models/Task.js';
import { Quote } from '../models/Quote.js';
import { Sample } from '../models/Sample.js';
import { Product } from '../models/Product.js';
import { PipelineStage } from '../models/PipelineStage.js';
import { LeadSource } from '../models/LeadSource.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { recomputeScore } from '../services/leadScore.service.js';
import { logger } from '../utils/logger.js';

const STAGES = [
  { name: 'New Lead', order: 0, probability: 10, color: '#7C8794' },
  { name: 'Qualified', order: 1, probability: 25, color: '#5B9DF9' },
  { name: 'RFQ Received', order: 2, probability: 40, color: '#4F8AF7' },
  { name: 'Quoted', order: 3, probability: 55, color: '#A271F4' },
  { name: 'Negotiation', order: 4, probability: 65, color: '#F2A341' },
  { name: 'Sample Sent', order: 5, probability: 75, color: '#E89B3E' },
  { name: 'Sample Approved', order: 6, probability: 85, color: '#2BB673' },
  { name: 'PO Received', order: 7, probability: 95, color: '#1FA776' },
  { name: 'Won', order: 8, probability: 100, color: '#10B981', isTerminal: true },
  { name: 'Lost', order: 9, probability: 0, color: '#E5484D', isTerminal: true },
  { name: 'On Hold', order: 10, probability: 0, color: '#5A6573', isTerminal: true },
];

const SOURCES = ['Website', 'IndiaMART', 'Trade Show', 'Referral', 'Cold Outreach', 'LinkedIn', 'Existing Customer'];

const PRODUCTS = [
  { sku: 'PVC-001', name: 'PVC Granules', category: 'Plastics', defaultPrice: 95, unit: 'kg' },
  { sku: 'HDPE-04', name: 'HDPE Pipe 4"', category: 'Plastics', defaultPrice: 320, unit: 'mtr' },
  { sku: 'BRG-6203', name: 'Industrial Bearings 6203', category: 'Mechanical', defaultPrice: 145, unit: 'pcs' },
  { sku: 'SS-2MM', name: 'Steel Sheet 2mm', category: 'Steel', defaultPrice: 480, unit: 'kg' },
  { sku: 'CNC-LSP', name: 'CNC Lathe Spare Set', category: 'Mechanical', defaultPrice: 18500, unit: 'set' },
  { sku: 'PWR-16', name: 'Power Cable 16sqmm', category: 'Electrical', defaultPrice: 245, unit: 'mtr' },
  { sku: 'CNV-RLR', name: 'Conveyor Belt Roller', category: 'Mechanical', defaultPrice: 2100, unit: 'pcs' },
  { sku: 'SS-304', name: 'Stainless Steel Coil 304', category: 'Steel', defaultPrice: 295, unit: 'kg' },
  { sku: 'PP-RES', name: 'Polypropylene Resin', category: 'Plastics', defaultPrice: 120, unit: 'kg' },
  { sku: 'BR-FT12', name: 'Brass Fittings 1/2"', category: 'Mechanical', defaultPrice: 85, unit: 'pcs' },
  { sku: 'AL-T20', name: 'Aluminum Extrusion T-Slot', category: 'Mechanical', defaultPrice: 410, unit: 'mtr' },
  { sku: 'CU-25', name: 'Copper Wire Spool 25kg', category: 'Electrical', defaultPrice: 19800, unit: 'spool' },
  { sku: 'STL-IB6', name: 'Steel I-Beam 6m', category: 'Steel', defaultPrice: 8400, unit: 'pcs' },
  { sku: 'ADH-5L', name: 'Industrial Adhesive 5L', category: 'Chemical', defaultPrice: 1750, unit: 'can' },
  { sku: 'HYD-R2', name: 'Hydraulic Hose R2', category: 'Mechanical', defaultPrice: 380, unit: 'mtr' },
];

const COMPANIES = [
  ['Acme Polymers Pvt Ltd', 'Rajesh Kumar', 'Procurement Head', 'Mumbai', 'Maharashtra', 'Plastics & Polymers'],
  ['Bharti Steel Works', 'Anil Bharti', 'Director', 'Pune', 'Maharashtra', 'Steel & Metal'],
  ['TechFab Industries', 'Sunita Reddy', 'Operations Manager', 'Hyderabad', 'Telangana', 'Electronics & PCB'],
  ['SteelCorp Manufacturing', 'Manish Joshi', 'Procurement Manager', 'Jamshedpur', 'Jharkhand', 'Steel & Metal'],
  ['GreenLeaf Plastics', 'Pradeep Nair', 'CEO', 'Cochin', 'Kerala', 'Plastics & Polymers'],
  ['Mahindra Metalworks', 'Kavita Singh', 'Supply Chain Lead', 'Nashik', 'Maharashtra', 'Auto Components'],
  ['Sundaram Castings', 'Karthik Iyengar', 'Plant Head', 'Coimbatore', 'Tamil Nadu', 'Auto Components'],
  ['Coimbatore Textiles', 'Murugan S', 'Purchase Officer', 'Coimbatore', 'Tamil Nadu', 'Textile Machinery'],
  ['Ahmedabad Auto Parts', 'Bharat Patel', 'Owner', 'Ahmedabad', 'Gujarat', 'Auto Components'],
  ['Pune Precision Tools', 'Rohit Deshmukh', 'GM Sales', 'Pune', 'Maharashtra', 'Industrial Machinery'],
  ['Gujarat Glass Co', 'Hina Shah', 'Procurement Head', 'Vadodara', 'Gujarat', 'Glass & Ceramics'],
  ['Reliance Polymers Sub-vendor', 'Vivek Mehta', 'Vendor Manager', 'Jamnagar', 'Gujarat', 'Plastics & Polymers'],
  ['Tata Components', 'Sneha Pillai', 'Sourcing Lead', 'Jamshedpur', 'Jharkhand', 'Auto Components'],
  ['JSW Specialty Steel', 'Ajay Saxena', 'Buyer', 'Bellary', 'Karnataka', 'Steel & Metal'],
  ['Adani Wire & Cable', 'Deepak Roy', 'Procurement Manager', 'Mundra', 'Gujarat', 'Electrical'],
  ['Vishaka Electroplating', 'Vishal Khanna', 'Director', 'Faridabad', 'Haryana', 'Auto Components'],
  ['Karnataka Castings Pvt Ltd', 'Ramesh Gowda', 'Plant Manager', 'Bengaluru', 'Karnataka', 'Auto Components'],
  ['Mumbai Marine Eng.', 'Farooq Memon', 'Procurement Head', 'Mumbai', 'Maharashtra', 'Marine'],
  ['Indore Polymers Hub', 'Rakesh Agarwal', 'Owner', 'Indore', 'Madhya Pradesh', 'Plastics & Polymers'],
  ['Chennai Auto Forge', 'Lakshmi Narayan', 'GM Procurement', 'Chennai', 'Tamil Nadu', 'Auto Components'],
  ['Lucknow Heavy Industries', 'Brijesh Yadav', 'Procurement Officer', 'Lucknow', 'Uttar Pradesh', 'Industrial Machinery'],
  ['Surat Spinning Mills', 'Nitesh Modi', 'Maintenance Head', 'Surat', 'Gujarat', 'Textile Machinery'],
  ['Kolkata Iron Foundry', 'Subhash Banerjee', 'Owner', 'Kolkata', 'West Bengal', 'Steel & Metal'],
  ['Vizag Port Engineering', 'Vamsi Krishna', 'Buyer', 'Visakhapatnam', 'Andhra Pradesh', 'Marine'],
  ['Aurangabad Auto Hub', 'Mahesh Kale', 'Procurement Lead', 'Aurangabad', 'Maharashtra', 'Auto Components'],
  ['Faridabad Spring Co', 'Geeta Verma', 'Owner', 'Faridabad', 'Haryana', 'Auto Components'],
  ['Rajkot Diesel Engines', 'Hardik Bhanushali', 'Buyer', 'Rajkot', 'Gujarat', 'Industrial Machinery'],
  ['Hyderabad Pharma Eq.', 'Saritha Reddy', 'Procurement Manager', 'Hyderabad', 'Telangana', 'Pharma Equipment'],
  ['Bhiwadi Sheet Metal', 'Aman Choudhary', 'Director', 'Bhiwadi', 'Rajasthan', 'Steel & Metal'],
  ['Noida Plastics Ltd', 'Tarun Khurana', 'Procurement Officer', 'Noida', 'Uttar Pradesh', 'Plastics & Polymers'],
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function run() {
  await connectDB();
  logger.info('Clearing collections...');
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Activity.deleteMany({}),
    Task.deleteMany({}),
    Quote.deleteMany({}),
    Sample.deleteMany({}),
    Product.deleteMany({}),
    PipelineStage.deleteMany({}),
    LeadSource.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  logger.info('Seeding stages, sources, products...');
  const stages = await PipelineStage.insertMany(STAGES);
  const sources = await LeadSource.insertMany(SOURCES.map((name) => ({ name })));
  const products = await Product.insertMany(PRODUCTS);

  logger.info('Seeding users...');
  const pwHash = await bcrypt.hash('Demo@2026', 10);
  const admin = await User.create({
    name: 'Vikram Mehta',
    email: 'admin@forgeflow.com',
    passwordHash: pwHash,
    role: 'admin',
  });
  const manager = await User.create({
    name: 'Neha Kapoor',
    email: 'manager@forgeflow.com',
    passwordHash: pwHash,
    role: 'manager',
  });
  const ravi = await User.create({
    name: 'Ravi Sharma',
    email: 'ravi.bda@forgeflow.com',
    passwordHash: pwHash,
    role: 'bda',
    managerId: manager._id,
  });
  const priya = await User.create({
    name: 'Priya Verma',
    email: 'priya.bda@forgeflow.com',
    passwordHash: pwHash,
    role: 'bda',
    managerId: manager._id,
  });
  const arjun = await User.create({
    name: 'Arjun Iyer',
    email: 'arjun.bda@forgeflow.com',
    passwordHash: pwHash,
    role: 'bda',
    managerId: manager._id,
  });
  const bdas = [ravi, priya, arjun];

  logger.info('Seeding leads...');
  // Realistic distribution: most in early stages
  const stageDistribution = [
    'New Lead', 'New Lead', 'New Lead', 'New Lead',
    'Qualified', 'Qualified', 'Qualified', 'Qualified',
    'RFQ Received', 'RFQ Received', 'RFQ Received',
    'Quoted', 'Quoted', 'Quoted', 'Quoted',
    'Negotiation', 'Negotiation', 'Negotiation',
    'Sample Sent', 'Sample Sent',
    'Sample Approved', 'Sample Approved',
    'PO Received',
    'Won', 'Won', 'Won',
    'Lost', 'Lost',
    'On Hold',
    'Qualified',
  ];

  const stageByName = Object.fromEntries(stages.map((s) => [s.name, s]));
  const sourceByName = Object.fromEntries(sources.map((s) => [s.name, s]));

  const leads = [];
  for (let i = 0; i < COMPANIES.length; i++) {
    const [company, contact, designation, city, state, vertical] = COMPANIES[i];
    const stageName = stageDistribution[i % stageDistribution.length];
    const stage = stageByName[stageName];
    const owner = bdas[i % bdas.length];
    const source = sourceByName[SOURCES[i % SOURCES.length]];
    const value = randomInt(2, 50) * 50000;
    const isStuck = i % 10 === 7 || i % 13 === 11; // ~3 stuck deals
    const lastActivity = isStuck ? daysAgo(randomInt(16, 28)) : daysAgo(randomInt(0, 12));
    const created = daysAgo(randomInt(5, 60));

    const status = stageName === 'Won' ? 'won' : stageName === 'Lost' ? 'lost' : stageName === 'On Hold' ? 'onhold' : 'active';

    const lead = await Lead.create({
      companyName: company,
      contactName: contact,
      designation,
      email: `${contact.split(' ')[0].toLowerCase()}@${company.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}.in`,
      phone: `+91 9${randomInt(100000000, 999999999)}`,
      location: { city, state, country: 'India' },
      industryVertical: vertical,
      source: source._id,
      productInterest: [choice(products)._id, choice(products)._id],
      estimatedValue: value,
      expectedCloseDate: daysAgo(-randomInt(5, 60)),
      stage: stage._id,
      owner: owner._id,
      stageHistory: [{ stage: stage._id, enteredAt: created, by: owner._id }],
      lastActivityAt: lastActivity,
      notes: i % 3 === 0 ? 'Prefers 60-day credit terms. Decision-maker is procurement head.' : '',
      tags: i % 2 === 0 ? ['priority'] : [],
      status,
      createdAt: created,
    });
    leads.push(lead);
  }

  logger.info('Seeding activities...');
  const activityTypes = ['call', 'email', 'meeting', 'note'];
  const callOutcomes = ['Connected', 'Not Reached', 'Voicemail'];
  let activityCount = 0;
  for (const lead of leads) {
    const numActivities = randomInt(2, 6);
    for (let j = 0; j < numActivities; j++) {
      const type = choice(activityTypes);
      const occurredAt = daysAgo(randomInt(0, 25));
      const performedBy = lead.owner;
      const isCall = type === 'call';
      const outcome = isCall ? choice(callOutcomes) : undefined;
      const subjects = {
        call: 'Discussed pricing and MOQ',
        email: 'Quote follow-up sent',
        meeting: 'Tech-spec review meeting',
        note: 'Internal observation',
      };
      const bodies = {
        call: 'Spoke about pricing structure, volume discounts, and lead times. Will revert with revised quote.',
        email: 'Sent detailed product catalog and revised pricing for bulk order.',
        meeting: 'Site visit completed. Confirmed technical specifications. Sample requested.',
        note: 'Client mentioned competitive quote from supplier in Surat. Need to match pricing.',
      };
      await Activity.create({
        lead: lead._id,
        type,
        subject: subjects[type],
        body: bodies[type],
        outcome,
        occurredAt,
        performedBy,
      });
      activityCount++;
    }
  }

  logger.info('Seeding tasks...');
  const taskTitles = [
    'Follow up on pricing',
    'Send revised quote',
    'Schedule sample dispatch',
    'Confirm AWB number',
    'Negotiation call',
    'Send technical datasheet',
    'Review competitor offering',
    'Update CRM stages',
    'Email Q2 catalog',
    'Trade show prep',
  ];
  let tasks = 0;
  for (let i = 0; i < 20; i++) {
    const lead = choice(leads);
    const isOverdue = i < 4;
    const isToday = i >= 4 && i < 10;
    const dueDate = isOverdue
      ? daysAgo(randomInt(1, 4))
      : isToday
        ? new Date()
        : daysAgo(-randomInt(1, 6));
    await Task.create({
      title: choice(taskTitles),
      description: `Re: ${lead.companyName}`,
      lead: lead._id,
      dueDate,
      priority: choice(['low', 'medium', 'high']),
      status: i > 16 ? 'done' : 'open',
      assignee: lead.owner,
      createdBy: lead.owner,
      completedAt: i > 16 ? daysAgo(randomInt(1, 5)) : undefined,
    });
    tasks++;
  }

  logger.info('Seeding quotes...');
  let quoteCount = 0;
  const quotedLeads = leads.filter((l) => ['Quoted', 'Negotiation', 'Sample Sent', 'Sample Approved', 'PO Received', 'Won'].includes(stages.find((s) => String(s._id) === String(l.stage)).name));
  for (let i = 0; i < Math.min(8, quotedLeads.length); i++) {
    const lead = quotedLeads[i];
    const items = [];
    const itemCount = randomInt(2, 4);
    let subtotal = 0;
    for (let k = 0; k < itemCount; k++) {
      const p = choice(products);
      const qty = randomInt(10, 200);
      const discountPct = choice([0, 5, 10]);
      const gross = p.defaultPrice * qty;
      const disc = (gross * discountPct) / 100;
      const total = +(gross - disc).toFixed(2);
      subtotal += total;
      items.push({
        product: p._id,
        productName: p.name,
        sku: p.sku,
        quantity: qty,
        unitPrice: p.defaultPrice,
        discountPct,
        total,
      });
    }
    const taxPct = 18;
    const taxAmount = +((subtotal * taxPct) / 100).toFixed(2);
    const grandTotal = +(subtotal + taxAmount).toFixed(2);
    const year = new Date().getFullYear();
    const status = i < 5 ? 'sent' : i < 7 ? 'accepted' : 'draft';
    await Quote.create({
      quoteNumber: `QT-${year}-${String(i + 41).padStart(5, '0')}`,
      lead: lead._id,
      items,
      subtotal,
      taxPct,
      taxAmount,
      grandTotal,
      status,
      sentAt: status !== 'draft' ? daysAgo(randomInt(2, 10)) : undefined,
      validUntil: daysAgo(-30),
      createdBy: lead.owner,
      notes: 'Pricing valid for 30 days. Payment terms: 30 days net.',
    });
    quoteCount++;
  }

  logger.info('Seeding samples...');
  const sampleLeads = leads.filter((l) => {
    const stageName = stages.find((s) => String(s._id) === String(l.stage)).name;
    return ['Sample Sent', 'Sample Approved', 'Negotiation', 'Quoted'].includes(stageName);
  });
  const sampleStatuses = ['dispatched', 'delivered', 'approved', 'feedback_received', 'requested'];
  for (let i = 0; i < Math.min(5, sampleLeads.length); i++) {
    const lead = sampleLeads[i];
    const p = choice(products);
    await Sample.create({
      lead: lead._id,
      product: p._id,
      productName: p.name,
      quantity: randomInt(1, 10),
      status: sampleStatuses[i],
      courier: choice(['Bluedart', 'DTDC', 'Delhivery', 'FedEx']),
      awbNumber: `AWB${randomInt(100000, 999999)}`,
      dispatchedAt: i < 4 ? daysAgo(randomInt(2, 10)) : undefined,
      deliveredAt: i < 3 ? daysAgo(randomInt(1, 5)) : undefined,
      expectedFeedbackDate: daysAgo(-randomInt(2, 7)),
      feedbackNotes: i === 2 ? 'Approved on technical parameters. Awaiting final commercial sign-off.' : undefined,
      createdBy: lead.owner,
    });
  }

  logger.info('Seeding notifications...');
  for (const bda of bdas) {
    await Notification.create({
      user: bda._id,
      type: 'lead_assigned',
      title: 'New lead assigned',
      body: 'You have been assigned to follow up on a new RFQ.',
      link: `/leads`,
      isRead: false,
    });
  }

  logger.info('Recomputing lead scores...');
  for (const lead of leads) {
    await recomputeScore(lead._id);
  }

  logger.info(
    `Seed complete: ${leads.length} leads, ${activityCount} activities, ${tasks} tasks, ${quoteCount} quotes.`
  );
  logger.info('');
  logger.info('Demo credentials:');
  logger.info('  Admin    admin@forgeflow.com    / Demo@2026');
  logger.info('  Manager  manager@forgeflow.com  / Demo@2026');
  logger.info('  BDA      ravi.bda@forgeflow.com / Demo@2026');
  logger.info('  BDA      priya.bda@forgeflow.com/ Demo@2026');
  logger.info('  BDA      arjun.bda@forgeflow.com/ Demo@2026');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seed failed: ${err.stack || err.message}`);
  process.exit(1);
});
