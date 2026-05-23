// Generate PWA icon variants from the base SVG
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const baseSvg = fs.readFileSync(path.join(__dirname, '..', 'public', 'icons', 'icon.svg'), 'utf8');

// Since we can't easily convert SVG to PNG without a canvas library,
// update the manifest to reference the SVG icon instead
const manifest = {
  name: 'SkyBook — Flight Manager',
  short_name: 'SkyBook',
  description: 'Book flights worldwide, select seats in real-time, and manage your itineraries.',
  start_url: '/',
  display: 'standalone',
  background_color: '#020617',
  theme_color: '#3b82f6',
  orientation: 'portrait-primary',
  categories: ['travel', 'utilities'],
  icons: [
    {
      src: '/icons/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'maskable any'
    },
    ...sizes.map(s => ({
      src: `/icons/icon-${s}x${s}.svg`,
      sizes: `${s}x${s}`,
      type: 'image/svg+xml',
      purpose: 'any'
    }))
  ]
};

// Create sized SVG copies
sizes.forEach(s => {
  const sized = baseSvg
    .replace('width="512"', `width="${s}"`)
    .replace('height="512"', `height="${s}"`);
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'icons', `icon-${s}x${s}.svg`),
    sized
  );
});

// Write updated manifest
fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('PWA icons and manifest updated successfully!');
console.log('Generated icons:', sizes.map(s => `icon-${s}x${s}.svg`).join(', '));
