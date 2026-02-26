// plugins/uptime.js
// Uptime Command with Small Top Image

import os from 'os';

/**
 * Format time in a simple way
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
  
  return parts.join(' ');
}

let handler = async (m, { conn }) => {
  try {
    // Basic uptime information
    const botUptime = process.uptime() * 1000;
    const systemUptime = os.uptime() * 1000;
    
    const botUptimeStr = formatDuration(botUptime);
    const systemUptimeStr = formatDuration(systemUptime);
    
    // Start time
    const startTime = new Date(Date.now() - botUptime);
    const startTimeStr = startTime.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Current time
    const now = new Date();
    const currentTimeStr = now.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Date
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Simple memory info
    const memoryUsage = process.memoryUsage();
    const memoryMB = (memoryUsage.rss / 1024 / 1024).toFixed(1);
    
    // Simple design
    const message = `
┏━━━━━━━━━━━━━━━━━━━━┓
┃     ⏰ *UPTIME*        
┗━━━━━━━━━━━━━━━━━━━━┛
📆 *${dateStr}*
┌──「 🤖 BOT 」
│ ⏱️ ${botUptimeStr}
│ 🚀 ${startTimeStr}
└──────────
┌──「 💻 SYSTEM 」
│ ⏲️ ${systemUptimeStr}
│ 🕐 ${currentTimeStr}
└──────────
┌──「 📊 MEMORY 」
│ 💾 ${memoryMB} MB
│ 🔄 ${process.version}
└──────────
➤ Bot is online
`.trim();

    // صورة صغيرة في الأعلى - نفس فكرة ping
    const thumbnail = 'https://i.imgur.com/7Mh3ZqQ.png'; // ضع رابط صورتك هنا

    await conn.sendMessage(m.chat, {
      text: message,
      contextInfo: {
        externalAdReply: {
          title: '⏰ 𝐔𝐏𝐓𝐈𝐌𝐄! 𝐒𝐚𝐳𝐢𝐤𝐢 𝐛𝐨𝐭',
          body: `Online: ${botUptimeStr}`,
          thumbnail: thumbnail ? await (await conn.getFile(thumbnail)).data : null,
          sourceUrl: 'https://instagram.com/mareyo.edits',
          mediaType: 1,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

  } catch (error) {
    console.error('Uptime error:', error);
    await m.reply(`⏰ Uptime: ${formatDuration(process.uptime() * 1000)}`);
  }
};

handler.help = ['uptime'];
handler.tags = ['info'];
handler.command = /^(uptime)$/i;

export default handler;