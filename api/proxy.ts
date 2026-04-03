import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless proxy to bypass CORS and handle SEFAZ timeouts reliably in production.
 * This should be deployed to Vercel/Netlify/Cloudflare as an API function.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Some SEFAZ portals block empty user agents
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const data = await response.text();
    
    // Add CORS headers for the frontend to consume
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).send(data);
  } catch (error) {
    console.error('Proxy Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch the URL from SEFAZ' });
  }
}
