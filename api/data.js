import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KV_KEY = 'timeline_data';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const data = await redis.get(KV_KEY);
      if (!data) {
        return res.status(404).json({ error: 'no_data' });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || (!body.people && !body.events)) {
        return res.status(400).json({ error: 'invalid_data' });
      }
      const dataToStore = {
        ...body,
        metadata: {
          ...body.metadata,
          last_updated: new Date().toISOString()
        }
      };
      await redis.set(KV_KEY, dataToStore);
      return res.status(200).json({ success: true, timestamp: dataToStore.metadata.last_updated });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
}
