// plugins/ping.js

// Advanced Ping Plugin with System Information

import os from 'os';

import { performance } from 'perf_hooks';

import si from 'systeminformation';

/**

 * تنسيق الوقت

 * @param {number} ms - الوقت بالميلي ثانية

 * @returns {string} الوقت المنسق

 */

function formatTime(ms) {

  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);

  const minutes = Math.floor(seconds / 60);

  const hours = Math.floor(minutes / 60);

  const days = Math.floor(hours / 24);

  

  if (days > 0) return `${days}d ${hours % 24}h`;

  if (hours > 0) return `${hours}h ${minutes % 60}m`;

  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;

  return `${seconds}s`;

}

/**

 * تنسيق حجم الملف

 * @param {number} bytes - الحجم بالبايت

 * @returns {string} الحجم المنسق

 */

function formatBytes(bytes) {

  if (bytes === 0) return '0 B';

  const k = 1024;

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;

}

/**

 * الحصول على نسبة استخدام وحدة المعالجة المركزية

 * @returns {Promise<number>} نسبة الاستخدام

 */

async function getCPUUsage() {

  return new Promise((resolve) => {

    const startMeasure = os.cpus().map(cpu => cpu.times);

    

    setTimeout(() => {

      const endMeasure = os.cpus().map(cpu => cpu.times);

      const usage = endMeasure.map((end, i) => {

        const start = startMeasure[i];

        const idle = end.idle - start.idle;

        const total = Object.keys(end).reduce((acc, key) => acc + (end[key] - start[key]), 0);

        return ((total - idle) / total) * 100;

      });

      

      const avgUsage = usage.reduce((acc, val) => acc + val, 0) / usage.length;

      resolve(Math.round(avgUsage * 10) / 10);

    }, 100);

  });

}

/**

 * إنشاء شريط تقدم

 * @param {number} percent - النسبة المئوية

 * @param {number} size - حجم الشريط

 * @returns {string} شريط التقدم

 */

function createProgressBar(percent, size = 10) {

  const filled = Math.round((percent / 100) * size);

  const empty = size - filled;

  

  const filledChar = '█';

  const emptyChar = '░';

  

  return filledChar.repeat(filled) + emptyChar.repeat(empty);

}

let handler = async (m, { conn, command, usedPrefix }) => {

  const startTime = Date.now();

  

  try {

    // معلومات النظام الأساسية

    const platform = os.platform();

    const arch = os.arch();

    const release = os.release();

    const hostname = os.hostname();

    

    // معلومات الذاكرة

    const totalMem = os.totalmem();

    const freeMem = os.freemem();

    const usedMem = totalMem - freeMem;

    const memUsagePercent = (usedMem / totalMem) * 100;

    

    // معلومات المعالج

    const cpus = os.cpus();

    const cpuModel = cpus[0].model;

    const cpuCores = cpus.length;

    const cpuSpeed = cpus[0].speed;

    

    // استخدام المعالج

    const cpuUsage = await getCPUUsage();

    

    // وقت تشغيل النظام

    const uptimeSystem = os.uptime() * 1000;

    

    // وقت تشغيل البوت

    const uptimeBot = process.uptime() * 1000;

    

    // معلومات إضافية

    const loadAvg = os.loadavg();

    const networkInterfaces = os.networkInterfaces();

    

    // الحصول على IP العام (محاولة)

    let publicIP = 'غير متاح';

    try {

      const interfaces = Object.values(networkInterfaces).flat();

      const ipv4 = interfaces.find(i => i.family === 'IPv4' && !i.internal);

      if (ipv4) publicIP = ipv4.address;

    } catch (e) {}

    

    // حساب وقت الاستجابة

    const pingTime = Date.now() - startTime;

    

    // أيقونات حسب المنصة

    const platformIcons = {

      win32: '🪟',

      linux: '🐧',

      darwin: '🍎',

      android: '📱',

      aix: '🔷',

      freebsd: '🆓'

    };

    

    const platformIcon = platformIcons[platform] || '💻';

    

    // إنشاء الرسالة

    let message = `╭━━━「 *PONG!* 」━━━╮\n`;

    message += `┃\n`;

    message += `┃ 🤖 *Bot Status*\n`;

    message += `┃ ⏱️ Response: ${pingTime}ms\n`;

    message += `┃ 🕒 Bot Uptime: ${formatTime(uptimeBot)}\n`;

    message += `┃ 🖥️ System Uptime: ${formatTime(uptimeSystem)}\n`;

    message += `┃\n`;

    message += `┃ 📊 *System Resources*\n`;

    message += `┃ 📈 CPU: ${cpuUsage}%\n`;

    message += `┃ ${createProgressBar(cpuUsage)} ${cpuUsage.toFixed(1)}%\n`;

    message += `┃ 📉 RAM: ${memUsagePercent.toFixed(1)}%\n`;

    message += `┃ ${createProgressBar(memUsagePercent)} ${(usedMem / 1024 / 1024 / 1024).toFixed(2)}GB/${(totalMem / 1024 / 1024 / 1024).toFixed(2)}GB\n`;

    message += `┃\n`;

    message += `┃ 💾 *Memory Details*\n`;

    message += `┃ Total: ${formatBytes(totalMem)}\n`;

    message += `┃ Used: ${formatBytes(usedMem)}\n`;

    message += `┃ Free: ${formatBytes(freeMem)}\n`;

    message += `┃\n`;

    message += `┃ 🔧 *CPU Information*\n`;

    message += `┃ Model: ${cpuModel.substring(0, 30)}${cpuModel.length > 30 ? '...' : ''}\n`;

    message += `┃ Cores: ${cpuCores}\n`;

    message += `┃ Speed: ${cpuSpeed}MHz\n`;

    message += `┃ Load Avg: ${loadAvg.map(l => l.toFixed(2)).join(', ')}\n`;

    message += `┃\n`;

    message += `┃ 🖥️ *System Information*\n`;

    message += `┃ ${platformIcon} OS: ${platform} ${arch}\n`;

    message += `┃ Release: ${release}\n`;

    message += `┃ Hostname: ${hostname}\n`;

    message += `┃ IP: ${publicIP}\n`;

    message += `┃\n`;

    message += `┃ 📱 *Node.js*\n`;

    message += `┃ Version: ${process.version}\n`;

    message += `┃ Memory: ${formatBytes(process.memoryUsage().rss)}\n`;

    message += `┃\n`;

    message += `╰━━━━━━━━━━━━━━╯`;

    

    // إرسال الصورة المصغرة (thumbnail) إذا كانت متوفرة

    const thumbnail = 'https://i.imgur.com/7Mh3ZqQ.png'; // ضع رابط صورتك هنا

    

    await conn.sendMessage(m.chat, {

      text: message,

      contextInfo: {

        externalAdReply: {

          title: '🏓 𝐏𝐈𝐍𝐆! 𝐈𝐧𝐟𝐨 𝐒𝐚𝐳𝐢𝐤𝐢 𝐛𝐨𝐭',

          body: `Response Time: ${pingTime}ms | CPU: ${cpuUsage}% | RAM: ${memUsagePercent.toFixed(1)}%`,

          thumbnail: thumbnail ? await (await conn.getFile(thumbnail)).data : null,

          sourceUrl: 'https://instagram.com/mareyo.edits',

          mediaType: 1,

          renderLargerThumbnail: false

        }

      }

    }, { quoted: m });

    

  } catch (error) {

    console.error('Error en comando ping:', error);

    

    // رسالة بسيطة في حالة الخطأ

    const simplePing = Date.now() - startTime;

    await m.reply(`🏓 Pong!\n⏱️ ${simplePing}ms`);

  }

};

handler.help = ['ping', 'pong'];

handler.tags = ['general', 'info'];

handler.command = /^(ping|pong|test|speed)$/i;

handler.register = false; // يمكن تعديل حسب الحاجة

export default handler;