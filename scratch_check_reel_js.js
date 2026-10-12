const fs = require('fs');
const js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const terms = ['home-reel-container', 'home-reel-video', 'home-reel-video-watch-btn', 'home-reel-thumb', 'HomeReelSection', 'homeReel'];
terms.forEach(t => {
  let idx = 0;
  let count = 0;
  while ((idx = js.indexOf(t, idx)) !== -1) {
    count++;
    if (count <= 3) {
      console.log(`[${t}] at ${idx}:`);
      console.log(js.slice(Math.max(0, idx - 80), idx + 180));
    }
    idx += t.length;
  }
  console.log(`Total [${t}]: ${count}`);
});
