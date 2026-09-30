import fs from 'fs';
import path from 'path';

const LANGS = ['ru', 'ua', 'eng'];

for (let secNum = 1; secNum <= 20; secNum++) {
  const getFiles = (lang) => {
    const dir = fs.readdirSync(lang).find(d => parseInt(d) === secNum);
    const files = fs.readdirSync(path.join(lang, dir)).filter(f => f.endsWith('.md') && !f.startsWith('00.'));
    return files.map(f => {
      const m = f.match(/^0?(\d+)\.\s*(.+)\.md$/);
      return {
        num: m ? parseInt(m[1]) : null,
        title: m ? m[2] : f
      };
    }).sort((a,b) => a.num - b.num);
  };

  const ru = getFiles('ru');
  const ua = getFiles('ua');
  const eng = getFiles('eng');

  console.log(`\n=================== SECTION ${secNum} ===================`);
  let hasMismatch = false;
  const max = Math.max(ru.length, ua.length, eng.length);
  for (let i = 0; i < max; i++) {
    const r = ru[i];
    const u = ua[i];
    const e = eng[i];

    // Simple heuristic check if numbers match
    const rNum = r ? r.num : null;
    const uNum = u ? u.num : null;
    const eNum = e ? e.num : null;

    if (rNum !== uNum || rNum !== eNum) {
      console.log(`[NUM MISMATCH] Index ${i}: RU=${rNum} UA=${uNum} ENG=${eNum}`);
      hasMismatch = true;
    }
  }

  // Print side-by-side titles if any suspicion
  if (secNum === 19 || hasMismatch) {
    for (let i = 0; i < max; i++) {
      console.log(`${ru[i]?.num || '?'}. RU: "${ru[i]?.title}" | ENG: "${eng[i]?.title}"`);
    }
  } else {
    console.log(`Count: RU=${ru.length}, UA=${ua.length}, ENG=${eng.length}. Numbers match.`);
  }
}
