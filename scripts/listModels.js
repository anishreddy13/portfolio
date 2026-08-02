const fs = require('fs');

async function check() {
  let key = process.env.GEMINI_API_KEY;
  if (!key) {
    try {
      const env = fs.readFileSync('.env.local', 'utf-8');
      key = env.split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.replace(/"/g, '').trim();
    } catch(e) {}
  }
  
  if (!key) {
    console.log("No key found.");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
     console.error("API ERROR:", JSON.stringify(data.error, null, 2));
  } else {
     console.log("AVAILABLE MODELS:");
     data.models.forEach(m => console.log(m.name));
  }
}
check();
