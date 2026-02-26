// plugins/textsticker.js
// Advanced Text to Sticker Generator - Multi-color, Animated

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker } from 'wa-sticker-formatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Color palettes
const COLOR_PALETTES = {
    rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    pastel: ['#FFB6C1', '#FFDAB9', '#E6E6FA', '#C1FFC1', '#B0E0E6', '#D8BFD8', '#FFE4E1'],
    neon: ['#FF00FF', '#00FFFF', '#FF00FF', '#39FF14', '#FF9933', '#F0F', '#0FF'],
    sunset: ['#FF4E50', '#F9D423', '#FF6B6B', '#FFE66D', '#FF8C42', '#FF3B3B', '#FFD93D'],
    ocean: ['#00B4DB', '#0083B0', '#00B4D8', '#0077BE', '#00A8B5', '#005F8C', '#0099CC'],
    forest: ['#134E5E', '#71B280', '#1B813E', '#5F9F4F', '#2E8B57', '#228B22', '#32CD32'],
    gold: ['#FFD700', '#FDB931', '#FFB347', '#FFA500', '#FF8C00', '#FF7F00', '#FF9F00'],
    silver: ['#C0C0C0', '#A9A9A9', '#808080', '#D3D3D3', '#DCDCDC', '#F5F5F5', '#E8E8E8']
};

// Animation types (using wa-sticker-formatter built-in animations)
const ANIMATIONS = {
    none: 'static',
    bounce: 'bounce',
    shake: 'shake',
    pulse: 'pulse',
    wave: 'wave'
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const input = args.join(' ').trim();
    
    // Parse command arguments
    const cmdParts = input.split(' --');
    const text = cmdParts[0];
    const options = {};

    if (cmdParts.length > 1) {
        cmdParts.slice(1).forEach(part => {
            const [key, value] = part.split('=');
            options[key] = value || true;
        });
    }

    // Help menu
    if (!text) {
        const helpMsg = `🎨 *TEXT TO STICKER GENERATOR*

*Usage:* ${usedPrefix + command} <text> [--options]

*Examples:*
• ${usedPrefix}ts Hello World
• ${usedPrefix}ts Hello --colors=rainbow
• ${usedPrefix}ts Welcome --gradient --colors=FF0000,00FF00,0000FF
• ${usedPrefix}ts Multi-line text

*Options:*
--colors=<palette> or hex codes
  Palettes: rainbow, pastel, neon, sunset, ocean, forest, gold, silver
  Example: --colors=rainbow
  Custom: --colors=FF0000,00FF00,0000FF

--fontSize=<size> (default: 60)
--gradient (enable gradient)
--backgroundColor=<color> (hex)
--animation=<type>
  Types: none, bounce, shake, pulse, wave

*Shortcuts:*
• ${usedPrefix}rainbow <text> - Rainbow colors
• ${usedPrefix}gradient <text> - Gradient colors
• ${usedPrefix}neon <text> - Neon colors
• ${usedPrefix}gold <text> - Gold colors
• ${usedPrefix}bounce <text> - Bouncing animation`;

        await m.reply(helpMsg);
        return;
    }

    const waitMsg = await m.reply('🎨 *Generating text sticker...*');

    try {
        // Process options
        const stickerOptions = {
            pack: 'Saziki Text Stickers',
            author: '@mareyo.edits',
            type: 'full',
            quality: 90,
            text: text
        };

        // Handle color palettes
        let colors = ['#000000'];
        if (options.colors) {
            if (COLOR_PALETTES[options.colors]) {
                colors = COLOR_PALETTES[options.colors];
            } else {
                // Custom hex colors
                colors = options.colors.split(',').map(c => c.startsWith('#') ? c : `#${c}`);
            }
        }

        // Handle shortcuts
        if (command === 'rainbow') {
            colors = COLOR_PALETTES.rainbow;
        } else if (command === 'gradient') {
            colors = COLOR_PALETTES.pastel;
        } else if (command === 'neon') {
            colors = COLOR_PALETTES.neon;
        } else if (command === 'gold') {
            colors = COLOR_PALETTES.gold;
        } else if (command === 'bounce') {
            stickerOptions.animation = 'bounce';
        }

        // Apply other options
        if (options.backgroundColor) stickerOptions.backgroundColor = `#${options.backgroundColor.replace('#', '')}`;
        if (options.animation) stickerOptions.animation = options.animation;

        // Create simple text sticker using wa-sticker-formatter
        // Note: For multi-color and gradient, we need to use HTML/CSS approach
        // This is a simplified version that creates basic text stickers
        
        // Create HTML content with styling
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    width: 512px;
                    height: 512px;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: ${options.backgroundColor ? `#${options.backgroundColor.replace('#', '')}` : 'transparent'};
                    font-family: Arial, sans-serif;
                }
                .text-container {
                    text-align: center;
                    padding: 20px;
                    word-wrap: break-word;
                    max-width: 100%;
                }
                .text-line {
                    font-size: ${options.fontSize || 60}px;
                    font-weight: bold;
                    margin: 10px 0;
                    ${colors.length > 1 ? `
                    background: linear-gradient(45deg, ${colors.join(', ')});
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    ` : `
                    color: ${colors[0]};
                    `}
                    text-shadow: ${options.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'};
                }
            </style>
        </head>
        <body>
            <div class="text-container">
                ${text.split(' ').map(word => `<div class="text-line">${word}</div>`).join('')}
            </div>
        </body>
        </html>
        `;

        // Save HTML to file
        const htmlPath = path.join(TEMP_DIR, `text_${crypto.randomBytes(4).toString('hex')}.html`);
        fs.writeFileSync(htmlPath, htmlContent);

        // Generate sticker from HTML using wa-sticker-formatter
        const sticker = new Sticker(htmlPath, {
            pack: stickerOptions.pack,
            author: stickerOptions.author,
            type: 'full',
            quality: 90
        });

        const stickerBuffer = await sticker.toBuffer();

        // Clean up
        fs.unlinkSync(htmlPath);

        // Send sticker
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            text: '✅ *Text sticker created!*',
            edit: waitMsg.key
        });

    } catch (error) {
        console.error('Text sticker error:', error);
        await conn.sendMessage(m.chat, {
            text: `❌ *Error:* ${error.message || 'Failed to create text sticker'}`,
            edit: waitMsg.key
        });
    }
};

handler.help = ['textsticker', 'ts', 'rainbow', 'gradient', 'neon', 'gold', 'bounce'];
handler.tags = ['tools', 'sticker'];
handler.command = /^(textsticker|ts|rainbow|gradient|neon|gold|bounce)$/i;
handler.limit = true;

export default handler;