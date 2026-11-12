import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

const target = `<div id="home-goal-texts"> <div class="home-goal-texts-paragraph">AIueoは企画を持つ人と参加したい人が出会う「呼びかけの場」です。企画・金銭の当事者ではなく、自由な行動と自己責任を基本としています。</div> </div> <div class="home-goal-cta-wrap"> <a id="home-goal-details-btn" class="pill-cta-btn pill-cta-white" href="./guidelines.html" aria-label="詳細な運営規約・スタンスを見る"> <div class="pill-cta-container"> <span class="pill-cta-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg> </span> <span class="pill-cta-text">詳細な運営規約・スタンスを見る</span> <span class="pill-cta-dots"><span class="pill-cta-dot"></span></span> </div> </a> </div>`;

const replacement = `<div id="home-goal-texts"> <div class="home-goal-texts-paragraph">AIueoは企画を持つ人と参加したい人が出会う「呼びかけの場」です。企画・金銭の当事者ではなく、自由な行動と自己責任を基本としています。</div> <div class="home-goal-cta-wrap"> <a id="home-goal-details-btn" class="pill-cta-btn pill-cta-white" href="./guidelines.html" aria-label="詳細な運営規約・スタンスを見る"> <div class="pill-cta-container"> <span class="pill-cta-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg> </span> <span class="pill-cta-text">詳細な運営規約・スタンスを見る</span> <span class="pill-cta-dots"><span class="pill-cta-dot"></span></span> </div> </a> </div> </div>`;

if (html.includes(target)) {
  html = html.replace(target, replacement);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully moved .home-goal-cta-wrap inside #home-goal-texts');
} else {
  console.error('Target not found in index.html');
}
