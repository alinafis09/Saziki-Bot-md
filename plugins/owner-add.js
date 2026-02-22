const handler = async (m, { args }) => {

  if (!args[0]) return m.reply("📌 استعمل:\n.addowner 212xxxxxxx");

  let number = args[0].replace(/[^0-9]/g, "");

  if (!global.owner) global.owner = [];

  // check if already owner

  let exists = global.owner.find(v => v[0] == number);

  if (exists) return m.reply("⚠️ هاد الرقم راه owner أصلاً");

  global.owner.push([number, "Added Owner", true]);

  m.reply(`✅ تم إضافة owner جديد:\n📱 ${number}`);

};

handler.command = ["addowner"];

handler.rowner = true; // غير owner يقدر يستعملو

export default handler;