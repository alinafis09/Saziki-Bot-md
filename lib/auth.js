import fs from "fs"

const DB="./database.json"

function load(){

return JSON.parse(fs.readFileSync(DB))

}

function save(data){

fs.writeFileSync(DB,JSON.stringify(data,null,2))

}

export function isRegistered(id){

let db=load()

return db.users[id]?.registered

}

export function register(id,key){

let db=load()

db.users[id]={key,registered:true}

save(db)

}

export function checkKey(key){

let keys=JSON.parse(fs.readFileSync("./lib/keys.json"))

return keys.keys.includes(key)

}