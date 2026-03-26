// ── Share Card Generator ──
// Generates a 1080x1920 share image for any listing, with native share + download fallback

const SHARE_TYPE_LABELS = {
  shelter:'🏠 Shelter', supply_station:'🛖 Supply Station',
  donation_dropoff:'📦 Donation Drop-off', volunteer_event:'🙋 Volunteer Needed',
  skills_labor:'🔧 Skills & Labor', medical_assistance:'🏥 Medical Aid'
};

function buildShareCardHTML(l) {
  const items = (l.items||[]).filter(i=>!i.startsWith('ACCEPTING:')).map(i=>i.replace('GIVING:','')).slice(0,6);
  const accepting = (l.items||[]).filter(i=>i.startsWith('ACCEPTING:')).slice(0,5).map(i=>i.replace('ACCEPTING:',''));
  const types = (l.type||'').split(',').filter(Boolean);
  const typePills = types.map(t => {
    const isGold = t==='donation_dropoff';
    const bg = isGold ? 'rgba(201,152,58,0.25)' : 'rgba(77,184,212,0.25)';
    const color = isGold ? '#f5d48a' : '#a8e8f5';
    const border = isGold ? 'rgba(201,152,58,0.3)' : 'rgba(77,184,212,0.3)';
    return '<span style="background:'+bg+';color:'+color+';border-radius:100px;padding:8px 20px;font-size:14px;font-weight:800;border:1.5px solid '+border+';">'+(SHARE_TYPE_LABELS[t]||t)+'</span>';
  }).join('');
  const offerPills = items.map(i =>
    '<span style="background:#e3f4f7;color:#0d4d5a;border-radius:100px;padding:7px 18px;font-size:16px;font-weight:700;">'+i+'</span>'
  ).join('') + (items.length >= 6 ? '<span style="background:#e3f4f7;color:#0d4d5a;border-radius:100px;padding:7px 18px;font-size:16px;font-weight:700;">+ more</span>' : '');
  const acceptPills = accepting.map(i =>
    '<span style="background:#fdf4e3;color:#7a5c1a;border-radius:100px;padding:7px 18px;font-size:16px;font-weight:700;">'+i+'</span>'
  ).join('') + (accepting.length >= 5 ? '<span style="background:#fdf4e3;color:#7a5c1a;border-radius:100px;padding:7px 18px;font-size:16px;font-weight:700;">& more</span>' : '');
  let hoursDisplay = l.hours || '';
  hoursDisplay = hoursDisplay.replace(' · Until further notice','').replace('Until further notice','').trim();
  if (hoursDisplay.endsWith('·')) hoursDisplay = hoursDisplay.slice(0,-1).trim();

  return '<div style="width:1080px;height:1920px;background:#0d2a3d;font-family:Nunito,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 70px;">'
    + '<p style="color:rgba(255,255,255,0.35);font-size:26px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 40px;">MĀLAMA MAP</p>'
    + '<div style="width:100%;background:white;border-radius:56px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.4);">'
    + '<div style="background:linear-gradient(160deg,#0d2f3f,#1a3a5c);padding:60px 70px 50px;text-align:center;">'
    + '<svg width="44" height="54" viewBox="0 0 28 34" fill="none" style="display:block;margin:0 auto 20px;"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 20 14 20S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#4db8d4"/><circle cx="14" cy="14" r="5.5" fill="white"/></svg>'
    + '<p style="color:white;font-size:52px;font-weight:800;margin:0 0 28px;line-height:1.2;">'+(l.location||'')+(l.location&&l.address?' · ':'')+((l.address||'').split(',')[1]||'')+'</p>'
    + '<div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:30px;">'+typePills+'</div>'
    + '<h1 style="color:white;font-size:64px;font-weight:800;margin:0;line-height:1.2;">'+(l.name||'')+'</h1>'
    + '</div>'
    + '<div style="padding:50px 70px;border-bottom:2px solid #f0ede8;background:white;">'
    + (l.address ? '<div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:32px;"><span style="background:#e3f4f7;color:#0d4d66;border-radius:100px;padding:10px 28px;font-size:24px;font-weight:800;white-space:nowrap;flex-shrink:0;">ADDRESS</span><p style="font-size:38px;font-weight:700;color:#1a1a1a;margin:0;line-height:1.4;">'+l.address.replace(', USA','')+'</p></div>' : '')
    + (hoursDisplay ? '<div style="display:flex;align-items:center;gap:20px;"><span style="background:#e3f4f7;color:#0d4d66;border-radius:100px;padding:10px 28px;font-size:24px;font-weight:800;white-space:nowrap;flex-shrink:0;">HOURS</span><p style="font-size:38px;font-weight:700;color:#1a1a1a;margin:0;">'+hoursDisplay+'</p></div>' : '')
    + '</div>'
    + (items.length ? '<div style="padding:46px 70px;border-bottom:'+(accepting.length?'2px solid #f0ede8':'none')+';background:white;"><p style="font-size:22px;font-weight:800;color:#0d6678;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 22px;">Available now</p><div style="display:flex;flex-wrap:wrap;gap:12px;">'+offerPills+'</div></div>' : '')
    + (accepting.length ? '<div style="padding:46px 70px;background:white;"><p style="font-size:22px;font-weight:800;color:#8a6020;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 22px;">Accepting donations</p><div style="display:flex;flex-wrap:wrap;gap:12px;">'+acceptPills+'</div></div>' : '')
    + '<div style="background:linear-gradient(135deg,#0d2f3f,#1a3a5c);padding:50px 70px;text-align:center;">'
    + '<p style="color:rgba(255,255,255,0.5);font-size:22px;font-weight:600;margin:0 0 20px;letter-spacing:0.1em;text-transform:uppercase;">Find more resources at</p>'
    + '<div style="background:white;border-radius:22px;padding:22px 60px;display:inline-block;"><p style="color:#0d2a3d;font-size:48px;font-weight:800;margin:0;">malamamap.org</p></div>'
    + '</div></div>'
    + '<p style="color:rgba(255,255,255,0.2);font-size:22px;margin:30px 0 0;letter-spacing:0.08em;">Hawaiʻi helping Hawaiʻi</p>'
    + '</div>';
}

async function shareListingCard(listing) {
  // Create offscreen container
  const container = document.createElement('div');
  container.id = 'shareCardOffscreen';
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;height:1920px;z-index:9999;';
  container.innerHTML = buildShareCardHTML(listing);
  document.body.appendChild(container);

  await new Promise(r => setTimeout(r, 300));

  try {
    const canvas = await html2canvas(container, {
      width: 1080, height: 1920, scale: 1,
      useCORS: true, backgroundColor: '#0d2a3d', logging: false
    });

    const safeName = (listing.name||'listing').replace(/[^a-z0-9]/gi,'_').slice(0,40);
    const shareText = (listing.name || '') + '\n'
      + (listing.address ? '📍 ' + listing.address.replace(', USA','') + '\n' : '')
      + (listing.hours ? '🕐 ' + listing.hours.replace(' · Until further notice','') + '\n' : '')
      + '\nFind more resources → malamamap.org';

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'MalamaMap_' + safeName + '.png', { type: 'image/png' });

      // Try native share with image (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: listing.name + ' — Mālama Map', text: shareText });
          return;
        } catch(e) { if (e.name === 'AbortError') return; }
      }

      // Fallback: download the image
      const link = document.createElement('a');
      link.download = 'MalamaMap_' + safeName + '.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  } catch(e) {
    // Final fallback: copy link
    const url = 'https://malamamap.org/malama-listing.html?id=' + listing.id;
    navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
  }

  document.body.removeChild(container);
}
