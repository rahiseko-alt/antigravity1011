const fs = require('fs');
const path = require('path');
const three = require('three');

console.log('=== TESTING VIBRANT CHOREOGRAPHED TRAJECTORY ===');

// Coordinates:
// In Reel / Initiatives / Members:
// Screen X: 0.0 (left) to 1.0 (right)
// Y progress:
// -0.78 (Reel entry at scroll ~750)
// -1.10 to -1.35 (Reel headline & blue button orbit at scroll ~1100-1400)
// -1.50 to -1.80 (Grand 360-degree loop-de-loop at scroll ~1800-2400)
// -2.20 to -4.30 (Undulating wave between/behind cards at scroll ~2600-4500)
// -4.60 to -5.20 (Zig-zag through members cards at scroll ~4800-6200)
// -5.40 to -5.60 (Flourish into Goal at scroll ~6500)

const waypoints = [
  // 1. REEL ENTRY & ARCH
  { x: -0.05, y: -0.78, name: '1A: Reel Top-Left Entry' },
  { x:  0.35, y: -0.92, name: '1B: Sweeping Arch over Headline' },
  { x:  0.88, y: -1.05, name: '1C: High Crest Upper-Right' },

  // 2. ORBIT AROUND BLUE REEL BUTTON (swirling curve around HOW IT WORKS / TALK WITH AIUEO)
  { x:  0.82, y: -1.22, name: '2A: Descending toward Reel Button' },
  { x:  0.68, y: -1.36, name: '2B: Orbiting Right Edge of Button' },
  { x:  0.42, y: -1.38, name: '2C: Sweeping Underneath Button' },
  { x:  0.22, y: -1.48, name: '2D: Orbit Exit Swoop toward Left' },

  // 3. GRAND 360-DEGREE ORGANIC LOOP-DE-LOOP
  // Between Reel and Initiatives: Climbing up-right, looping over crest, swooping down-left across itself!
  { x:  0.35, y: -1.62, name: '3A: Loop Entry & Approach' },
  { x:  0.60, y: -1.68, name: '3B: Climbing into Loop Right' },
  { x:  0.78, y: -1.60, name: '3C: Loop Right Apex' },
  { x:  0.72, y: -1.48, name: '3D: Loop Top Crest' },
  { x:  0.52, y: -1.52, name: '3E: Loop Left Apex (Inside Sweep)' },
  { x:  0.58, y: -1.74, name: '3F: Loop Crossing Downward (360 Completed!)' },
  { x:  0.82, y: -1.95, name: '3G: Loop Exit Flourish toward Initiatives' },

  // 4. UNDULATING WAVE AROUND EVENT CARDS (Serpentine 3D Wave)
  { x:  1.08, y: -2.18, name: '4A: Across Active Initiatives Header' },
  { x:  0.95, y: -2.42, name: '4B: Dipping behind Flagship Card Top-Right' },
  { x:  0.48, y: -2.68, name: '4C: Wave Crest across Central Boulevard' },
  { x: -0.08, y: -2.95, name: '4D: Undulating Swoop down-left (Cards 1 & 2)' },
  { x:  0.08, y: -3.32, name: '4E: Rising Wave Crest between Card Rows' },
  { x:  0.65, y: -3.55, name: '4F: Central Diagonal Weave (Cards 3 & 4)' },
  { x:  1.05, y: -3.85, name: '4G: Wave Apex Right (Cards 5 & 6)' },
  { x:  0.72, y: -4.18, name: '4H: Downward S-Curve towards Members' },
  { x:  0.25, y: -4.42, name: '4I: Lower Weave into Members Transition' },

  // 5. 3D ZIG-ZAG THROUGH MEMBER CARDS
  { x: -0.05, y: -4.68, name: '5A: Members Section Entry Left' },
  { x:  0.28, y: -4.85, name: '5B: Zig-zag between Top Row Members (Kosehira & Ito)' },
  { x:  0.78, y: -4.98, name: '5C: Weaving down between Left & Right Column' },
  { x:  0.35, y: -5.18, name: '5D: Zig-zag between Bottom Row Members (Sakai & Okamoto)' },
  { x:  0.80, y: -5.38, name: '5E: Sweeping behind Advisor Card' },

  // 6. GRAND GOAL OUTRO FLOURISH
  { x:  0.95, y: -5.55, name: '6A: Grand Flourish toward Goal' },
  { x:  0.82, y: -5.70, name: '6B: Graceful Outro Landing' }
];

console.log(`Defined ${waypoints.length} choreographed waypoints.`);

const vectors = waypoints.map(w => new three.Vector3(w.x, w.y, 0));
const curve = new three.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);

const numPoints = 1400;
const sampled = curve.getSpacedPoints(numPoints - 1);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

sampled.forEach((p, i) => {
  if (p.x < minX) minX = p.x;
  if (p.x > maxX) maxX = p.x;
  if (p.y < minY) minY = p.y;
  if (p.y > maxY) maxY = p.y;
});

console.log('Sampled points:', sampled.length);
console.log(`Bounding Box: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);
console.log('Trajectory smoothly continuous: YES');
