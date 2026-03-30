const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://wvplmqmqlnftlpyrqnle.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGxtcW1xbG5mdGxweXJxbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDgyMDIsImV4cCI6MjA4OTc4NDIwMn0.r5GLgPk-xywtkQdrmTAFcKZny1-Wrh8b5YezAHmU9yU'
);
async function insert() {
  const { data, error } = await sb.from('listings').insert({
    name: 'Waialua Sugar Mill Donation Drop-Off & Distribution',
    type: 'donation_dropoff',
    status: true,
    address: '67-106 Kealohanui St, Waialua, HI 96791',
    location: 'Waialua',
    lat: 21.5766,
    lng: -158.1311,
    hours: 'Starting 10:00 AM · Mar 24 · Until further notice',
    website: 'https://tinyurl.com/oahustormsupport',
    items: [
      'ACCEPTING:Rainboots','ACCEPTING:Tarps','ACCEPTING:Squeegees',
      'ACCEPTING:Rakes & shovels','ACCEPTING:Brooms & mops','ACCEPTING:Gloves',
      'ACCEPTING:Bleach & Clorox wipes','ACCEPTING:Trash bags','ACCEPTING:Duck tape',
      'ACCEPTING:Waterproof bins','ACCEPTING:Ziplock bags','ACCEPTING:Hygiene items',
      'ACCEPTING:Towels','ACCEPTING:Feminine hygiene products','ACCEPTING:Diapers',
      'ACCEPTING:Baby wipes','ACCEPTING:Toiletry kits','ACCEPTING:Thermometers',
      'ACCEPTING:Bandages','ACCEPTING:First aid materials','ACCEPTING:Mosquito coils',
      'ACCEPTING:Mosquito zappers','ACCEPTING:Safety glasses','ACCEPTING:Eye wash',
      'ACCEPTING:Portable battery banks','ACCEPTING:Butane','ACCEPTING:Charcoal',
      'ACCEPTING:Propane tanks','ACCEPTING:Batteries','ACCEPTING:Portable solar chargers',
      'ACCEPTING:Flashlights',
      'Gloves','Bleach','Clorox wipes','Trash bags','Hygiene items','Towels',
      'Feminine hygiene products','Diapers','Baby wipes','Toiletry kits','Bandages',
      'First aid materials','Safety glasses','Eye wash','Portable battery banks',
      'Butane','Charcoal','Propane tanks','Batteries','Portable solar chargers','Flashlights'
    ],
    notes: 'As of 3/24 7am. Please carpool. Items on hand may vary — call ahead to confirm.',
    accepting_dropoffs: true,
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    user_id: '04e3776b-b75f-4701-888e-511a9cf21382'
  }).select();
  if (error) console.error('Error:', error.message);
  else console.log('Listing created! ID:', data[0].id);
}
insert();
