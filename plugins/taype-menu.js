// plugins/menu.js
// Custom Menu with Manual Commands - Fixed Display Issue

import { promises as fs } from 'fs'
import { join } from 'path'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Menu categories with emojis and descriptions
const menuCategories = {
  main: {
    emoji: '🏠',
    name: 'Main Menu',
    description: 'Main navigation menu'
  },
  ai: {
    emoji: '🤖',
    name: 'Artificial Intelligence',
    description: 'AI-powered commands'
  },
  download: {
    emoji: '📥',
    name: 'Downloader',
    description: 'Download from TikTok, Instagram, and more'
  },
  tools: {
    emoji: '🛠️',
    name: 'Tools',
    description: 'Utility tools'
  },
  group: {
    emoji: '👥',
    name: 'Group Management',
    description: 'Group administration commands'
  },
  owner: {
    emoji: '👑',
    name: 'Owner',
    description: 'Owner only commands'
  },
  premium: {
    emoji: '💎',
    name: 'Premium',
    description: 'Premium user commands'
  },
  game: {
    emoji: '🎮',
    name: 'Games',
    description: 'Fun games and entertainment'
  },
  general: {
    emoji: '🌐',
    name: 'General',
    description: 'General bot commands'
  },
  sticker: {
    emoji: '🎨',
    name: 'Sticker Maker',
    description: 'Create and manage stickers'
  },
  converter: {
    emoji: '🔄',
    name: 'Converter',
    description: 'Convert media and files'
  },
  islamic: {
    emoji: '🕌',
    name: 'Islamic',
    description: 'Islamic commands and tools'
  }
}

// ===== MANUAL COMMAND LISTS - EDIT THESE =====
// Add your commands manually here

const commands = {
  premium: [
     { cmd: 'apk2', desc: 'Download play store'}
  ],
  ai: [
    { cmd: 'ai', desc: 'Chat with AI' },
    { cmd: 'imagine', desc: 'Generate image from text' },
    { cmd: 'translate', desc: 'Translate text' }
  ],
  
  download: [
    { cmd: 'tiktok', desc: 'Download TikTok video' },
    { cmd: 'instagram', desc: 'Download Instagram content' },
    { cmd: 'yts', desc: 'Download YouTube audio' },
    { cmd: 'playaudio', desc: 'Download audio from YouTube' }
  ],
  
  tools: [
    { cmd: 'weather', desc: 'Check weather' },
    { cmd: 'sticker', desc: 'Create sticker from image' },
    { cmd: 'textsticker', desc: 'Create text sticker' },
    { cmd: 'qrcode', desc: 'Generate QR code' },
    { cmd: 'currency', desc: 'Convert currency' }
  ],
  
  group: [
    { cmd: 'tagall', desc: 'Mention all members' },
    { cmd: 'link', desc: 'Get group link' },
    { cmd: 'setname', desc: 'Change group name' },
    { cmd: 'welcome', desc: 'Toggle welcome message' }
  ],
  
  owner: [
    { cmd: 'broadcast', desc: 'Broadcast message' },
    { cmd: 'restart', desc: 'Restart bot' },
    { cmd: 'shutdown', desc: 'Shutdown bot' },
    { cmd: 'eval', desc: 'Execute code' }
  ],
  
  sticker: [
    { cmd: 'sticker', desc: 'Image to sticker' },
    { cmd: 'textsticker', desc: 'Text to sticker' },
    { cmd: 'sgif', desc: 'Video to sticker' },
    { cmd: 'emojisticker', desc: 'Emoji to sticker' }
  ],
  
  converter: [
    { cmd: 'toimage', desc: 'Convert sticker to image' },
    { cmd: 'tomp3', desc: 'Convert video to audio' },
    { cmd: 'togif', desc: 'Convert video to GIF' }
  ],
  
  game: [
    { cmd: 'quiz', desc: 'Play quiz game' },
    { cmd: 'ttt', desc: 'Play tic tac toe' },
    { cmd: 'math', desc: 'Math challenge' }
  ],
  
  general: [
    { cmd: 'menu', desc: 'Show this menu' },
    { cmd: 'ping', desc: 'Check bot latency' },
    { cmd: 'info', desc: 'Bot information' },
    { cmd: 'owner', desc: 'Contact owner' },
    { cmd: 'uptime', desc: 'Bot uptime' }
  ]
}

// Calculate total commands
const totalCommands = Object.values(commands).reduce((acc, curr) => acc + curr.length, 0)

const handler = async (m, { conn, usedPrefix, isPrems, command, text }) => {
  try {
    const username = '@' + m.sender.split('@')[0]
    
    const d = new Date()
    const week = d.toLocaleDateString('en-US', { weekday: 'long' })
    const date = d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    
    const uptime = clockString(process.uptime() * 1000)
    
    const user = global.db?.data?.users?.[m.sender] || {}
    const level = user.level || 0
    const exp = user.exp || 0
    const limit = user.limit || 0
    const premium = user.premiumTime > 0 || isPrems ? '✅' : '❌'

    // Get user's profile picture
    let userPP
    try {
      userPP = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
      userPP = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
    }

    // Try to load images
    let menuImage = null
    let thumbnail = null

    try {
      menuImage = await fs.readFile(join(process.cwd(), 'menu.png'))
    } catch {}

    try {
      thumbnail = (await fs.readFile(join(process.cwd(), 'media/icon.jpg'))).slice(0, 200000)
    } catch {}

    const channelId = global.Sazikis?.settings?.channelId || '120363403118420523@newsletter'
    const channelName = global.Sazikis?.settings?.channelName || 'SAZIKIS-MD'

    // If specific category requested
    const category = text?.toLowerCase().trim()
    
    if (category && menuCategories[category]) {
      // Show specific category menu
      const cat = menuCategories[category]
      const cmdList = commands[category] || []
      
      if (cmdList.length === 0) {
        return m.reply(`❌ No commands found in category "${cat.name}"`)
      }

      // Create command list
      let cmdText = ''
      cmdList.forEach(cmd => {
        cmdText += `┃ ✦ *${usedPrefix}${cmd.cmd}*\n`
        cmdText += `┃   ↳ ${cmd.desc}\n`
      })

      const categoryMenu = `
┏━「${cat.emoji} *${cat.name}* ${cat.emoji}」
${cmdText}┗━━━━━━━━━━━━━━
📝 *𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧:* *${cat.description}*
📊 *𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐝𝐬:* *${cmdList.length}*
`.trim()

      const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: channelId,
          newsletterName: channelName,
          serverMessageId: -1
        }
      }

      // Add user's profile picture as thumbnail
      try {
        contextInfo.externalAdReply = {
          title: `${cat.emoji} ${cat.name} • ${username}`,
          body: `${cmdList.length} commands available • ${time}`,
          thumbnail: userPP ? await (await conn.getFile(userPP)).data : null,
          mediaType: 1,
          renderLargerThumbnail: false,
          showAdAttribution: true
        }
      } catch (e) {
        if (thumbnail) {
          contextInfo.externalAdReply = {
            title: `${cat.emoji} ${cat.name}`,
            body: `${cmdList.length} commands available • ${time}`,
            thumbnail: thumbnail,
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: true
          }
        }
      }

      await conn.sendMessage(m.chat, {
        text: categoryMenu,
        mentions: [m.sender],
        contextInfo
      }, { quoted: m })
      
      return
    }

    // MAIN MENU
    const mainMenu = `
┏━━「 👤 *USER INFO* 」
❧ 👋 Hello, *${username}*
❧ 📆 ${week}, ${date}
❧ ⏰ ${time}
❧ ⏱️ Uptime: ${uptime}
❧ 📊 Level: ${level} (${exp} XP)
❧ 🎟️ Limit: ${limit}
❧ ⭐ Premium: ${premium}
┗━━━━━━━━━━━━━━
┏━━「💡 *Quick access:* 」
❧ ${usedPrefix}menu ai     
❧ ${usedPrefix}menu download 
❧ ${usedPrefix}menu tools   
❧ ${usedPrefix}menu group   
❧ ${usedPrefix}menu owner   
❧ ${usedPrefix}menu sticker     
❧ ${usedPrefix}menu game 
❧ ${usedPrefix}menu premium
┗━━━━━━━━━━━━━━
`.trim()

    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: channelId,
        newsletterName: channelName,
        serverMessageId: -1
      }
    }

    // Add user's profile picture as thumbnail
    try {
      contextInfo.externalAdReply = {
        title: `🤖 ${conn.user?.name || 'SAZIKI BOT'}`,
        body: `Welcome ${username.split('@')[0]}! • ${time}`,
        thumbnail: userPP ? await (await conn.getFile(userPP)).data : null,
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true
      }
    } catch (e) {
      if (thumbnail) {
        contextInfo.externalAdReply = {
          title: conn.user?.name || 'SAZIKI BOT',
          body: `Menu for ${username}`,
          thumbnail: thumbnail,
          mediaType: 1,
          renderLargerThumbnail: false,
          showAdAttribution: true
        }
      }
    }

    if (menuImage) {
      await conn.sendMessage(m.chat, {
        image: menuImage,
        caption: mainMenu,
        mentions: [m.sender],
        contextInfo
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        text: mainMenu,
        mentions: [m.sender],
        contextInfo
      }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply('Menu error: ' + e.message)
  }
}

handler.help = ['menu', 'help']
handler.tags = ['info']
handler.command = /^(menu|help|cmd)$/i

export default handler

function clockString(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}