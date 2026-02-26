const handler = async (m, {conn, usedPrefix}) => {
 const datas = global
 const doc = ['pdf', 'zip', 'vnd.openxmlformats-officedocument.presentationml.presentation', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'vnd.openxmlformats-officedocument.wordprocessingml.document'];
 const document = doc[Math.floor(Math.random() * doc.length)];
 const text = `𓃰 𝐓𝐡𝐢𝐬 𝐢𝐬 𝐭𝐡𝐞 𝐨𝐰𝐧𝐞𝐫 𝐨𝐟 𝐭𝐡𝐞 𝐛𝐨𝐭
https://wa.me/212719558797
𓃵 𝐢𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐨𝐰𝐧𝐞𝐫
https://www.instagram.com/mareyo.edits
𓆉 𝐠𝐫𝐨𝐮𝐩
https://chat.whatsapp.com/HsiI2G8qVGS9W8Rjo6Hzvh?mode=gi_t

> 𝓑𝔂 𝓢𝓪𝔃𝓲𝓴𝓲 𝓫𝓸𝓽`.trim();
 const buttonMessage = {
    'document': {url: `https://instagram.com/mareyo.edits`},
    'mimetype': `application/${document}`,
    'fileName': `彡𝒜𝐿𝐼 𝒩𝒜𝐹𝐼𝒮★`,
    'fileLength': 99999999999999,
    'pageCount': 200,
    'contextInfo': {
      'forwardingScore': 200,
      'isForwarded': true,
      'externalAdReply': {
        'mediaUrl': '',
        'mediaType': 2,
        'previewType': 'pdf',
        'title': '☛ 𝑺𝑨𝒁𝑰𝑲𝑰 𝑩𝑶𝑻 || 𝑩𝒀 𝑨𝑳𝑰 𝑵𝑨𝑭𝑰𝑺 ☯',
        'body': "➽ 𝐒𝐚𝐳𝐢𝐤𝐢𓂃𝐛𝐨𝐭",
        'thumbnail': imagen1,
        'sourceUrl': 'https://www.instagram.com/mareyo.edits?igsh=dTNxN2V2am1wNzVh'}},
    'caption': text,
    'footer': wm,
    'headerType': 6
 };
 conn.sendMessage(m.chat, buttonMessage, {quoted: m});
};
handler.help = ['owner'];
handler.tags = ['info'];
handler.command = /^(owner|creator|creador|propietario)$/i;
export default handler