const url = 'https://rahiseko-alt.github.io/antigravity1011/?t=' + Date.now();
fetch(url).then(r => {
  console.log('HTML Status:', r.status);
  console.log('HTML Last-Modified:', r.headers.get('last-modified'));
  console.log('HTML ETag:', r.headers.get('etag'));
  return r.text();
}).then(async html => {
  const m = html.match(/src="([^"]+\.js)"/g);
  console.log('Script matches in HTML:', m);
  if (m) {
    for (const match of m) {
      const src = match.split('"')[1];
      const jsUrl = new URL(src, 'https://rahiseko-alt.github.io/antigravity1011/').href;
      console.log('Checking:', jsUrl);
      const res = await fetch(jsUrl + '?t=' + Date.now());
      const js = await res.text();
      console.log('  Status:', res.status);
      console.log('  Length:', js.length);
      console.log('  Last-Modified:', res.headers.get('last-modified'));
      console.log('  Has Escape key listener?', js.includes('Escape'));
      console.log('  Has old wheel skip listener?', js.includes('goalTunnels.introElapsed>1.2'));
    }
  }
}).catch(e => console.error(e));
