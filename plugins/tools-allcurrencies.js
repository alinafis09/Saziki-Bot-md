// plugins/tools-currencies.js
// List all supported currencies

import { currencies } from './tools-currencies.js';

let handler = async (m, { conn, usedPrefix }) => {
  // Group currencies by region
  const regions = {
    '🌍 Africa': ['MAD', 'EGP', 'DZD', 'TND', 'LYD', 'MRU', 'SDG', 'ZAR'],
    '🇪🇺 Europe': ['EUR', 'GBP', 'CHF', 'RUB', 'TRY'],
    '🇺🇸 Americas': ['USD', 'CAD', 'AUD', 'BRL'],
    '🇸🇦 Arab': ['SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'YER'],
    '🌏 Asia': ['JPY', 'CNY', 'INR', 'SGD', 'HKD', 'KRW']
  };

  let message = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   💱 *ALL CURRENCIES* 💱   ┃
┗━━━━━━━━━━━━━━━━━━━━┛\n\n`;

  for (const [region, codes] of Object.entries(regions)) {
    message += `*${region}:*\n`;
    codes.forEach(code => {
      const curr = currencies[code];
      if (curr) {
        message += `• ${curr.flag} ${code} - ${curr.name} (${curr.symbol})\n`;
      }
    });
    message += '\n';
  }

  message += `━━━━━━━━━━━━━━━━━━━━━
💡 *Usage:* ${usedPrefix}cur <amount> <from> to <to>
📝 *Example:* ${usedPrefix}cur 100 USD to MAD`;

  await conn.sendMessage(m.chat, {
    text: message
  }, { quoted: m });
};

handler.help = ['currencies'];
handler.tags = ['tools'];
handler.command = /^(currencies|جميع)$/i;

export default handler;