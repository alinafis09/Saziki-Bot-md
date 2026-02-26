let handler = async (m,{conn})=>{

let chat = m.chat

let sender = m.sender

let push = m.pushName || "Unknown"

let isGroup = m.isGroup

let type = m.isGroup ? "Group" : chat.includes("@newsletter") ? "Channel" : "Private"

// نجيب صورة البروفايل

let pp = await conn.profilePictureUrl(sender,'image').catch(_=>'https://i.imgur.com/8fK4h6B.png')

let info = `

╭━━〔 CHAT INFO 〕━━⬣

┃ 📛 Name : ${push}

┃ 🆔 Your JID : ${sender}

┃ 💬 Chat JID : ${chat}

┃ 📦 Type : ${type}

┃ 📨 Msg ID : ${m.key.id}

┃ ⏱ Time : ${new Date().toLocaleString()}

╰━━━━━━━━━━━━⬣

`

await conn.sendMessage(m.chat,{

text:info,

contextInfo:{

externalAdReply:{

title:"JID INFORMATION",

body:"User Scanner",

thumbnailUrl:pp,

mediaType:1,

renderLargerThumbnail:false

}

}

},{quoted:m})

}

handler.command=["jid","id","chatid"]

export default handler