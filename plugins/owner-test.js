// plugins/owner-test.js
// Plugin para verificar si el usuario es owner

let handler = async (m, { conn, isOwner, isROwner }) => {
  const senderNumber = m.sender.split('@')[0];
  
  let message = `*🔍 VERIFICACIÓN DE OWNER*\n\n`;
  message += `*Tu número:* ${senderNumber}\n`;
  message += `*¿Eres owner?* ${isOwner ? '✔️' : '✖️'}\n`;
  message += `*¿Eres ROwner?* ${isROwner ? '✔️' : '✖️'}\n`;
  message += `*¿De mi?* ${m.fromMe ? '✔️' : '✖️'}\n\n`;
  
  if (!isOwner && !isROwner) {
    message += `𝗢𝘄𝗻𝗲𝗿 𝗻𝘂𝗺𝗯𝗲𝗿𝘀 ♕\n`;
    const { owner } = await import('../lib/settings.js');
    owner.numbers.forEach((num, i) => {
      message += `${i+1}. ${num}\n`;
    });
  } 
  m.reply(message);
};

handler.help = ['ownertest'];
handler.tags = ['owner'];
handler.command = /^(ownertest|testowner)$/i;
handler.owner = true;

export default handler;