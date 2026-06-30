const fs = require('fs'); 
const lines = fs.readFileSync('C:/Users/vedan/.gemini/antigravity-cli/brain/1efdcd79-1ecb-44c6-ab32-3bb4416d95ea/.system_generated/logs/transcript.jsonl', 'utf8').split('\n'); 
const text = lines.filter(l => l.includes('"type":"PLANNER_RESPONSE"')).map(l => { try { return JSON.parse(l).content; } catch(e) { return ''; } }).filter(Boolean).slice(-20).join('\n---\n'); 
console.log(text);
