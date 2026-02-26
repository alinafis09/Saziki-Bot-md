// plugins/sticker-simple.js
// Simple Sticker Maker - Works without ffmpeg

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const packName = args.join(' ').trim() || 'Saziki Bot';
    const authorName = '@mareyo.edits';

    // Help menu
    if (!m.quoted && !m.message?.imageMessage) {
        const helpMsg = `🎨 *STICKER MAKER*

*Usage:*
• Reply to an image with: ${usedPrefix + command}
• Or send image with caption: ${usedPrefix + command}

*Examples:*
• Reply to image: ${usedPrefix}s
• Custom pack: ${usedPrefix}s My Pack Name

*Note:* Images only. For videos, install ffmpeg.`;

        await m.reply(helpMsg);
        return;
    }

    // Get the image
    let mediaBuffer;

    if (m.quoted) {
        if (m.quoted.message?.imageMessage) {
            mediaBuffer = await m.quoted.download();
        } else if (m.quoted.message?.stickerMessage) {
            mediaBuffer = await m.quoted.download();
        } else {
            await m.reply('❌ *Please reply to an image*');
            return;
        }
    } else if (m.message?.imageMessage) {
        mediaBuffer = await m.download();
    } else {
        await m.reply('❌ *No image found*');
        return;
    }

    if (!mediaBuffer) {
        await m.reply('❌ *Failed to download image*');
        return;
    }

    const waitMsg = await m.reply('⏳ *Creating sticker...*');

    try {
        // Create sticker using wa-sticker-formatter
        const sticker = new Sticker(mediaBuffer, {
            pack: packName,
            author: authorName,
            type: StickerTypes.FULL,
            categories: ['🌹'],
            quality: 80,
            background: 'transparent'
        });

        const stickerBuffer = await sticker.toBuffer();

        // Send the sticker
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            text: '✅ *Sticker created successfully!*',
            edit: waitMsg.key
        });

    } catch (error) {
        console.error('Sticker error:', error);
        await conn.sendMessage(m.chat, {
            text: `❌ *Error:* ${error.message || 'Failed to create sticker'}`,
            edit: waitMsg.key
        });
    }
};

handler.help = ['sticker', 's', 'stiker'];
handler.tags = ['tools'];
handler.command = /^(sticker|s|stiker)$/i;
handler.limit = true;

export default handler;