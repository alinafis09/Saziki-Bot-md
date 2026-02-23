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

const handler = async (m, { conn, usedPrefix, isPrems, command, text }) => {
  try {
    const username = '@' + m.sender.split('@')[0]
    const more = String.fromCharCode(8206)
    const readMore = more.repeat(4001)
    
    const d = new Date(new Date().getTime() + 3600000)
    const week = d.toLocaleDateString('es-ES', { weekday: 'long' })
    const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    const uptime = clockString(process.uptime() * 1000)
    
    const user = global.db?.data?.users?.[m.sender] || {}
    const exp = user.exp || 0
    const limit = user.limit || 0
    const level = user.level || 0
    const role = user.role || 'Usuario'
    const money = user.money || 0
    const registered = user.registered ? '✔️' : '✖️'
    const premium = user.premiumTime > 0 || isPrems ? '✔️' : '✖️'
    
    const totalUsers = Object.keys(global.db?.data?.users || {}).length || 0
    const registeredUsers = Object.values(global.db?.data?.users || {}).filter(v => v.registered).length || 0

    // Get user's profile picture
    let userPP
    try {
      userPP = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
      userPP = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
    }

    // Organize commands by category
    const commands = {}
    Object.values(global.plugins || {}).forEach(p => {
      if (p.disabled) return
      const tags = Array.isArray(p.tags) ? p.tags : [p.tags || 'general']
      const helps = Array.isArray(p.help) ? p.help : [p.help].filter(Boolean)
      
      tags.forEach(tag => {
        if (!commands[tag]) commands[tag] = []
        helps.forEach(cmd => {
          if (!commands[tag].includes(cmd)) commands[tag].push(cmd)
        })
      })
    })

    // If specific category requested
    const category = text?.toLowerCase().trim()
    
    if (category && menuCategories[category]) {
      // Show specific category menu
      const cat = menuCategories[category]
      const cmdList = commands[category] || []
      
      if (cmdList.length === 0) {
        return m.reply(`❌ No commands found in category "${cat.name}"`)
      }

      const sortedCmds = cmdList.sort()
      
      // Create grid layout for commands (2 columns for mobile)
      const columns = 2
      const cmdRows = []
      for (let i = 0; i < sortedCmds.length; i += columns) {
        const row = sortedCmds.slice(i, i + columns)
        cmdRows.push(`┃ ${row.map(cmd => `✦ ${usedPrefix}${cmd}`.padEnd(18)).join('')}`)
      }

      const categoryMenu = `
╔══════════════════════╗
║   ${cat.emoji} *${cat.name}* ${cat.emoji}   ║
╚══════════════════════╝

📝 *Description:* ${cat.description}
📊 *Total Commands:* ${sortedCmds.length}

${cmdRows.join('\n')}

━━━━━━━━━━━━━━━━━━━
💡 *Usage:* ${usedPrefix}<command>
🔍 *Back to main:* ${usedPrefix}menu
`.trim()

      // Send category menu with user's profile picture
      await conn.sendMessage(m.chat, {
        text: categoryMenu,
        mentions: [m.sender],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: `${cat.emoji} ${cat.name} • ${username}`,
            body: `${sortedCmds.length} commands available • ${time}`,
            thumbnail: userPP ? await (await conn.getFile(userPP)).data : null,
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: true
          }
        }
      }, { quoted: m })
      
      return
    }

    // Main menu with category selection
    const categoriesList = Object.keys(commands).filter(cat => commands[cat].length > 0).sort()
    
    // Create category buttons grid
    const categoryButtons = []
    for (const cat of categoriesList) {
      const catInfo = menuCategories[cat] || { emoji: '📁', name: cat }
      categoryButtons.push(`${catInfo.emoji} *${catInfo.name}*: ${usedPrefix}menu ${cat}`)
    }

    const totalCommands = Object.values(commands).reduce((acc, curr) => acc + curr.length, 0)

    const mainMenu = `
╔══════════════════════╗
║   🤖 *SAZIKI BOT* 🤖   ║
╚══════════════════════╝

┏━━「 👤 *USER INFO* 」
┃ 👋 Hello, *${username}*
┃ 📆 ${week}, ${date}
┃ ⏰ ${time}
┃ ⏱️ Uptime: ${uptime}
┗━━━━━━━━━━━━━━

┏━━「 📊 *STATISTICS* 」
┃ 👥 Users: ${totalUsers}
┃ ✅ Registered: ${registeredUsers}
┃ 📈 Level: ${level} (${exp} XP)
┃ 💰 Money: $${money}
┃ 🎟️ Limit: ${limit}
┃ 📌 Role: ${role}
┃ ⭐ Premium: ${premium}
┃ 📝 Registered: ${registered}
┗━━━━━━━━━━━━━━

┏━━「 🗂️ *CATEGORIES* 」
┃ 📊 Total: ${totalCommands} commands
┃ 
${categoriesList.map(cat => {
  const catInfo = menuCategories[cat] || { emoji: '📁' }
  return `┃ ${catInfo.emoji} *${catInfo.name}*: ${commands[cat].length} cmds`
}).join('\n')}
┃
┃ 💡 *Quick access:*
┃ ${usedPrefix}menu ai     🤖 AI
┃ ${usedPrefix}menu download 📥 Download
┃ ${usedPrefix}menu tools   🛠️ Tools
┃ ${usedPrefix}menu group   👥 Group
┗━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━
📝 *Choose a category above or type:*
${usedPrefix}menu <category>

Example: ${usedPrefix}menu download
`.trim()

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
handler.command = /^(menu|help|cmd|commands)$/i

export default handler

function clockString(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}
