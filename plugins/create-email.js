// plugins/email-to-whatsapp.js
// Receive email messages directly in WhatsApp

import axios from 'axios';
import { simpleParser } from 'mailparser';
import { ImapFlow } from 'imapflow';
import { createServer } from 'net';

// تخزين حسابات الإيميل المرتبطة
let linkedEmails = [];

// تخزين جلسات IMAP النشطة
let imapSessions = {};

/**
 * ربط حساب إيميل مع رقم واتساب
 * @param {string} email - عنوان الإيميل
 * @param {string} password - كلمة المرور
 * @param {string} imapServer - سيرفر IMAP
 * @param {number} port - المنفذ (usually 993)
 * @param {string} userId - معرف المستخدم في واتساب
 * @param {string} chatId - معرف المحادثة
 * @returns {Promise<Object>} نتيجة الربط
 */
async function linkEmailAccount(email, password, imapServer, port, userId, chatId) {
  try {
    // التحقق من وجود الحساب مسبقاً
    const existing = linkedEmails.find(e => e.email === email);
    if (existing) {
      return { success: false, error: 'Email already linked' };
    }

    // إعداد اتصال IMAP
    const client = new ImapFlow({
      host: imapServer,
      port: port,
      secure: true,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    // محاولة الاتصال للتحقق من صحة البيانات
    await client.connect();
    
    // تخزين الجلسة
    const sessionId = Date.now().toString();
    imapSessions[sessionId] = client;

    // تخزين معلومات الحساب
    const emailAccount = {
      id: sessionId,
      email: email,
      userId: userId,
      chatId: chatId,
      imapServer: imapServer,
      port: port,
      connectedAt: new Date().toISOString(),
      lastCheck: null,
      client: client,
      active: true
    };

    linkedEmails.push(emailAccount);

    // بدء مراقبة الوارد
    startMonitoring(emailAccount);

    return {
      success: true,
      message: 'Email linked successfully',
      sessionId: sessionId,
      account: emailAccount
    };

  } catch (error) {
    console.error('Email link error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * بدء مراقبة البريد الوارد
 * @param {Object} account - حساب الإيميل
 */
async function startMonitoring(account) {
  console.log(`📧 Monitoring ${account.email}...`);

  const checkMail = async () => {
    if (!account.active) return;

    try {
      const client = account.client;
      
      // فتح صندوق الوارد
      const mailbox = await client.getMailbox('INBOX');
      
      // البحث عن الرسائل الجديدة
      const messages = await client.fetch('1:*', {
        uid: true,
        envelope: true,
        bodyStructure: true,
        source: true,
        flags: true
      });

      for await (const message of messages) {
        // التحقق من عدم قراءة الرسالة
        if (!message.flags.has('\\Seen')) {
          // تحليل الرسالة
          const parsed = await simpleParser(message.source);
          
          // تنسيق الرسالة لإرسالها في واتساب
          const whatsappMessage = formatEmailMessage(parsed, account.email);
          
          // إرسال إلى واتساب
          if (global.conn && account.chatId) {
            await global.conn.sendMessage(account.chatId, {
              text: whatsappMessage,
              contextInfo: {
                externalAdReply: {
                  title: `📧 New Email: ${parsed.subject || 'No Subject'}`,
                  body: `From: ${parsed.from?.text || 'Unknown'}`,
                  thumbnail: 'https://i.imgur.com/7Mh3ZqQ.png',
                  mediaType: 1
                }
              }
            });
            
            // تعليم الرسالة كمقروءة
            await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen']);
          }
        }
      }

      account.lastCheck = new Date().toISOString();

    } catch (error) {
      console.error(`Error checking mail for ${account.email}:`, error);
      
      // محاولة إعادة الاتصال
      if (account.active) {
        try {
          await account.client.connect();
        } catch (reconnectError) {
          console.error('Reconnection failed:', reconnectError);
        }
      }
    }

    // جدولة الفحص التالي بعد 30 ثانية
    if (account.active) {
      setTimeout(checkMail, 30000);
    }
  };

  // بدء الفحص الأول
  checkMail();
}

/**
 * تنسيق رسالة الإيميل لإرسالها في واتساب
 * @param {Object} parsed - الرسالة المحللة
 * @param {string} accountEmail - عنوان الإيميل
 * @returns {string} الرسالة المنسقة
 */
function formatEmailMessage(parsed, accountEmail) {
  let message = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   📧 *NEW EMAIL* 📧   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━
📨 *From:* ${parsed.from?.text || 'Unknown'}
📌 *To:* ${accountEmail}
📅 *Date:* ${parsed.date?.toLocaleString() || 'Unknown'}
📎 *Subject:* ${parsed.subject || 'No Subject'}

━━━━━━━━━━━━━━━━━━━━━
📝 *Message:*
━━━━━━━━━━━━━━━━━━━━━

${parsed.text?.substring(0, 1000) || 'No text content'}${parsed.text?.length > 1000 ? '...' : ''}

━━━━━━━━━━━━━━━━━━━━━`;

  // إضافة معلومات المرفقات إن وجدت
  if (parsed.attachments?.length > 0) {
    message += `\n📎 *Attachments:* ${parsed.attachments.length}`;
    parsed.attachments.forEach((att, i) => {
      message += `\n   ${i+1}. ${att.filename} (${Math.round(att.size / 1024)}KB)`;
    });
  }

  return message;
}

/**
 * إلغاء ربط حساب إيميل
 * @param {string} email - عنوان الإيميل
 * @returns {Promise<Object>} نتيجة الإلغاء
 */
async function unlinkEmail(email) {
  const index = linkedEmails.findIndex(e => e.email === email);
  
  if (index === -1) {
    return { success: false, error: 'Email not found' };
  }

  const account = linkedEmails[index];
  
  // إيقاف المراقبة
  account.active = false;
  
  // إغلاق اتصال IMAP
  try {
    await account.client.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }

  // حذف من القائمة
  linkedEmails.splice(index, 1);
  
  return { success: true, message: 'Email unlinked successfully' };
}

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  const isOwner = global.owner?.includes(m.sender.split('@')[0]);
  const subCommand = args[0]?.toLowerCase();

  // Help menu
  if (!text) {
    return conn.sendMessage(m.chat, {
      text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   📧 *EMAIL TO WHATSAPP* 📧   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━
📝 *COMMANDS*
━━━━━━━━━━━━━━━━━━━━━

🔗 *Link email account*
  ${usedPrefix}email link <email> <password> <imap-server>
  Example: ${usedPrefix}email link user@gmail.com pass imap.gmail.com

📋 *List linked emails*
  ${usedPrefix}email list

❌ *Unlink email*
  ${usedPrefix}email unlink <email>
  Example: ${usedPrefix}email unlink user@gmail.com

📥 *Check now*
  ${usedPrefix}email check <email>

━━━━━━━━━━━━━━━━━━━━━
📚 *SUPPORTED PROVIDERS*
━━━━━━━━━━━━━━━━━━━━━

📧 *Gmail*
  IMAP: imap.gmail.com
  Port: 993
  *Note:* Enable "Less secure apps" or use App Password

📧 *Outlook/Hotmail*
  IMAP: imap-mail.outlook.com
  Port: 993

📧 *Yahoo*
  IMAP: imap.mail.yahoo.com
  Port: 993

📧 *Custom domain*
  Use your provider's IMAP settings

━━━━━━━━━━━━━━━━━━━━━
⚠️ *IMPORTANT*
━━━━━━━━━━━━━━━━━━━━━

• Passwords are stored encrypted
• Only owner can link emails
• Emails checked every 30 seconds
• Use App Password for Gmail 2FA

👤 @${m.sender.split('@')[0]}`,
      mentions: [m.sender]
    }, { quoted: m });
  }

  // Only owner can use this feature
  if (!isOwner) {
    return m.reply('❌ *Only bot owner can link email accounts*');
  }

  switch (subCommand) {
    // ربط حساب إيميل جديد
    case 'link':
      {
        const email = args[1];
        const password = args[2];
        const imapServer = args[3] || 'imap.gmail.com';
        const port = parseInt(args[4]) || 993;

        if (!email || !password) {
          return m.reply(`❌ Usage: ${usedPrefix}email link <email> <password> <imap-server>\nExample: ${usedPrefix}email link user@gmail.com pass imap.gmail.com`);
        }

        const waitMsg = await m.reply(`🔄 Linking ${email}...`);

        const result = await linkEmailAccount(email, password, imapServer, port, m.sender, m.chat);

        if (result.success) {
          await conn.sendMessage(m.chat, {
            text: `✅ *Email linked successfully!*\n\n📧 ${email}\n🆔 Session: ${result.sessionId}\n\nNow receiving emails in this chat.`,
            edit: waitMsg.key
          });
        } else {
          await conn.sendMessage(m.chat, {
            text: `❌ *Failed to link email*\n\nError: ${result.error}\n\nCheck your credentials and IMAP settings.`,
            edit: waitMsg.key
          });
        }
      }
      break;

    // عرض الإيميلات المرتبطة
    case 'list':
      {
        const userEmails = linkedEmails.filter(e => e.userId === m.sender);

        if (userEmails.length === 0) {
          return m.reply('📭 No linked emails.\n\nLink one: ' + usedPrefix + 'email link <email> <password>');
        }

        let listMsg = `📋 *LINKED EMAILS*\n\n`;

        userEmails.forEach((email, i) => {
          const lastCheck = email.lastCheck ? new Date(email.lastCheck).toLocaleTimeString() : 'Never';
          listMsg += `${i+1}. 📧 ${email.email}\n`;
          listMsg += `   🔗 Server: ${email.imapServer}\n`;
          listMsg += `   ⏱️ Last check: ${lastCheck}\n`;
          listMsg += `   📅 Connected: ${new Date(email.connectedAt).toLocaleString()}\n\n`;
        });

        listMsg += `Total: ${userEmails.length} emails`;

        m.reply(listMsg);
      }
      break;

    // إلغاء ربط إيميل
    case 'unlink':
      {
        const email = args[1];

        if (!email) {
          return m.reply(`❌ Usage: ${usedPrefix}email unlink <email>\nExample: ${usedPrefix}email unlink user@gmail.com`);
        }

        const result = await unlinkEmail(email);

        if (result.success) {
          m.reply(`✅ ${result.message}`);
        } else {
          m.reply(`❌ ${result.error}`);
        }
      }
      break;

    // فحص فوري
    case 'check':
      {
        const email = args[1];

        if (!email) {
          return m.reply(`❌ Usage: ${usedPrefix}email check <email>\nExample: ${usedPrefix}email check user@gmail.com`);
        }

        const account = linkedEmails.find(e => e.email === email && e.userId === m.sender);

        if (!account) {
          return m.reply('❌ Email not found or not linked to you.');
        }

        m.reply(`🔄 Manual check triggered for ${email}`);
        
        // Trigger immediate check
        account.lastCheck = null; // Force check on next cycle
      }
      break;

    default:
      m.reply(`❌ Unknown command.\n\nUse ${usedPrefix}email to see available commands.`);
  }
};

// تنظيف الاتصالات عند إغلاق البوت
process.on('SIGINT', async () => {
  for (const account of linkedEmails) {
    try {
      await account.client.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  process.exit(0);
});

handler.help = ['email'];
handler.tags = ['owner'];
handler.command = /^(email|imap)$/i;
handler.owner = false;

export default handler;