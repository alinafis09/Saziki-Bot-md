import { search, download } from 'aptoide-scraper'

const handler = async (m, { conn, text }) => {

if (!text) throw '√ 𝙏𝙮𝙥 𝙣𝙖𝙢𝙚 𝙖𝙥𝙥'

try {

const result = await search(text)

const data5 = await download(result[0].id)

let size = data5.size.replace(' MB', '').replace(',', '.')

size = parseFloat(size)

if (size > 200) {

return conn.sendMessage(m.chat, {

text: '*error*'

}, { quoted: m })

}

let info = `
╔══════════ஜ۩۞۩ஜ══════════
> 📦 𝙣𝙖𝙢𝙚 : ☞ *${data5.name}*
> 📱 𝙋𝙖𝙘𝙠𝙖𝙜𝙚 : ☞ *${data5.package}*
> 📅 𝙇𝙖𝙨𝙩 𝙪𝙥𝙙𝙖𝙩𝙚 : ☞ *${data5.lastup}*
> 💾 𝙨𝙞𝙯𝙚 : ☞ *${data5.size}*
> 📥 𝙎𝙩𝙖𝙧𝙩 𝙙𝙤𝙬𝙣𝙡𝙤𝙖𝙙 ☞ *${data5.name}*
╚══════════ஜ۩۞۩ஜ══════════
\n> 𝓑𝔂 𝓢𝓪𝔃𝓲𝓴𝓲 𝓫𝓸𝓽`
let buttonMessage = {

  document: { url: data5.icon },

  mimetype: 'application/pdf',

  fileName: `♛ 𝑺𝒂𝒛𝒊𝒌𝒊 𝒃𝒐𝒕 || 𝑩𝒚 𝑴𝒓 𝑨𝒍𝒊`,

  fileLength: 999999999999,

  contextInfo: {

    forwardingScore: 999,

    isForwarded: true,

    externalAdReply: {

      title: '⚙️ 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐒𝐚𝐳𝐢𝐤𝐢',

      body: `☪ 𝑺𝒂𝒛𝒊𝒌𝒊 𝒃𝒐𝒕 𝑴𝑫`,

      thumbnailUrl: data5.icon,

      sourceUrl: data5.dllink,

      mediaType: 1,

      renderLargerThumbnail: true

    }

  },

  caption: info

}

await conn.sendMessage(m.chat, buttonMessage, { quoted: m })

await conn.sendMessage(m.chat, {

document: { url: data5.dllink },

mimetype: 'application/vnd.android.package-archive',

fileName: data5.name + '.apk',

caption: `> ✅️ *${data5.name} has loaded successfully*`

}, { quoted: m })

} catch (e) {

console.log(e)

throw '*error*'

}

}

handler.command = ['apk']

export default handler