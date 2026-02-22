const handler = async (m, { conn, usedPrefix, command }) => {

  const users = global.db.data.users;

  const registeredUsers = [];

  

  for (const userId in users) {

    const user = users[userId];

    if (user.registered && user.token) {

      registeredUsers.push({

        id: userId,

        name: user.name || 'Unknown',

        age: user.age || '?',

        token: user.token,

        regTime: user.regTime || 0

      });

    }

  }

  

  if (registeredUsers.length === 0) {

    m.reply('📭 No registered users found.');

    return;

  }

  

  let message = `📋 *Registered Users (${registeredUsers.length})*\n\n`;

  

  registeredUsers.sort((a, b) => b.regTime - a.regTime);

  

  registeredUsers.forEach((user, index) => {

    const number = user.id.split('@')[0];

    const date = user.regTime ? new Date(user.regTime).toLocaleDateString() : 'Unknown';

    message += `${index + 1}. *${user.name}* (${user.age}y)\n`;

    message += `   📱 ${number}\n`;

    message += `   🔑 ${user.token}\n`;

    message += `   📅 ${date}\n\n`;

  });

  

  m.reply(message);

};

handler.help = ['registered', 'userlist'];

handler.tags = ['owner'];

handler.command = /^(registered|userlist|listusers)$/i;

handler.owner = true;

export default handler;