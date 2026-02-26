// plugins/download-tiktok.js
// TikTok Video Downloader - Working version

import axios from 'axios'

let handler = async (m, { text, command, conn, usedPrefix }) => {
  if (!text) {
    return m.reply(`📥 *TIKTOK DOWNLOADER*\n\n` +
                   `*Usage:*\n` +
                   `• ${usedPrefix + command} <url>\n` +
                   `• Reply to TikTok link\n\n` +
                   `*Example:*\n` +
                   `${usedPrefix + command} https://www.tiktok.com/@user/video/123456789`)
  }

  const waitMsg = await m.reply('⏳ *Downloading from TikTok...*')

  try {
    // Using the reliable tikwm.com API
    const encodedParams = new URLSearchParams()
    encodedParams.set("url", text)
    encodedParams.set("hd", "1")

    const response = await axios({
      method: "POST",
      url: "https://tikwm.com/api/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
      },
      data: encodedParams,
    })

    let res = response.data.data
    
    if (!res || !res.play) {
      throw new Error('No video found')
    }

    // Prepare caption with video info
    const caption = `📥 *TIKTOK DOWNLOADER*\n\n` +
                    `🎵 *Title:* ${res.title || 'No title'}\n` +
                    `👤 *Author:* ${res.author?.nickname || 'Unknown'}\n` +
                    `⏱️ *Duration:* ${res.duration ? `${Math.floor(res.duration / 60)}:${(res.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}\n\n` +
                    `📊 *Statistics:*\n` +
                    `▶️ Plays: ${formatNumber(res.play_count)}\n` +
                    `❤️ Likes: ${formatNumber(res.digg_count)}\n` +
                    `💬 Comments: ${formatNumber(res.comment_count)}\n` +
                    `🔄 Shares: ${formatNumber(res.share_count)}\n\n` +
                    `👤 *Requested by:* @${m.sender.split('@')[0]}`

    // Send video
    await conn.sendFile(m.chat, res.play, 'tiktok.mp4', caption, m, null, {
      mentions: [m.sender]
    })

    // Delete waiting message
    await conn.sendMessage(m.chat, {
      text: '✅ *Download Complete!*',
      edit: waitMsg.key
    })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, {
      text: '❌ *Error:* Failed to download TikTok video. Please check the URL and try again.',
      edit: waitMsg.key
    })
  }
}

// Helper function to format numbers
function formatNumber(num) {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

handler.help = ['tiktok', 'tt', 'tikdl', 'tiktokdl']
handler.tags = ['download']
handler.command = /^(tiktok|tt|tikdl|tiktokdl)$/i
handler.limit = true

export default handler