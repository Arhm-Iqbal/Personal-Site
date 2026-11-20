// Refreshes the saved GitHub activity shown at the end of Work.
// The page draws this snapshot at once, then asks the same public service for
// fresher numbers when a visitor reaches the graph. Run from the project root:
//   node scripts/update-github-activity.mjs
import { writeFile } from 'node:fs/promises';

const USER = 'Arhm-Iqbal';
const url = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;

const response = await fetch(url);
if (!response.ok) throw new Error(`${url} answered ${response.status}`);
const data = await response.json();
const today = new Date().toISOString().slice(0, 10);
const days = data.contributions
  .filter(day => day.date <= today)
  .map(day => [day.date, day.count]);
if (days.length < 300) throw new Error(`only ${days.length} days came back`);

const snapshot = { user: USER, saved: today, days };
await writeFile(
  new URL('../assets/github-activity.js', import.meta.url),
  `// Saved by scripts/update-github-activity.mjs. Do not edit by hand.\nwindow.GITHUB_ACTIVITY = ${JSON.stringify(snapshot)};\n`
);
const total = days.reduce((sum, [, count]) => sum + count, 0);
console.log(`Saved ${days.length} days (${days[0][0]} to ${days.at(-1)[0]}), ${total} contributions.`);
