import { CITY_CONFIG, TRADE_KEYS, TRADE_LIST, type TradeKey } from '@kaamsetu/shared';
import { connectDb, disconnectDb } from '../db.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import {
  Advertisement,
  Booking,
  CustomerProfile,
  Notification,
  Review,
  SubscriptionPlan,
  Trade,
  User,
  WorkerProfile,
} from '../models/index.js';
import { digitalWorkerId, referralCode } from '../utils/crypto.js';
import { recomputeWorkerTrust } from '../services/trust.js';

function offsetPoint(lng: number, lat: number, km: number): [number, number] {
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.random() * km;
  const dLat = (dist / 111) * Math.cos(angle);
  const dLng = (dist / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
  return [lng + dLng, lat + dLat];
}

const FIRST = [
  'Ramesh',
  'Suresh',
  'Anita',
  'Pooja',
  'Vikram',
  'Deepak',
  'Sunita',
  'Imran',
  'Gurpreet',
  'Kavita',
  'Arjun',
  'Neha',
  'Manoj',
  'Farhan',
  'Priya',
];
const LAST = ['Sharma', 'Verma', 'Yadav', 'Singh', 'Khan', 'Gupta', 'Patel', 'Kumar', 'Ali', 'Das'];

async function seed() {
  await connectDb(config.mongoUri);
  logger.info('Clearing existing KaamSetu collections...');
  await Promise.all([
    User.deleteMany({}),
    WorkerProfile.deleteMany({}),
    CustomerProfile.deleteMany({}),
    Trade.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    Advertisement.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
  ]);

  await Trade.insertMany(TRADE_LIST.map((t) => ({ ...t, active: true })));

  const admin = await User.create({
    phone: '+919999999999',
    name: 'KaamSetu Admin',
    role: 'admin',
    language: 'en',
    referralCode: 'KSADMIN',
  });

  const customers = [];
  for (let i = 1; i <= 15; i++) {
    const user = await User.create({
      phone: `+91900000${String(i).padStart(4, '0')}`,
      name: `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`,
      role: 'customer',
      language: i % 3 === 0 ? 'hi' : 'en',
      referralCode: referralCode(),
    });
    const [lng, lat] = offsetPoint(CITY_CONFIG.center.coordinates[0], CITY_CONFIG.center.coordinates[1], 6);
    await CustomerProfile.create({
      userId: user._id,
      customerType: (['homeowner', 'contractor', 'small_business', 'housing_society', 'commercial'] as const)[
        i % 5
      ],
      savedAddresses: [
        {
          label: 'Home',
          address: `House ${i}, Shastri Nagar, Meerut`,
          location: { type: 'Point', coordinates: [lng, lat] },
        },
      ],
    });
    customers.push(user);
  }

  const workers = [];
  for (let i = 1; i <= 60; i++) {
    const trade = TRADE_KEYS[(i - 1) % TRADE_KEYS.length] as TradeKey;
    const extra = TRADE_KEYS[i % TRADE_KEYS.length] as TradeKey;
    const user = await User.create({
      phone: `+91910000${String(i).padStart(4, '0')}`,
      name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
      role: 'worker',
      language: i % 2 === 0 ? 'hi' : 'en',
      referralCode: referralCode(),
      walletBalance: Math.round(Math.random() * 4000),
    });
    const [lng, lat] = offsetPoint(CITY_CONFIG.center.coordinates[0], CITY_CONFIG.center.coordinates[1], 8);
    const verified = i % 5 !== 0;
    const pending = i % 5 === 0 && i % 10 !== 0;
    await WorkerProfile.create({
      userId: user._id,
      bio: `Experienced ${trade.replace('_', ' ')} serving Meerut and nearby areas.`,
      skills: [
        { trade, experienceYears: 2 + (i % 12), hourlyRate: 80 + (i % 8) * 10 },
        ...(i % 4 === 0 ? [{ trade: extra, experienceYears: 1 + (i % 6), hourlyRate: 90 }] : []),
      ],
      location: { type: 'Point', coordinates: [lng, lat] },
      serviceRadiusKm: 6 + (i % 5),
      isAvailableNow: i % 3 !== 0,
      digitalId: digitalWorkerId(),
      verification: {
        phoneVerified: true,
        idType: 'aadhaar',
        idNumberMasked: `XXXX-XXXX-${String(1000 + i).slice(-4)}`,
        status: verified ? 'verified' : pending ? 'pending' : 'none',
        verifiedAt: verified ? new Date() : undefined,
      },
      jobsCompleted: 5 + (i % 40),
      jobsCancelled: i % 7,
      jobsAccepted: 8 + (i % 40),
      responseRate: 55 + (i % 40),
      avgResponseMinutes: 4 + (i % 20),
      onTimeRate: 60 + (i % 35),
      earningsTotal: (5 + (i % 40)) * 700,
      isPremium: i % 11 === 0,
      ratingAvg: 3.5 + (i % 15) / 10,
      ratingCount: 4 + (i % 20),
    });
    workers.push(user);
  }

  const statuses = ['completed', 'paid', 'cancelled'] as const;
  const bookings = [];
  for (let i = 0; i < 150; i++) {
    const customer = customers[i % customers.length];
    const worker = workers[i % workers.length];
    const trade = TRADE_KEYS[i % TRADE_KEYS.length];
    const status = statuses[i % 10 === 0 ? 2 : i % 2];
    const created = new Date(Date.now() - (150 - i) * 36e5 * 8);
    const booking = await Booking.create({
      customerId: customer._id,
      workerId: worker._id,
      trade,
      description: `Job ${i + 1}: ${trade.replace('_', ' ')} work in Meerut`,
      location: {
        type: 'Point',
        coordinates: offsetPoint(CITY_CONFIG.center.coordinates[0], CITY_CONFIG.center.coordinates[1], 5),
      },
      address: `Site ${i + 1}, Meerut`,
      scheduledFor: created,
      isEmergency: i % 17 === 0,
      estimatedDurationHrs: 2 + (i % 5),
      priceEstimate: { min: 400, max: 900, urgencyMultiplier: 1 },
      finalPrice: 500 + (i % 20) * 40,
      platformFee: Math.round((500 + (i % 20) * 40) * 0.08),
      status,
      statusTimeline: [{ status, at: created, note: 'seed' }],
      payment: {
        provider: 'mock_upi',
        status: status === 'paid' ? 'released' : status === 'completed' ? 'pending_release' : 'unpaid',
        method: 'upi',
        paidAt: status === 'paid' ? created : undefined,
      },
      startOtp: '1234',
      completionOtp: '5678',
      createdAt: created,
    });
    bookings.push(booking);
    if (status !== 'cancelled' && i % 2 === 0) {
      await Review.create({
        bookingId: booking._id,
        fromUserId: customer._id,
        toUserId: worker._id,
        rating: 3 + (i % 3),
        tags: i % 2 === 0 ? ['punctual', 'skilled'] : ['polite'],
        comment: i % 3 === 0 ? 'Kaam accha hua.' : 'On time and professional.',
        createdAt: created,
      });
    }
  }

  await Advertisement.insertMany([
    {
      title: 'Durable masonry tools',
      sponsor: 'Nirmaan Tools',
      targetTrade: 'mason',
      imageUrl: '/ads/tools.png',
      link: 'https://example.com',
      active: true,
    },
    {
      title: 'Safety boots for site work',
      sponsor: 'Meerut Safety Co',
      targetTrade: 'all',
      imageUrl: '/ads/boots.png',
      link: 'https://example.com',
      active: true,
    },
  ]);

  await SubscriptionPlan.insertMany([
    {
      key: 'worker_premium_30',
      audience: 'worker',
      name: { en: 'Worker Premium', hi: 'वर्कर प्रीमियम' },
      priceInr: 199,
      periodDays: 30,
      perks: ['Priority placement', 'Visibility boost'],
    },
    {
      key: 'contractor_pro_30',
      audience: 'contractor',
      name: { en: 'Contractor Pro', hi: 'कॉन्ट्रैक्टर प्रो' },
      priceInr: 499,
      periodDays: 30,
      perks: ['Bulk hire', 'Repeat-hire list'],
    },
  ]);

  for (const w of workers) {
    await recomputeWorkerTrust(String(w._id));
  }

  logger.info(
    {
      admin: admin.phone,
      customers: customers.length,
      workers: workers.length,
      bookings: bookings.length,
    },
    'Seed complete. Demo OTP is 123456',
  );
  await disconnectDb();
}

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
