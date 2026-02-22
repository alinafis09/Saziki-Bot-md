let handler = async (m,{conn})=>{

if(!m.chat.includes("@newsletter"))

return m.reply("This command works only in channels")

let jid = m.chat

let info = `

╭━━〔 CHANNEL INFO 〕━━⬣

┃ 📡 Channel JID :

┃ ${jid}

╰━━━━━━━━━━━━⬣

`

await conn.sendMessage(m.chat,{

text:info,

contextInfo:{

externalAdReply:{

title:"CHANNEL SCANNER",

body:"JID Extracted",

thumbnailUrl: await conn.profilePictureUrl(m.chat,'image').catch(_=>'https://i.imgur.com/8fK4h6B.png'),

mediaType:1

}

}

},{quoted:m})

}

handler.command=["channelid","chid","cjid"]

export default handler