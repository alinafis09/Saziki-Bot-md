import fs from "fs"

import axios from "axios"

import FormData from "form-data"

let handler = async (m,{conn})=>{

let q = m.quoted ? m.quoted : m

let mime = (q.msg || q).mimetype || ""

if(!/audio/.test(mime))

throw "Reply to an audio message"

let media = await q.download()

if(!fs.existsSync("./tmp")){

fs.mkdirSync("./tmp",{recursive:true})

}

let filePath = `./tmp/${Date.now()}.ogg`

fs.writeFileSync(filePath,media)

try{

let form = new FormData()

form.append("file",fs.createReadStream(filePath))

let res = await axios.post(

"https://api.whisperapi.com/transcribe",

form,

{

headers:{

...form.getHeaders(),

Authorization:"e322e535f64446a3a60345280f9df20d"

},

timeout:60000

})

let text = res.data?.text || "No speech detected"

await m.reply("Result:\n"+text)

}catch(err){

console.error(err)

throw "Transcription failed"

}finally{

if(fs.existsSync(filePath))

fs.unlinkSync(filePath)

}

}

handler.command=["stt","transcribe"]

export default handler