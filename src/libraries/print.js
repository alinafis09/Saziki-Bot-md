import { WAMessageStubType } from "@whiskeysockets/baileys";
import PhoneNumber from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';
import terminalImage from 'terminal-image';
import urlRegexSafe from 'url-regex-safe';

const urlRegex = urlRegexSafe({ strict: false });

// Define una longitud máxima para el mensaje
const MAX_MESSAGE_LENGTH = 400;

export default async function(m, conn = { user: {} }) {
  try {
    const _name = await conn.getName(m.sender);
    const sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (_name ? ' ~' + _name : '');
    const chat = await conn.getName(m.chat);
    let img;
    
    try {
      if (global.opts?.['img']) {
        if (/sticker|image/gi.test(m.mtype)) {
          const buffer = await m.download();
          if (buffer) {
            img = await terminalImage.buffer(buffer);
          }
        }
      }
    } catch (e) {
      console.error('Error loading image:', e.message);
    }
    
    const filesize = (() => {
      if (!m.msg) return m.text ? m.text.length : 0;
      if (m.msg.vcard) return m.msg.vcard.length;
      if (m.msg.fileLength) return m.msg.fileLength.low || m.msg.fileLength;
      if (m.msg.axolotlSenderKeyDistributionMessage) return m.msg.axolotlSenderKeyDistributionMessage.length;
      if (m.text) return m.text.length;
      return 0;
    })() || 0;
    
    const user = global.db?.data?.users?.[m.sender];
    const me = PhoneNumber('+' + (conn.user?.jid || '').replace('@s.whatsapp.net', '')).getNumber('international');

    console.log(
      `▣────────────···\n│ ${chalk.redBright('%s')}\n│⏰ㅤ${chalk.black(chalk.bgYellow('%s'))}\n│📑ㅤ${chalk.black(chalk.bgGreen('%s'))}\n│📊ㅤ${chalk.magenta('%s [%s %sB]')}\n│📤ㅤ${chalk.green('%s')}\n│📃ㅤ${chalk.yellow('%s%s')}\n│📥ㅤ${chalk.green('%s')}\n│💬ㅤ${chalk.black(chalk.bgYellow('%s'))}\n▣────────────···`.trim(),
      me + ' ~' + (conn.user?.name || '') + `${conn.user?.jid == global.conn?.user?.jid ? '' : ' (Sub Bot)'}`,
      (m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date()).toTimeString(),
      m.messageStubType ? WAMessageStubType[m.messageStubType] : '',
      filesize,
      filesize === 0 ? 0 : (filesize / 1009 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1),
      ['', ...'KMGTP'][Math.floor(Math.log(filesize) / Math.log(1000))] || '',
      sender,
      m.exp || '?',
      user ? '|' + (user.exp || 0) + '|' + (user.limit || 0) : '' + ('|' + (user?.level || 0)),
      m.chat + (chat ? ' ~' + chat : ''),
      m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, (v) => v.toUpperCase()) : ''
    );

    if (img) console.log(img.trimEnd());

    if (typeof m.text === 'string' && m.text) {
      let log = m.text.replace(/\u200e+/g, '');
      
      let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~`])(?!`)(.+?)\1|```((?:.|[\n\r])+?)```|`([^`]+?)`)(?=\S?(?:[\s\n]|$))/g;
      let mdFormat = (depth = 4) => (_, type, text, monospace) => {
        let types = {
          '_': 'italic',
          '*': 'bold',
          '~': 'strikethrough',
          '`': 'bgGray'
        };
        text = text || monospace;
        let formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(/`/g, '').replace(mdRegex, mdFormat(depth - 1)));
        return formatted;
      };
      
      log = log.replace(mdRegex, mdFormat(4));
   
      if (log.length > MAX_MESSAGE_LENGTH) {
        log = log.substring(0, MAX_MESSAGE_LENGTH) + '\n' + chalk.blue('Character Limit Exceeded...');
      }  
      
      log = log.split('\n').map(line => {
        if (line.trim().startsWith('>')) {
          return chalk.bgGray.dim(line.replace(/^>/, '┃'));
        } else if (/^([1-9]|[1-9][0-9])\./.test(line.trim())) {
          return line.replace(/^(\d+)\./, (match, number) => {
            const padding = number.length === 1 ? '  ' : ' ';
            return padding + number + '.';
          });
        } else if (/^[-*]\s/.test(line.trim())) {
          return line.replace(/^[*-]/, '  •');
        }
        return line;
      }).join('\n');
      
      log = log.replace(urlRegex, (url, i, text) => {
        const end = url.length + i;
        return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1])) ? chalk.blueBright(url) : url;
      });
      
      log = log.replace(mdRegex, mdFormat(4));

      try {
        const mentionedJids = await m.mentionedJid;
        if (mentionedJids && Array.isArray(mentionedJids)) {
          for (const user of mentionedJids) {
            const userString = typeof user === 'string' ? user : (user?.jid || user?.lid || user?.id || '');
            if (userString) {
              const username = await conn.getName(userString);
              log = log.replace('@' + userString.split('@')[0], chalk.blueBright('@' + (username || 'Unknown')));
            }
          }
        }
      } catch (e) {
        console.error('Error processing mentions:', e);
      }

      console.log(log);
    }

    if (m.messageStubParameters && Array.isArray(m.messageStubParameters)) {
      console.log(
        m.messageStubParameters
          .map((jid) => {
            try {
              if (!jid || typeof jid !== 'string') return '';
              const decodedJid = conn.decodeJid?.(jid) || jid;
              if (!decodedJid) return '';
              const name = conn.getName(decodedJid) || '';
              const phoneNumber = decodedJid.replace('@s.whatsapp.net', '');
              let formattedNumber = '';
              try {
                formattedNumber = PhoneNumber('+' + phoneNumber).getNumber('international') || phoneNumber;
              } catch {
                formattedNumber = phoneNumber;
              }
              return chalk.gray(formattedNumber + (name ? ' ~' + name : ''));
            } catch (error) {
              console.error('Error processing messageStubParameter:', error.message);
              return '';
            }
          })
          .filter(Boolean)
          .join(', ')
      );
    }

    if (/document/i.test(m.mtype)) console.log(`🗂️ ${m.msg?.fileName || m.msg?.displayName || 'Document'}`);
    else if (/ContactsArray/i.test(m.mtype)) console.log(`👨‍👩‍👧‍👦 ${' ' || ''}`);
    else if (/contact/i.test(m.mtype)) console.log(`👨 ${m.msg?.displayName || ''}`);
    else if (/audio/i.test(m.mtype)) {
      const duration = m.msg?.seconds || 0;
      console.log(`${m.msg?.ptt ? '🎤ㅤ(PTT ' : '🎵ㅤ('}AUDIO) ${Math.floor(duration / 60).toString().padStart(2, 0)}:${(duration % 60).toString().padStart(2, 0)}`);
    }
  } catch (error) {
    console.error('Error in print function:', error);
  }
}

const file = global.__filename?.(import.meta.url) || import.meta.url;
watchFile(file, () => {
  console.log(chalk.redBright('Update \'lib/print.js\''));
});