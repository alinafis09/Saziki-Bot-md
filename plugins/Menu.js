import { promises as fs } from 'fs'
import { join } from 'path'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const handler = async (m,{conn,usedPrefix,isPrems})=>{
try{
const username='@'+m.sender.split('@')[0]
const more=String.fromCharCode(8206)
const readMore=more.repeat(4001)
const d=new Date(new Date().getTime()+3600000)
const week=d.toLocaleDateString('es-ES',{weekday:'long'})
const date=d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})
const uptime=clockString(process.uptime()*1000)
const user=global.db?.data?.users?.[m.sender]||{}
const exp=user.exp||0
const limit=user.limit||0
const level=user.level||0
const role=user.role||'Usuario'
const money=user.money||0
const registered=user.registered?'✔️':'✖️'
const premium=user.premiumTime>0||isPrems?'✔️':'✖️'
const totalUsers=Object.keys(global.db?.data?.users||{}).length||0
const registeredUsers=Object.values(global.db?.data?.users||{}).filter(v=>v.registered).length||0
const commands={}
Object.values(global.plugins||{}).forEach(p=>{
if(p.disabled)return
const tags=Array.isArray(p.tags)?p.tags:[p.tags||'general']
const helps=Array.isArray(p.help)?p.help:[p.help].filter(Boolean)
tags.forEach(tag=>{
if(!commands[tag])commands[tag]=[]
helps.forEach(cmd=>{
if(!commands[tag].includes(cmd))commands[tag].push(cmd)
})
})
})
const menuSections=Object.keys(commands).sort().map(tag=>{
const list=commands[tag].sort().map(c=>`➫ ${usedPrefix}${c}`).join('\n')
return`╔═〔 ${tag.toUpperCase()} 〕\n${list}\n╚═════════════`
}).join('\n\n')
const text=`
╔═════════𝐒𝐀𝐙𝐈𝐊𝐈-𝐁𝐎𝐓═════════
> 👤 Usuario: ${username}
> 🤖 Bot: ${conn.user?.name||'Bot'}
> 👑 Owner: ${global.owner?.[0]?.[0]||'Not set'}
> 📅 Fecha: ${week}, ${date}
> ⏱ Runtime: ${uptime}
📊 ESTADÍSTICAS
👥 Total: ${totalUsers}
✅ Registrados: ${registeredUsers}
📈 Nivel: ${level}
✨ Exp: ${exp}
💰 Dinero: ${money}
🎟 Limite: ${limit}
📌 Rol: ${role}
⭐ Premium: ${premium}
📝 Registro: ${registered}
${readMore}
${menuSections}

`.trim()

let menuImage=null

let thumbnail=null

try{

menuImage=await fs.readFile(join(process.cwd(),'menu.png'))

}catch{}

try{

thumbnail=(await fs.readFile(join(process.cwd(),'media/icon.jpg'))).slice(0,200000)

}catch{}

const channelId=global.Sazikis?.settings?.channelId||'120363403118420523@newsletter'

const channelName=global.Sazikis?.settings?.channelName||'SAZIKIS-MD'

const contextInfo={

forwardingScore:999,

isForwarded:true,

forwardedNewsletterMessageInfo:{

newsletterJid:channelId,

newsletterName:channelName,

serverMessageId:-1

}

}

if(thumbnail){

contextInfo.externalAdReply={

title:conn.user?.name||'Bot Menu',

body:`Info for ${username}`,

thumbnail:thumbnail,

mediaType:1,

renderLargerThumbnail:false,

showAdAttribution:true

}

}

if(menuImage){

await conn.sendMessage(m.chat,{image:menuImage,caption:text,mentions:[m.sender],contextInfo},{quoted:m})

}else{

await conn.sendMessage(m.chat,{text,mentions:[m.sender],contextInfo},{quoted:m})

}

}catch(e){

console.error(e)

m.reply('Menu error: '+e.message)

}

}

handler.help=['menu']

handler.tags=['info']

handler.command=/^(menu|help|cmd)$/i

export default handler

function clockString(ms){

const h=Math.floor(ms/3600000)

const m=Math.floor(ms/60000)%60

const s=Math.floor(ms/1000)%60

return[h,m,s].map(v=>v.toString().padStart(2,'0')).join(':')

}