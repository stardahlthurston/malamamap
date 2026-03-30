const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://wvplmqmqlnftlpyrqnle.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGxtcW1xbG5mdGxweXJxbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDgyMDIsImV4cCI6MjA4OTc4NDIwMn0.r5GLgPk-xywtkQdrmTAFcKZny1-Wrh8b5YezAHmU9yU'
);

const YOUR_USER_ID = '04e3776b-b75f-4701-888e-511a9cf21382';

async function run() {
  const { data, error } = await sb.from('listings').insert({
    name: 'Storm Kōkua',
    type: 'financial_giving',
    status: true,
    location: 'Org',
    website: 'https://www.gofundme.com/f/2026-flood-relief-fund',
    notes: 'A statewide direct-relief initiative connecting donors with families impacted by the 2025 Kona Low storms. Operating under Help Maui Rise, Storm Kōkua uses a direct-to-family model — donations go straight to displaced families on Oʻahu, Maui, Hawaiʻi Island, and Molokaʻi.',
    verified: false,
    user_id: YOUR_USER_ID
  }).select();

  if (error) {
    console.error('ERROR:', error.message);
  } else {
    console.log(`CREATED: "${data[0].name}" — ID: ${data[0].id}`);
  }
}

run();
