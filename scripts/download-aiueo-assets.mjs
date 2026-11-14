import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('assets/images/aiueo');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const assets = {
  'hero-female.png': 'https://aiueo-lp.vercel.app/images/japanese/hero-ai-seminar-female.png',
  'event-ai-tips.png': 'https://aiueo-lp.vercel.app/api/proposals/831cfd10-c5e2-4010-9867-5beb1ed14b45/image',
  'event-ai-art.png': 'https://aiueo-lp.vercel.app/api/proposals/33e4e724-e8ae-4004-8052-e4614d2645c1/image',
  'member-kosehira.png': 'https://aiueo-lp.vercel.app/images/japanese/kosehirakouhei-profile.png',
  'member-ito.png': 'https://aiueo-lp.vercel.app/images/japanese/avatar-2-v2.png',
  'member-sakai.png': 'https://aiueo-lp.vercel.app/images/japanese/avatar-sakai-v1.png',
  'member-okamoto.jpg': 'https://aiueo-lp.vercel.app/images/japanese/avatar-okamoto-v1.jpg',
  'act-meetup.png': 'https://aiueo-lp.vercel.app/images/japanese/meetup.png',
  'act-development.png': 'https://aiueo-lp.vercel.app/images/japanese/development.png',
  'act-workshop.png': 'https://aiueo-lp.vercel.app/images/japanese/workshop.png',
  'act-seminar.png': 'https://aiueo-lp.vercel.app/images/japanese/seminar.png'
};

async function downloadAll() {
  for (const [name, url] of Object.entries(assets)) {
    const dest = path.join(assetsDir, name);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      console.log(`Downloaded ${name} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Failed ${name}: ${err.message}`);
    }
  }
}

downloadAll();
