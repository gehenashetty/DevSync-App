import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sound effects from mixkit.co (free license)
const sounds = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/2186/2186-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  notification: 'https://assets.mixkit.co/active_storage/sfx/1513/1513-preview.mp3',
  toggle: 'https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3',
  whoosh: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
  completion: 'https://assets.mixkit.co/active_storage/sfx/2188/2188-preview.mp3'
};

const soundsDir = path.join(__dirname, 'public', 'sounds');

// Create sounds directory if it doesn't exist
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Download each sound
async function downloadSounds() {
  for (const [name, url] of Object.entries(sounds)) {
    const filePath = path.join(soundsDir, `${name}.mp3`);
    
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`Downloaded ${name}.mp3`);
    } catch (err) {
      console.error(`Error downloading ${name}.mp3:`, err.message);
    }
  }
}

downloadSounds().catch(console.error); 