// Velio backend — keeps your Anthropic API key private.
// The browser calls THIS endpoint; this endpoint calls Anthropic using
// a server-side environment variable that users never see.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Send a POST request.' });
    return;
  }

  try {
    const { system, messages } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Request body must include a non-empty "messages" array.' });
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({
        error: 'Server is not configured yet. Add ANTHROPIC_API_KEY as an environment variable in your Vercel project settings, then redeploy.'
      });
      return;
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        system: system || '',
        messages: messages
      })
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Server error while contacting the AI service.',
      details: String(err && err.message ? err.message : err)
    });
  }
};
