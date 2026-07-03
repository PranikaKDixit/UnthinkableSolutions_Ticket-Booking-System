// Stages a ready-to-demo waitlist scenario on the LIVE backend:
//   - a small "intimate" show, fully booked by Aarav (so it's SOLD OUT)
//   - Diya already sitting on the waitlist
// Then the recruiter's single action — cancel Aarav's booking — fires the
// time-limited offer email to Diya. Run: node demo-waitlist.mjs
const B = process.env.API || 'https://cineseat-by08.onrender.com';
function jar() { return { cookie: '' }; }
async function req(j, method, path, body) {
  const res = await fetch(B + path, {
    method, headers: { 'Content-Type': 'application/json', ...(j.cookie ? { cookie: j.cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setc = res.headers.get('set-cookie'); if (setc) j.cookie = setc.split(';')[0];
  let data; try { data = await res.json(); } catch { data = null; } return { status: res.status, data };
}
async function getOrCreateVenue(a, name, address) {
  const list = (await req(a, 'GET', '/venues')).data.venues || [];
  return list.find((v) => v.name === name) || (await req(a, 'POST', '/venues', { name, address })).data.venue;
}
async function getOrCreateCategory(a, vid, c) {
  const list = (await req(a, 'GET', `/venues/${vid}/categories`)).data.categories || [];
  return list.find((x) => x.name === c.name) || (await req(a, 'POST', `/venues/${vid}/categories`, c)).data.category;
}

const admin = jar(), organiser = jar(), aarav = jar(), diya = jar();
await req(admin, 'POST', '/auth/login', { email: 'admin@ticketing.com', password: 'admin123' });
await req(organiser, 'POST', '/auth/login', { email: 'organiser@cineseat.com', password: 'demo1234' });
await req(aarav, 'POST', '/auth/login', { email: 'aarav@example.com', password: 'demo1234' });
await req(diya, 'POST', '/auth/login', { email: 'diya@example.com', password: 'demo1234' });

// Intimate venue + one category + 4 seats (row A, 1-4)
const v = await getOrCreateVenue(admin, 'The Screening Room (Intimate)', 'Khan Market, New Delhi');
const cat = await getOrCreateCategory(admin, v.id, { name: 'Lounge', rank: 1, color: '#f6c453' });
await req(admin, 'POST', `/venues/${v.id}/seats`, { categoryId: cat.id, rows: ['A'], seatsPerRow: 4 });

// Event + a single show (only create if it doesn't exist yet)
const events = (await req(organiser, 'GET', '/events')).data.events || [];
let ev = events.find((e) => e.title === 'Sneak Preview: Tenet');
if (!ev) ev = (await req(organiser, 'POST', '/events', { venueId: v.id, type: 'MOVIE', title: 'Sneak Preview: Tenet', description: 'Members-only early screening — limited seats.' })).data.event;
const full = (await req(organiser, 'GET', `/events/${ev.id}`)).data.event;
let showId = full.shows?.[0]?.id;
if (!showId) showId = (await req(organiser, 'POST', '/shows', { eventId: ev.id, startsAt: '2026-07-25T20:00:00Z', pricing: [{ categoryId: cat.id, price: 900 }] })).data.show.id;

// Current seat state
let seats = (await req(aarav, 'GET', `/shows/${showId}/seats`)).data.seats;
const available = seats.filter((s) => s.status === 'AVAILABLE').map((s) => s.id);

if (available.length > 0) {
  // Aarav holds + books every remaining seat -> SOLD OUT
  await req(aarav, 'POST', `/shows/${showId}/hold`, { seatIds: available });
  const bk = await req(aarav, 'POST', '/bookings', { showId, seatIds: available });
  console.log(`Aarav booked ${available.length} seat(s): ${bk.data.booking?.reference}`);
} else {
  console.log('Show already sold out — leaving existing bookings in place.');
}

// Diya joins the waitlist (idempotent)
const w = await req(diya, 'POST', `/shows/${showId}/waitlist`, { categoryId: cat.id });
console.log(`Diya waitlist: status=${w.data.entry?.status} position=${w.data.entry?.position}`);

const map = (await req(aarav, 'GET', `/shows/${showId}/seats`)).data.seats;
const sold = map.every((s) => s.status !== 'AVAILABLE');
console.log(`\nShow "Sneak Preview: Tenet" is now ${sold ? 'SOLD OUT ✅' : 'NOT sold out ❌'} (${map.length} seats).`);
console.log('Recruiter demo: log in as Aarav → My Bookings → cancel → Diya gets the offer email.');
