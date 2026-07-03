// Populates the LIVE deployed backend with a demo catalogue via its public API.
// Safe to re-run: venues/categories are reused, seats de-dupe, accounts log in
// if they already exist. Run: node demo-seed.mjs
const B = process.env.API || 'https://cineseat-by08.onrender.com';

function jar() { return { cookie: '' }; }
async function req(j, method, path, body) {
  const res = await fetch(B + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(j.cookie ? { cookie: j.cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setc = res.headers.get('set-cookie');
  if (setc) j.cookie = setc.split(';')[0];
  let data; try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}
async function registerOrLogin(j, name, email, password, role) {
  const r = await req(j, 'POST', '/auth/register', { name, email, password, role });
  if (r.status === 201) return 'registered';
  await req(j, 'POST', '/auth/login', { email, password });
  return 'existing';
}
async function getOrCreateVenue(admin, name, address) {
  const list = (await req(admin, 'GET', '/venues')).data.venues || [];
  const found = list.find((v) => v.name === name);
  if (found) return found;
  return (await req(admin, 'POST', '/venues', { name, address })).data.venue;
}
async function getOrCreateCategory(admin, venueId, c) {
  const list = (await req(admin, 'GET', `/venues/${venueId}/categories`)).data.categories || [];
  const found = list.find((x) => x.name === c.name);
  if (found) return found;
  return (await req(admin, 'POST', `/venues/${venueId}/categories`, c)).data.category;
}

const admin = jar(), organiser = jar();

console.log('Logging in accounts…');
await req(admin, 'POST', '/auth/login', { email: 'admin@ticketing.com', password: 'admin123' });
await registerOrLogin(organiser, 'Priya Menon (Organiser)', 'organiser@cineseat.com', 'demo1234', 'ORGANISER');
// Customer accounts (created so the recruiter has ready logins)
const c1 = jar(), c2 = jar();
await registerOrLogin(c1, 'Aarav Sharma', 'aarav@example.com', 'demo1234', 'CUSTOMER');
await registerOrLogin(c2, 'Diya Patel', 'diya@example.com', 'demo1234', 'CUSTOMER');

/* ---------------- Venue 1: cinema ---------------- */
console.log('Building venue: PVR IMAX Orion…');
const v1 = await getOrCreateVenue(admin, 'PVR IMAX Orion', 'Orion Mall, Brigade Gateway, Bengaluru');
const recliner = await getOrCreateCategory(admin, v1.id, { name: 'Recliner', rank: 1, color: '#f6c453' });
const premium1 = await getOrCreateCategory(admin, v1.id, { name: 'Premium', rank: 2, color: '#8b5cf6' });
const standard1 = await getOrCreateCategory(admin, v1.id, { name: 'Standard', rank: 3, color: '#38bdf8' });
await req(admin, 'POST', `/venues/${v1.id}/seats`, { categoryId: recliner.id, rows: ['A', 'B'], seatsPerRow: 8 });
await req(admin, 'POST', `/venues/${v1.id}/seats`, { categoryId: premium1.id, rows: ['C', 'D', 'E'], seatsPerRow: 12 });
await req(admin, 'POST', `/venues/${v1.id}/seats`, { categoryId: standard1.id, rows: ['F', 'G', 'H', 'J'], seatsPerRow: 14 });

/* ---------------- Venue 2: concert ground ---------------- */
console.log('Building venue: Jio World Garden…');
const v2 = await getOrCreateVenue(admin, 'Jio World Garden', 'BKC, Mumbai');
const vip = await getOrCreateCategory(admin, v2.id, { name: 'VIP', rank: 1, color: '#f6c453' });
const gold = await getOrCreateCategory(admin, v2.id, { name: 'Gold', rank: 2, color: '#fb7185' });
const silver = await getOrCreateCategory(admin, v2.id, { name: 'Silver', rank: 3, color: '#94a3b8' });
await req(admin, 'POST', `/venues/${v2.id}/seats`, { categoryId: vip.id, rows: ['A', 'B'], seatsPerRow: 10 });
await req(admin, 'POST', `/venues/${v2.id}/seats`, { categoryId: gold.id, rows: ['C', 'D', 'E'], seatsPerRow: 16 });
await req(admin, 'POST', `/venues/${v2.id}/seats`, { categoryId: silver.id, rows: ['F', 'G', 'H', 'I', 'J'], seatsPerRow: 20 });

/* ---------------- Events + shows ---------------- */
const moviePricing = [
  { categoryId: recliner.id, price: 700 },
  { categoryId: premium1.id, price: 450 },
  { categoryId: standard1.id, price: 250 },
];
const concertPricing = [
  { categoryId: vip.id, price: 12000 },
  { categoryId: gold.id, price: 6000 },
  { categoryId: silver.id, price: 3000 },
];

const catalogue = [
  { venue: v1, type: 'MOVIE', title: 'Interstellar (IMAX Re-release)', description: 'Nolan’s space epic, back on the biggest screen.', pricing: moviePricing, shows: ['2026-07-12T18:30:00Z', '2026-07-13T21:00:00Z', '2026-07-19T17:00:00Z'] },
  { venue: v1, type: 'MOVIE', title: 'Dune: Part Two', description: 'Paul Atreides unites with the Fremen.', pricing: moviePricing, shows: ['2026-07-12T20:00:00Z', '2026-07-20T19:30:00Z'] },
  { venue: v1, type: 'MOVIE', title: 'Oppenheimer', description: 'The man behind the atomic bomb.', pricing: moviePricing, shows: ['2026-07-15T18:00:00Z', '2026-07-22T21:15:00Z'] },
  { venue: v1, type: 'MOVIE', title: 'Spirited Away', description: 'Studio Ghibli classic — one night only.', pricing: moviePricing, shows: ['2026-07-18T16:30:00Z'] },
  { venue: v2, type: 'CONCERT', title: 'Coldplay: Music of the Spheres', description: 'The record-breaking world tour lands in Mumbai.', pricing: concertPricing, shows: ['2026-08-01T19:00:00Z', '2026-08-02T19:00:00Z'] },
  { venue: v2, type: 'CONCERT', title: 'Arijit Singh Live', description: 'An evening of soulful melodies.', pricing: concertPricing, shows: ['2026-08-09T19:30:00Z', '2026-08-10T19:30:00Z'] },
  { venue: v2, type: 'CONCERT', title: 'Diljit Dosanjh: Dil-Luminati', description: 'The biggest Punjabi tour, live.', pricing: concertPricing, shows: ['2026-08-16T20:00:00Z'] },
];

console.log('Creating events + shows…');
const existing = (await req(organiser, 'GET', '/events')).data.events || [];
const existingTitles = new Set(existing.map((e) => e.title));
let createdEvents = 0, createdShows = 0;

for (const item of catalogue) {
  if (existingTitles.has(item.title)) { console.log('  skip (exists):', item.title); continue; }
  const ev = (await req(organiser, 'POST', '/events', {
    venueId: item.venue.id, type: item.type, title: item.title, description: item.description,
  })).data.event;
  createdEvents++;
  for (const startsAt of item.shows) {
    const r = await req(organiser, 'POST', '/shows', { eventId: ev.id, startsAt, pricing: item.pricing });
    if (r.status === 201) createdShows++;
    else console.log('    show failed:', item.title, startsAt, JSON.stringify(r.data));
  }
  console.log(`  + ${item.type}: ${item.title} (${item.shows.length} shows)`);
}

console.log(`\nDone. Created ${createdEvents} events, ${createdShows} shows.`);
console.log('\n==== DEMO LOGINS ====');
console.log('ADMIN     : admin@ticketing.com   / admin123');
console.log('ORGANISER : organiser@cineseat.com / demo1234');
console.log('CUSTOMER 1: aarav@example.com      / demo1234');
console.log('CUSTOMER 2: diya@example.com       / demo1234');
