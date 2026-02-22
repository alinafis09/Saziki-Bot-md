import { randomBytes } from 'crypto';

const generateToken = () => {

  return 'Saziki-' + randomBytes(5).toString('hex').toUpperCase().slice(0, 6);

};

const isTokenUnique = (token, db) => {

  for (const userId in db.users) {

    if (db.users[userId].token === token) return false;

  }

  return true;

};

const handler = async (m, { conn, args, usedPrefix, command }) => {

  const user = global.db.data.users[m.sender];

  

  if (!user) {

    global.db.data.users[m.sender] = {};

  }

  if (user.registered) {

    m.reply(`✅ You are already registered.\nYour token: ${user.token}`);

    return;

  }

  if (!args[0]) {

    m.reply(`📝 Usage: ${usedPrefix + command} name.age\nExample: ${usedPrefix + command} John.25`);

    return;

  }

  const input = args.join(' ');

  const parts = input.split('.');

  

  if (parts.length < 2) {

    m.reply(`❌ Invalid format. Use: name.age\nExample: ${usedPrefix + command} John.25`);

    return;

  }

  const name = parts.slice(0, -1).join('.').trim();

  const age = parseInt(parts[parts.length - 1]);

  if (!name || name.length < 2) {

    m.reply('❌ Name must be at least 2 characters.');

    return;

  }

  if (!age || isNaN(age) || age < 5 || age > 100) {

    m.reply('❌ Age must be a number between 5 and 100.');

    return;

  }

  let token;

  do {

    token = generateToken();

  } while (!isTokenUnique(token, global.db.data));

  user.name = name;

  user.age = age;

  user.registered = true;

  user.regTime = Date.now();

  user.token = token;

  const response = `✅ *Registration Successful!*\n\n` +

                   `👤 Name: ${name}\n` +

                   `📅 Age: ${age}\n` +

                   `🔑 Token: ${token}\n\n` +

                   `Save your token. You'll need it for verification.`;

  m.reply(response);

};

handler.help = ['reg'].map(v => v + ' <name.age>');

handler.tags = ['main'];

handler.command = /^(reg(ister)?)$/i;

handler.register = false;

export default handler;