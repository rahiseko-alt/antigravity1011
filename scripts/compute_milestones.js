// Compute exact milestones, scrollPixel S, knot Y targets, and progress ratios
const fs = require('fs');

const mobileOffsets = {
  vw: 390,
  vh: 844,
  hypot: Math.hypot(390, 844), // 929.7505
  hero: { top: 0, bottom: 844, center: 422 },
  reel: { top: 844, bottom: 1528.6875 },
  reelTitle: { top: 1006.109375, bottom: 1084.71875, center: 1045.414 },
  reelCta: { top: 1382.4375, bottom: 1429.6875, center: 1406.0625 },
  featured: { top: 1528.6875, bottom: 3934.296875 },
  featuredTitle: { top: 1639.6875, bottom: 1671.859375, center: 1655.773 },
  // On mobile, cards are stacked vertically:
  // Card 1: 1809.3 - 2105.4 (center 1957.36)
  // Card 2: 2137.4 - 2433.5 (center 2285.48) -> Cards 1 & 2 midpoint: 2121.42
  card1_2: { top: 1809.296875, bottom: 2433.546875, center: 2121.422 },
  // Card 3: 2465.5 - 2761.7
  // Card 4: 2793.7 - 3089.8 -> Cards 3 & 4 midpoint: 2777.67
  card3_4: { top: 2465.546875, bottom: 3089.796875, center: 2777.672 },
  members: {
    top: 3934.296875,
    bottom: 6308.421875,
    center: (3934.296875 + 6308.421875) / 2, // 5121.36
    m1_2: { top: 4190.61, bottom: 5222.11, center: 4706.36 }
  },
  goal: { top: 6308.421875, bottom: 42852.96875, center: 6308.421875 + 422 } // top of goal entering center
};

const desktopOffsets = {
  vw: 1920,
  vh: 1080,
  hypot: Math.hypot(1920, 1080), // 2202.907
  hero: { top: 0, bottom: 1080, center: 540 },
  reel: { top: 1080, bottom: 1905.84375 },
  reelTitle: { top: 1249.03125, bottom: 1522.8125, center: 1385.922 },
  reelCta: { top: 1791.046875, bottom: 1855.84375, center: 1823.445 },
  featured: { top: 1905.84375, bottom: 4558.640625 },
  featuredTitle: { top: 1955.84375, bottom: 2050.890625, center: 2003.367 },
  // On desktop, Cards 1 & 2 are side-by-side: top: 2252.16, bottom: 2886.19 (center 2569.17)
  card1_2: { top: 2252.15625, bottom: 2886.1875, center: 2569.172 },
  // Cards 3 & 4 are side-by-side: top: 2966.19, bottom: 3600.22 (center 3283.20)
  card3_4: { top: 2966.1875, bottom: 3600.21875, center: 3283.203 },
  members: {
    top: 4558.640625,
    bottom: 5885.546875,
    center: (4558.640625 + 5885.546875) / 2, // 5222.09
    m1_2: { top: 4838.09, bottom: 5313.22, center: 5075.66 }
  },
  goal: { top: 5885.546875, bottom: 53651.46875, center: 5885.546875 + 540 }
};

const milestones = [
  {
    stroke: 1,
    name: 'Hero Balloons',
    desc: 'User sees Hero balloons',
    mobileY: 0, // Hero starts at S=0, balloons centered in upper-middle hero
    desktopY: 0,
    mobileS: 0,
    desktopS: 0,
    // Knot y: at S=0, centered on screen: y * hypot + 0 = -vh/2 => y = -vh/(2*hypot)
    // Or for Hero entry: knots start at y ≈ -0.05 to -0.30
  },
  {
    stroke: 2,
    name: 'Reel Headline',
    desc: 'User sees #home-reel headline',
    mobileY: mobileOffsets.reelTitle.center, // 1045.4 px
    desktopY: desktopOffsets.reelTitle.center, // 1385.9 px
    mobileS: mobileOffsets.reelTitle.center - mobileOffsets.vh / 2, // 1045.4 - 422 = 623.4
    desktopS: desktopOffsets.reelTitle.center - desktopOffsets.vh / 2, // 1385.9 - 540 = 845.9
  },
  {
    stroke: 3,
    name: 'HOW IT WORKS & Active Initiatives Header',
    desc: 'User sees "HOW IT WORKS" button and "Active Initiatives & Events" header',
    // CTA & Header midpoint
    mobileY: (mobileOffsets.reelCta.center + mobileOffsets.featuredTitle.center) / 2, // (1406.1 + 1655.8) / 2 = 1530.9
    desktopY: (desktopOffsets.reelCta.center + desktopOffsets.featuredTitle.center) / 2, // (1823.4 + 2003.4) / 2 = 1913.4
    mobileS: (mobileOffsets.reelCta.center + mobileOffsets.featuredTitle.center) / 2 - mobileOffsets.vh / 2, // 1530.9 - 422 = 1108.9
    desktopS: (desktopOffsets.reelCta.center + desktopOffsets.featuredTitle.center) / 2 - desktopOffsets.vh / 2, // 1913.4 - 540 = 1373.4
  },
  {
    stroke: 4,
    name: 'Initiatives Cards 1 & 2',
    desc: 'User sees Cards 1 & 2',
    mobileY: mobileOffsets.card1_2.center, // 2121.4 px
    desktopY: desktopOffsets.card1_2.center, // 2569.2 px
    mobileS: mobileOffsets.card1_2.center - mobileOffsets.vh / 2, // 2121.4 - 422 = 1699.4
    desktopS: desktopOffsets.card1_2.center - desktopOffsets.vh / 2, // 2569.2 - 540 = 2029.2
  },
  {
    stroke: 5,
    name: 'Initiatives Cards 3 & 4',
    desc: 'User sees Cards 3 & 4',
    mobileY: mobileOffsets.card3_4.center, // 2777.7 px
    desktopY: desktopOffsets.card3_4.center, // 3283.2 px
    mobileS: mobileOffsets.card3_4.center - mobileOffsets.vh / 2, // 2777.7 - 422 = 2355.7
    desktopS: desktopOffsets.card3_4.center - desktopOffsets.vh / 2, // 3283.2 - 540 = 2743.2
  },
  {
    stroke: 6,
    name: 'Members (Core Players)',
    desc: 'User sees Members',
    mobileY: mobileOffsets.members.center, // 5121.4 px (or m1_2: 4706 px)
    desktopY: desktopOffsets.members.center, // 5222.1 px (or m1_2: 5075 px)
    mobileS: mobileOffsets.members.center - mobileOffsets.vh / 2, // 5121.4 - 422 = 4699.4
    desktopS: desktopOffsets.members.center - desktopOffsets.vh / 2, // 5222.1 - 540 = 4682.1
  },
  {
    stroke: 6, // end of stroke 6 or goal entry
    name: 'Goal (Midpage Warp)',
    desc: 'User sees Goal',
    mobileY: mobileOffsets.goal.top, // 6308.4 px
    desktopY: desktopOffsets.goal.top, // 5885.5 px
    mobileS: mobileOffsets.goal.top - mobileOffsets.vh / 2, // 6308.4 - 422 = 5886.4
    desktopS: desktopOffsets.goal.top - desktopOffsets.vh / 2, // 5885.5 - 540 = 5345.5
  }
];

console.log('=== MATHEMATICAL SCROLL & KNOT SYNCHRONIZATION ANALYSIS ===\n');

// Progress formula:
// mobile: S / (7.2 * 844) = S / 6076.8
// desktop: S / (5.5 * 1080) = S / 5940

milestones.forEach((m, idx) => {
  const sProgressMobile = Math.min(1, Math.max(0, m.mobileS / (7.2 * 844)));
  const sProgressDesktop = Math.min(1, Math.max(0, m.desktopS / (5.5 * 1080)));
  const avgProgress = (sProgressMobile + sProgressDesktop) / 2;

  // Knot target y: y = - Y_elem / hypot
  const knotYMobile = -(m.mobileY / mobileOffsets.hypot);
  const knotYDesktop = -(m.desktopY / desktopOffsets.hypot);
  const knotYAvg = (knotYMobile + knotYDesktop) / 2;

  m.calc = {
    sProgressMobile,
    sProgressDesktop,
    avgProgress,
    knotYMobile,
    knotYDesktop,
    knotYAvg
  };

  console.log(`Milestone ${idx + 1}: ${m.name}`);
  console.log(`  Description: ${m.desc}`);
  console.log(`  Page Y center: Mobile = ${m.mobileY.toFixed(1)} px | Desktop = ${m.desktopY.toFixed(1)} px`);
  console.log(`  ScrollPixel S (element centered): Mobile = ${m.mobileS.toFixed(1)} px | Desktop = ${m.desktopS.toFixed(1)} px`);
  console.log(`  Progress ratio a(S): Mobile = ${sProgressMobile.toFixed(3)} | Desktop = ${sProgressDesktop.toFixed(3)} | Avg = ${avgProgress.toFixed(3)}`);
  console.log(`  Knot Y target (-Y/hypot): Mobile = ${knotYMobile.toFixed(3)} | Desktop = ${knotYDesktop.toFixed(3)} | Avg = ${knotYAvg.toFixed(3)}`);
  console.log('');
});
