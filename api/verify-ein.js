export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { ein } = req.body;
    if (!ein) return res.status(400).json({ error: 'EIN is required' });

    // Clean EIN — remove dash
    const cleanEIN = ein.replace(/-/g, '');
    if (!/^\d{9}$/.test(cleanEIN)) {
      return res.status(400).json({ error: 'Invalid EIN format' });
    }

    // Query IRS Tax Exempt Organization Search API
    // This searches the IRS Exempt Organizations Business Master File
    const irsUrl = `https://apps.irs.gov/app/eos/api/records?q=${cleanEIN}&p=0&size=1&sort=ein+asc`;

    const irsRes = await fetch(irsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MalamaMap/1.0'
      }
    });

    if (!irsRes.ok) {
      // Fallback: try ProPublica Nonprofit Explorer API
      const ppUrl = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${cleanEIN}`;
      const ppRes = await fetch(ppUrl, {
        headers: { 'User-Agent': 'MalamaMap/1.0' }
      });

      if (ppRes.ok) {
        const ppData = await ppRes.json();
        const match = ppData.organizations?.find(org => {
          const orgEin = String(org.ein).replace(/-/g, '');
          return orgEin === cleanEIN;
        });

        if (match) {
          return res.status(200).json({
            verified: true,
            source: 'propublica',
            org_name: match.name,
            city: match.city,
            state: match.state,
            ntee_code: match.ntee_code
          });
        }
        return res.status(200).json({ verified: false, reason: 'EIN not found in nonprofit records' });
      }

      return res.status(200).json({ verified: false, reason: 'Unable to verify at this time. Try again later.' });
    }

    const irsData = await irsRes.json();

    // Check if we got a match
    if (irsData.records && irsData.records.length > 0) {
      const match = irsData.records.find(r => {
        const recEin = String(r.ein).replace(/-/g, '');
        return recEin === cleanEIN;
      });

      if (match) {
        return res.status(200).json({
          verified: true,
          source: 'irs',
          org_name: match.name || match.organization_name,
          city: match.city,
          state: match.state,
          status: match.status
        });
      }
    }

    // Not found in IRS — try ProPublica as fallback
    try {
      const ppUrl = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${cleanEIN}`;
      const ppRes = await fetch(ppUrl, {
        headers: { 'User-Agent': 'MalamaMap/1.0' }
      });
      if (ppRes.ok) {
        const ppData = await ppRes.json();
        const match = ppData.organizations?.find(org => {
          const orgEin = String(org.ein).replace(/-/g, '');
          return orgEin === cleanEIN;
        });
        if (match) {
          return res.status(200).json({
            verified: true,
            source: 'propublica',
            org_name: match.name,
            city: match.city,
            state: match.state,
            ntee_code: match.ntee_code
          });
        }
      }
    } catch(e) { /* ProPublica fallback failed — ok */ }

    return res.status(200).json({ verified: false, reason: 'EIN not found in IRS nonprofit records' });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
