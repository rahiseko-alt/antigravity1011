const fs = require('fs');

const oldCss = `#home-goal-tunnel-title{position:relative;left:0;width:100%;grid-column:1 / span 12;height:0;text-align:center;font-size:6vw;color:var(--color-white);text-transform:uppercase}@media (max-width: 812px){#home-goal-tunnel-title{top:0;grid-column:1 / span 6}}.home-goal-tunnel-title-line span{display:inline-block;position:relative;margin:0 .25ch}
.tunnel-title-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}
.tunnel-title-phase.is-active {
  visibility: visible;
  opacity: 1;
}
#tunnel-title-phase1,
#tunnel-title-phase2 {
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.9), 0 0 45px rgba(0, 180, 255, 0.6), 0 0 75px rgba(255, 255, 255, 0.4);
}`;

const newCss = `#home-goal-tunnel-title{position:relative;left:0;width:100%;grid-column:1 / span 12;height:0;text-align:center;font-size:6vw;color:var(--color-white);font-family:Arial,"Helvetica Neue",Helvetica,"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif!important;font-weight:900!important;letter-spacing:-.02em!important;text-transform:uppercase!important}@media (max-width: 812px){#home-goal-tunnel-title{top:0;grid-column:1 / span 6}}.home-goal-tunnel-title-line{white-space:nowrap!important}.home-goal-tunnel-title-line span{display:inline-block;position:relative;margin:0 .25ch;font-family:Arial,"Helvetica Neue",Helvetica,"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif!important;font-weight:900!important;letter-spacing:-.02em!important}
.tunnel-title-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}
.tunnel-title-phase.is-active {
  visibility: visible;
  opacity: 1;
}
#tunnel-title-phase1,
#tunnel-title-phase2 {
  color: #ffffff !important;
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.95), 0 0 35px rgba(0, 180, 255, 0.7), 0 0 70px rgba(255, 255, 255, 0.4) !important;
  -webkit-font-smoothing: antialiased;
}`;

for (const f of ['_astro/about.CNa9RfUh.css', 'dist/_astro/about.CNa9RfUh.css']) {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes(oldCss)) {
    console.error('Target not found in ' + f);
    process.exit(1);
  }
  content = content.replace(oldCss, newCss);
  fs.writeFileSync(f, content, 'utf8');
  console.log('Successfully updated ' + f);
}
