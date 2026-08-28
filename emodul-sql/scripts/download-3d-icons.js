const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'assets', 'images', '3d-icons');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const ICONS = {
  'target.png':    'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bullseye/3D/bullseye_3d.png',
  'book.png':      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Blue%20book/3D/blue_book_3d.png',
  'video.png':     'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clapper%20board/3D/clapper_board_3d.png',
  'pencil.png':    'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pencil/3D/pencil_3d.png',
  'laptop.png':    'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Laptop/3D/laptop_3d.png',
  'check.png':     'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Check%20mark%20button/3D/check_mark_button_3d.png',
  'rocket.png':    'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png',
  'key.png':       'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Key/3D/key_3d.png',
  'trophy.png':    'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png',
  'bulb.png':      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Light%20bulb/3D/light_bulb_3d.png',
  'database.png':  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Card%20file%20box/3D/card_file_box_3d.png',
  'clipboard.png': 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clipboard/3D/clipboard_3d.png',
  'warning.png':   'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Warning/3D/warning_3d.png',
  'chart.png':     'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bar%20chart/3D/bar_chart_3d.png',
  'back.png':      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Backhand%20index%20pointing%20left/3D/backhand_index_pointing_left_3d.png'
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("📥 Mengunduh 3D Icons (Microsoft Fluent 3D)...");
  for (const [name, url] of Object.entries(ICONS)) {
    const dest = path.join(targetDir, name);
    try {
      await download(url, dest);
      console.log(`  ✔ [3D Icon] ${name}`);
    } catch (err) {
      console.error(`  ❌ Gagal unduh ${name}:`, err.message);
    }
  }
  console.log("🎉 Selesai mengunduh seluruh 3D Icons!");
}

main();
