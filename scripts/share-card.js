// ── Share Card Generator ──
// Generates a 1080x1920 share image for any listing, with native share + download fallback
// Accepts context: 'need' (calming sage) or 'give' (warm amber/urgency)

function showInAppBrowserOverlay() {
  // Remove existing overlay if any
  const existing = document.getElementById('inAppOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'inAppOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.5rem;';
  overlay.innerHTML = `
    <div style="background:white;border-radius:20px;padding:2rem 1.5rem;max-width:340px;width:100%;text-align:center;font-family:Nunito,sans-serif;">
      <div style="width:52px;height:52px;background:#edf7f1;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="#3a7d5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h3 style="font-family:Georgia,serif;font-size:1.2rem;font-weight:800;color:#1a3d2b;margin:0 0 0.5rem;">Open in your browser</h3>
      <p style="font-size:0.85rem;color:#8a827a;line-height:1.6;margin:0 0 1.25rem;">Sharing works best outside of Instagram. Tap the menu icon <strong style="font-size:1.1em;">⋯</strong> at the top right, then choose <strong>"Open in Safari"</strong> or <strong>"Open in Browser"</strong>.</p>
      <button onclick="this.closest('#inAppOverlay').remove()" style="width:100%;padding:0.75rem;background:#3a7d5c;color:white;border:none;border-radius:100px;font-size:0.88rem;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">Got it</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

const SHARE_TYPE_LABELS = {
  shelter:'Shelter', supply_station:'Supply Station',
  donation_dropoff:'Donation Drop-off', volunteer_event:'Volunteer Needed',
  skills_labor:'Skills & Labor', medical_assistance:'Medical Aid'
};

const SHARE_TYPE_EMOJI = {
  shelter:'🏠', supply_station:'🛖',
  donation_dropoff:'📦', volunteer_event:'🙋',
  skills_labor:'🔧', medical_assistance:'🏥'
};

const NEED_TYPES = ['shelter','supply_station','medical_assistance','skills_labor'];

function detectContext(listing) {
  const t = (listing.type || '').split(',')[0];
  return NEED_TYPES.includes(t) ? 'need' : 'give';
}

function getTheme(context, listingType) {
  if (context === 'need') {
    return {
      bg1: '#142d42', bg2: '#0d1f30',         // outer background — deep ocean blue
      header1: '#153550', header2: '#1a4a72',  // card header — rich blue
      headline: 'Looking for help?',
      ctaBg: '#eaf3fb', ctaText: '#1a4a72',    // bottom CTA box — soft blue
      pillBg: 'rgba(77,160,212,0.3)', pillColor: '#a8daf5', pillBorder: 'rgba(77,160,212,0.4)',
      accentLight: '#eaf3fb', accentDeep: '#1a4a72',
    };
  }
  // 'give' context
  const isVolunteer = listingType === 'volunteer_event';
  return {
    bg1: '#3d2a1a', bg2: '#2a1c10',           // outer background — warm deep amber
    header1: '#4a2e14', header2: '#6b3f1a',    // card header — rich amber
    headline: isVolunteer ? 'Volunteers Wanted' : 'Help Needed',
    ctaBg: '#fdf4e3', ctaText: '#6b3f1a',
    pillBg: 'rgba(245,200,66,0.3)', pillColor: '#f5d48a', pillBorder: 'rgba(201,152,58,0.4)',
    accentLight: '#fdf4e3', accentDeep: '#7a5c1a',
  };
}

function formatHoursForCard(hours) {
  if (!hours) return { days: '', time: '', dateRange: '' };
  let h = hours;
  // Extract date range like "Mar 25 – Apr 3"
  let dateRange = '';
  const dateMatch = h.match(/·?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*[–-]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{1,2})/i);
  if (dateMatch) {
    dateRange = dateMatch[1].trim();
    h = h.replace(dateMatch[0], '').trim();
  }
  // Clean up
  h = h.replace(' · Until further notice','').replace('Until further notice','').trim();
  if (h.endsWith('·')) h = h.slice(0,-1).trim();
  // Try to split days from time
  const timeMatch = h.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*[–-]\s*\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  let days = '', time = '';
  if (timeMatch) {
    time = timeMatch[1].trim();
    days = h.replace(timeMatch[0], '').replace(/·/g,'').trim();
    // Clean trailing separators
    if (days.endsWith(',') || days.endsWith('·')) days = days.slice(0,-1).trim();
  } else {
    days = h;
  }
  return { days, time, dateRange };
}

function buildShareCardHTML(l, context) {
  if (!context) context = detectContext(l);
  const theme = getTheme(context, (l.type||'').split(',')[0]);

  const items = (l.items||[]).filter(i=>!i.startsWith('ACCEPTING:')).map(i=>i.replace('GIVING:','')).slice(0,8);
  const accepting = (l.items||[]).filter(i=>i.startsWith('ACCEPTING:')).slice(0,6).map(i=>i.replace('ACCEPTING:',''));
  const types = (l.type||'').split(',').filter(Boolean);

  // Type pills — WAY bigger
  const typePills = types.map(t => {
    const emoji = SHARE_TYPE_EMOJI[t] || '📍';
    const label = SHARE_TYPE_LABELS[t] || t;
    return '<span style="background:'+theme.pillBg+';color:'+theme.pillColor+';border-radius:100px;padding:16px 44px;font-size:32px;font-weight:800;border:2px solid '+theme.pillBorder+';letter-spacing:0.02em;">'+emoji+' '+label+'</span>';
  }).join('');

  // Available items — adaptive size
  const itemFontSize = items.length > 5 ? '18px' : '24px';
  const itemPad = items.length > 5 ? '8px 20px' : '12px 28px';
  const offerPills = items.map(i =>
    '<span style="background:'+theme.accentLight+';color:'+theme.accentDeep+';border-radius:100px;padding:'+itemPad+';font-size:'+itemFontSize+';font-weight:700;">'+i+'</span>'
  ).join('') + (items.length >= 8 ? '<span style="background:'+theme.accentLight+';color:'+theme.accentDeep+';border-radius:100px;padding:'+itemPad+';font-size:'+itemFontSize+';font-weight:700;">+ more</span>' : '');

  // Accepting pills — adaptive
  const accFontSize = accepting.length > 4 ? '18px' : '24px';
  const accPad = accepting.length > 4 ? '8px 20px' : '12px 28px';
  const acceptPills = accepting.map(i =>
    '<span style="background:#fdf4e3;color:#7a5c1a;border-radius:100px;padding:'+accPad+';font-size:'+accFontSize+';font-weight:700;">'+i+'</span>'
  ).join('') + (accepting.length >= 6 ? '<span style="background:#fdf4e3;color:#7a5c1a;border-radius:100px;padding:'+accPad+';font-size:'+accFontSize+';font-weight:700;">& more</span>' : '');

  // Hours formatting
  const hrs = formatHoursForCard(l.hours);

  // Neighborhood only — no street
  const neighborhood = l.location || '';

  return '<div style="width:1080px;height:1920px;background:linear-gradient(180deg,'+theme.bg1+','+theme.bg2+');font-family:Nunito,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 60px;">'

    // ── TOP BRANDING ──
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<p style="color:rgba(255,255,255,0.5);font-size:42px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;margin:0;">MĀLAMA MAP</p>'
    + '<p style="color:rgba(255,255,255,0.3);font-size:24px;font-weight:600;letter-spacing:0.1em;margin:8px 0 0;">Hawaiʻi helping Hawaiʻi</p>'
    + '</div>'

    // ── CONTEXT HEADLINE ──
    + '<p style="color:rgba(255,255,255,0.85);font-size:48px;font-weight:800;margin:0 0 36px;letter-spacing:0.02em;">'+theme.headline+'</p>'

    // ── CARD ──
    + '<div style="width:100%;background:white;border-radius:48px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.5);">'

    // Card header
    + '<div style="background:linear-gradient(160deg,'+theme.header1+','+theme.header2+');padding:56px 64px 48px;text-align:center;">'
    + (neighborhood ? '<p style="color:rgba(255,255,255,0.6);font-size:28px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 20px;">📍 '+neighborhood+'</p>' : '')
    + '<div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:24px;">'+typePills+'</div>'
    + '<h1 style="color:white;font-size:60px;font-weight:800;margin:0;line-height:1.2;">'+(l.name||'')+'</h1>'
    + '</div>'

    // Address + Hours
    + '<div style="padding:44px 64px;border-bottom:2px solid #f0ede8;background:white;">'
    + (l.address ? '<div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:'+(hrs.days||hrs.time?'28px':'0')+';"><span style="background:'+theme.accentLight+';color:'+theme.accentDeep+';border-radius:100px;padding:10px 28px;font-size:24px;font-weight:800;white-space:nowrap;flex-shrink:0;">ADDRESS</span><p style="font-size:34px;font-weight:700;color:#1a1a1a;margin:0;line-height:1.4;">'+l.address.replace(', USA','')+'</p></div>' : '')
    + ((hrs.days || hrs.time) ? '<div style="display:flex;align-items:flex-start;gap:20px;"><span style="background:'+theme.accentLight+';color:'+theme.accentDeep+';border-radius:100px;padding:10px 28px;font-size:24px;font-weight:800;white-space:nowrap;flex-shrink:0;">HOURS</span><div>'
      + (hrs.days ? '<p style="font-size:32px;font-weight:700;color:#1a1a1a;margin:0;line-height:1.4;">'+hrs.days+'</p>' : '')
      + (hrs.time ? '<p style="font-size:32px;font-weight:700;color:#1a1a1a;margin:4px 0 0;line-height:1.4;">'+hrs.time+'</p>' : '')
      + (hrs.dateRange ? '<p style="font-size:22px;font-weight:600;color:#8a827a;margin:8px 0 0;">'+hrs.dateRange+'</p>' : '')
      + '</div></div>' : '')
    + '</div>'

    // Available now — inline flow with label
    + (items.length ? '<div style="padding:40px 64px;border-bottom:'+(accepting.length?'2px solid #f0ede8':'none')+';background:white;"><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;"><span style="font-size:22px;font-weight:800;color:#0d6678;letter-spacing:0.1em;text-transform:uppercase;margin-right:8px;">Available now</span>'+offerPills+'</div></div>' : '')

    // Accepting
    + (accepting.length ? '<div style="padding:40px 64px;background:white;"><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;"><span style="font-size:22px;font-weight:800;color:#8a6020;letter-spacing:0.1em;text-transform:uppercase;margin-right:8px;">Accepting</span>'+acceptPills+'</div></div>' : '')

    // CTA footer — colored, not white
    + '<div style="background:'+theme.ctaBg+';padding:44px 64px;text-align:center;">'
    + '<p style="color:'+theme.ctaText+';font-size:24px;font-weight:700;margin:0 0 14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;">Find more resources at</p>'
    + '<p style="color:'+theme.ctaText+';font-size:52px;font-weight:800;margin:0;">malamamap.org</p>'
    + '</div>'

    + '</div>' // end card

    // Bottom tagline
    + '<p style="color:rgba(255,255,255,0.2);font-size:22px;margin:30px 0 0;letter-spacing:0.08em;">Built for Hawaiʻi, with aloha</p>'
    + '</div>';
}

async function shareListingCard(listing, context) {
  if (!context) context = detectContext(listing);

  const container = document.createElement('div');
  container.id = 'shareCardOffscreen';
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;height:1920px;z-index:9999;';
  container.innerHTML = buildShareCardHTML(listing, context);
  document.body.appendChild(container);

  await new Promise(r => setTimeout(r, 300));

  const bgColor = context === 'need' ? '#0d1f30' : '#2a1c10';

  try {
    const canvas = await html2canvas(container, {
      width: 1080, height: 1920, scale: 1,
      useCORS: true, backgroundColor: bgColor, logging: false
    });

    const safeName = (listing.name||'listing').replace(/[^a-z0-9]/gi,'_').slice(0,40);
    const listingUrl = 'malamamap.org/malama-listing.html?id=' + listing.id;

    // Build offering summary from items
    const offerItems = (listing.items||[])
      .filter(i => !i.startsWith('ACCEPTING:'))
      .map(i => i.replace('GIVING:',''))
      .slice(0, 4);
    const offeringText = offerItems.length
      ? ' offering ' + offerItems.join(', ').toLowerCase()
      : '';

    const shareText = (listing.name || '')
      + offeringText
      + (listing.location ? '\n📍 ' + listing.location : '')
      + '\n\nTo see more or get in contact:\n' + listingUrl;

    // Detect Instagram in-app browser — it can't handle file shares or blob downloads
    const isInstagram = /Instagram/i.test(navigator.userAgent);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'MalamaMap_' + safeName + '.png', { type: 'image/png' });

      // Instagram in-app browser: show overlay prompting to open in real browser
      if (isInstagram) {
        showInAppBrowserOverlay();
        return;
      }

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: listing.name + ' — Mālama Map', text: shareText });
          return;
        } catch(e) { if (e.name === 'AbortError') return; }
      }

      // Fallback: download
      const link = document.createElement('a');
      link.download = 'MalamaMap_' + safeName + '.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    }, 'image/png');
  } catch(e) {
    const url = 'https://malamamap.org/malama-listing.html?id=' + listing.id;
    navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
  }

  document.body.removeChild(container);
}
