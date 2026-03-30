const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://wvplmqmqlnftlpyrqnle.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGxtcW1xbG5mdGxweXJxbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDgyMDIsImV4cCI6MjA4OTc4NDIwMn0.r5GLgPk-xywtkQdrmTAFcKZny1-Wrh8b5YezAHmU9yU'
);

const YOUR_USER_ID = '04e3776b-b75f-4701-888e-511a9cf21382';

const newListings = [
  {
    name: 'Waialua Wash N Go — Free Laundry Day',
    type: 'volunteer_event',
    status: true,
    address: '67-292 Goodale Ave #109, Waialua, HI 96791',
    location: 'Waialua',
    lat: 21.5752,
    lng: -158.1283,
    hours: 'Mar 26 · 11:30 AM · Until supplies last',
    items: [
      'GIVING:Free washing & drying',
      'GIVING:Detergent',
      'GIVING:Fabric softener'
    ],
    notes: 'Donated by @olays_thai_lao_cuisine. One-time event.',
    event_date: '2026-03-26',
    expires_at: new Date('2026-03-27T23:59:59').toISOString(),
    user_id: YOUR_USER_ID
  },
  {
    name: 'Hawaiʻi Polo Club — Volunteer Supply Distribution',
    type: 'volunteer_event',
    types: ['volunteer_event', 'supply_station'],
    status: true,
    address: '68-411 Farrington Hwy, Waialua, HI 96791',
    location: 'Waialua',
    lat: 21.5670,
    lng: -158.1495,
    hours: 'Mar 26 · 9:00 AM – 4:00 PM',
    items: [
      'GIVING:Bottled water',
      'GIVING:Non-perishable food',
      'GIVING:Supplies'
    ],
    notes: 'Need volunteers. Contact @sirimasterson on Instagram.',
    volunteer_needs: 'General volunteers needed for supply distribution',
    event_date: '2026-03-26',
    expires_at: new Date('2026-03-27T23:59:59').toISOString(),
    user_id: YOUR_USER_ID
  },
  {
    name: 'Waialua Moku Cleaning Supply Drive — UH Kakaʻako',
    type: 'donation_dropoff',
    status: true,
    address: '651 Ilalo St, Honolulu, HI 96813',
    location: 'Kakaʻako',
    lat: 21.2942,
    lng: -157.8597,
    hours: 'Times unknown — check @uhmedjabsom on Instagram',
    items: [
      'ACCEPTING:5-gallon buckets',
      'ACCEPTING:Heavy duty rubber gloves',
      'ACCEPTING:Heavy duty trash bags',
      'ACCEPTING:Stiff-bristle scrubbing brushes',
      'ACCEPTING:Large sponges',
      'ACCEPTING:Dish soap',
      'ACCEPTING:Commercial mold inhibitors',
      'ACCEPTING:Microfiber towels',
      'ACCEPTING:Bleach',
      'ACCEPTING:Mops',
      'ACCEPTING:Squeegees'
    ],
    notes: 'Collecting for Waialua Moku community. Contact @uhmedjabsom.',
    accepting_dropoffs: true,
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    user_id: YOUR_USER_ID
  },
  {
    name: 'KSK Athletics — Kamehameha Schools Kapālama Donation Drive',
    type: 'donation_dropoff',
    status: true,
    address: 'Kamehameha Schools Kapālama Campus, KOAI\'A Athletics Bldg, Honolulu, HI 96817',
    location: 'Nuʻuanu / Pauoa / Liliha',
    lat: 21.3340,
    lng: -157.8700,
    hours: 'Mar 27 · 8:00 AM – 5:00 PM',
    items: [
      'ACCEPTING:Bottled water','ACCEPTING:Canned juice','ACCEPTING:Clorox wipes',
      'ACCEPTING:Brooms','ACCEPTING:Trash bags','ACCEPTING:Toothpaste',
      'ACCEPTING:Toothbrush','ACCEPTING:Toilet paper','ACCEPTING:Wipes',
      'ACCEPTING:Tarps','ACCEPTING:Duck tape','ACCEPTING:Rakes',
      'ACCEPTING:Mops','ACCEPTING:Diapers','ACCEPTING:Baby shampoo',
      'ACCEPTING:Bandaids','ACCEPTING:Gauze','ACCEPTING:Storage bins',
      'ACCEPTING:Sharpies','ACCEPTING:Towels','ACCEPTING:Ziplock bags',
      'ACCEPTING:Mosquito coils','ACCEPTING:Rubbing alcohol',
      'ACCEPTING:Hydrogen peroxide','ACCEPTING:Razors','ACCEPTING:Deodorant',
      'ACCEPTING:Shampoo','ACCEPTING:Bodywash','ACCEPTING:Feminine hygiene',
      'ACCEPTING:Paper towels','ACCEPTING:Pull ups','ACCEPTING:Sleeping bags'
    ],
    notes: 'One-time event. Drop off at KOAI\'A Athletics Building.',
    accepting_dropoffs: true,
    event_date: '2026-03-27',
    expires_at: new Date('2026-03-28T23:59:59').toISOString(),
    user_id: YOUR_USER_ID
  },
  {
    name: 'Waialua Community Association Distribution Center',
    type: 'supply_station',
    types: ['supply_station', 'donation_dropoff'],
    status: true,
    address: 'Waialua — exact address to be confirmed',
    location: 'Waialua',
    lat: 21.5766,
    lng: -158.1311,
    hours: 'Until further notice — times unknown',
    items: [
      'GIVING:Bottled water','GIVING:Non-perishable food','GIVING:Baby items',
      'GIVING:Tyveks','GIVING:Blankets','GIVING:Cleaning supplies',
      'GIVING:Shovels','GIVING:Trash bags','GIVING:BWS water truck 24hrs'
    ],
    notes: 'Food bank coming Thursday. Emergency Management scheduled Thursday. Staging area for cleanup crews.',
    accepting_dropoffs: true,
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    user_id: YOUR_USER_ID
  }
];

async function run() {
  // Insert new listings
  for (const listing of newListings) {
    const { data, error } = await sb.from('listings').insert(listing).select();
    if (error) {
      console.error(`ERROR inserting "${listing.name}":`, error.message);
    } else {
      console.log(`CREATED: "${listing.name}" — ID: ${data[0].id}`);
    }
  }

  // Find and update "The House Established"
  console.log('\n--- Searching for "The House Established" ---');
  const { data: found, error: findErr } = await sb.from('listings')
    .select('id, name, address, items, hours')
    .or('name.ilike.%house established%,name.ilike.%house%koko%,address.ilike.%koko marina%,address.ilike.%7192%');

  if (findErr) {
    console.error('Search error:', findErr.message);
  } else if (!found || found.length === 0) {
    console.log('NOT FOUND — "The House Established" does not exist yet. Creating it...');
    const { data: newData, error: newErr } = await sb.from('listings').insert({
      name: 'The House Established — Koko Marina',
      type: 'donation_dropoff',
      status: true,
      address: '7192 Kalanianaʻole Hwy 2nd Floor, Honolulu, HI 96825',
      location: 'Hawaiʻi Kai',
      lat: 21.2789,
      lng: -157.7070,
      hours: 'Every day · 9:00 AM – 9:00 PM',
      items: [
        'ACCEPTING:Buckets','ACCEPTING:Shovels','ACCEPTING:Gloves',
        'ACCEPTING:Brooms','ACCEPTING:Bleach','ACCEPTING:Mops',
        'ACCEPTING:Clorox spray','ACCEPTING:Contractor trash bags',
        'ACCEPTING:Bug spray','ACCEPTING:Laundry pods','ACCEPTING:N95 masks',
        'ACCEPTING:Tarps','ACCEPTING:Towels','ACCEPTING:Slippers',
        'ACCEPTING:White vinegar','ACCEPTING:Nylon rope','ACCEPTING:Scrub brushes',
        'ACCEPTING:Magic erasers','ACCEPTING:Batteries','ACCEPTING:Bottled water',
        'ACCEPTING:Pet food','ACCEPTING:Stackable storage bins'
      ],
      notes: '2nd floor above Hanapa\'a Market. Keep donations within listed items only.',
      accepting_dropoffs: true,
      expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      user_id: YOUR_USER_ID
    }).select();
    if (newErr) console.error('Create error:', newErr.message);
    else console.log(`CREATED: "The House Established" — ID: ${newData[0].id}`);
  } else {
    console.log('FOUND:', found);
    const id = found[0].id;
    const { error: upErr } = await sb.from('listings').update({
      hours: 'Every day · 9:00 AM – 9:00 PM',
      items: [
        'ACCEPTING:Buckets','ACCEPTING:Shovels','ACCEPTING:Gloves',
        'ACCEPTING:Brooms','ACCEPTING:Bleach','ACCEPTING:Mops',
        'ACCEPTING:Clorox spray','ACCEPTING:Contractor trash bags',
        'ACCEPTING:Bug spray','ACCEPTING:Laundry pods','ACCEPTING:N95 masks',
        'ACCEPTING:Tarps','ACCEPTING:Towels','ACCEPTING:Slippers',
        'ACCEPTING:White vinegar','ACCEPTING:Nylon rope','ACCEPTING:Scrub brushes',
        'ACCEPTING:Magic erasers','ACCEPTING:Batteries','ACCEPTING:Bottled water',
        'ACCEPTING:Pet food','ACCEPTING:Stackable storage bins'
      ],
      notes: '2nd floor above Hanapa\'a Market. Keep donations within listed items only.',
      accepting_dropoffs: true
    }).eq('id', id);
    if (upErr) console.error('Update error:', upErr.message);
    else console.log(`UPDATED: "${found[0].name}" (ID: ${id})`);
  }
}

run();
