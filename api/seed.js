import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KV_KEY = 'timeline_data';

// Inline seed data to avoid filesystem issues in serverless
const seedData = {
  "metadata": {
    "version": "1.0",
    "last_updated": new Date().toISOString(),
    "total_people": 0,
    "total_events": 0
  },
  "categories": [],
  "locations": {},
  "people": [],
  "events": []
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const existing = await redis.get(KV_KEY);
    if (existing && req.query.force !== 'true') {
      return res.status(409).json({
        error: 'data_exists',
        message: 'KV already has data. Use ?force=true to overwrite.'
      });
    }

    // If request body has data, use it as seed. Otherwise use empty template.
    const dataToSeed = (req.body && req.body.people) ? req.body : seedData;

    await redis.set(KV_KEY, dataToSeed);
    return res.status(200).json({ success: true, message: 'Seeded successfully' });
  } catch (error) {
    console.error('Seed Error:', error);
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
}
