// plugins/sticker-advanced.js
// Advanced Sticker Maker with Custom Colors and Names

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Color palette for stickers
 */
const COLOR_PALETTE = {
    // Solid colors
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#00FF00',
    'yellow': '#FFFF00',
    'purple': '#800080',
    'orange': '#FFA500',
    'pink': '#FFC0CB',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#808080',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'lime': '#00FF00',
    'teal': '#008080',
    'lavender': '#E6E6FA',
    'coral': '#FF7F50',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'maroon': '#800000',
    'navy': '#000080',
    'olive': '#808000',
    
    // Gradients
    'sunset': ['#FF512F', '#F09819'],
    'ocean': ['#2193b0', '#6dd5ed'],
    'forest': ['#134E5E', '#71B280'],
    'night': ['#232526', '#414345'],
    'candy': ['#D38312', '#A83279'],
    'neon': ['#00F260', '#0575E6'],
    'peach': ['#ED4264', '#FFEDBC'],
    'mint': ['#1FA2FF', '#12D8FA', '#A6FFCB'],
    'aurora': ['#2C3E50', '#FD746C', '#FF8235'],
    'royal': ['#141E30', '#243B55'],
    'pastel': ['#a8edea', '#fed6e3'],
    'fire': ['#FF416C', '#FF4B2B'],
    'ice': ['#00c6fb', '#005bea'],
    'lavender': ['#C06B79', '#BFA6D9'],
    'rose': ['#FFE5B4', '#FFB6C1']
};

/**
 * Border styles
 */
const BORDER_STYLES = {
    'none': { width: 0, color: 'transparent' },
    'thin': { width: 5, color: '#FFFFFF' },
    'medium': { width: 10, color: '#FFFFFF' },
    'thick': { width: 15, color: '#FFFFFF' },
    'double': { width: 10, color: '#FFFFFF', style: 'double' },
    'dashed': { width: 5, color: '#FFFFFF', style: 'dashed' },
    'dotted': { width: 5, color: '#FFFFFF', style: 'dotted' },
    'glow': { width: 20, color: '#FFD700', blur: 10 },
    'neon': { width: 15, color: '#00FF00', blur: 15 }
};

/**
 * Apply background color to image
 */
async function applyBackground(imageBuffer, color) {
    try {
        if (Array.isArray(color)) {
            // Create gradient background
            const gradientHeight = 512;
            const gradientWidth = 512;
            const steps = color.length - 1;
            
            // Create SVG gradient
            let svgGradient;
            if (color.length === 2) {
                svgGradient = `<svg width="${gradientWidth}" height="${gradientHeight}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:${color[0]};stop-opacity:1" />
                            <stop offset="100%" style="stop-color:${color[1]};stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grad)" />
                </svg>`;
            } else {
                svgGradient = `<svg width="${gradientWidth}" height="${gradientHeight}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            ${color.map((c, i) => `<stop offset="${i * 100/steps}%" style="stop-color:${c};stop-opacity:1" />`).join('')}
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grad)" />
                </svg>`;
            }
            
            const gradientBuffer = Buffer.from(svgGradient);
            
            // Overlay image on gradient
            return await sharp(gradientBuffer)
                .composite([{ input: await sharp(imageBuffer).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), blend: 'over' }])
                .png()
                .toBuffer();
        } else {
            // Solid color background
            return await sharp({
                create: {
                    width: 512,
                    height: 512,
                    channels: 4,
                    background: color
                }
            })
            .composite([{ input: await sharp(imageBuffer).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), blend: 'over' }])
            .png()
            .toBuffer();
        }
    } catch (error) {
        console.error('Background error:', error);
        return imageBuffer;
    }
}

/**
 * Apply border to image
 */
async function applyBorder(imageBuffer, style = 'thin', borderColor = '#FFFFFF') {
    try {
        const border = BORDER_STYLES[style] || BORDER_STYLES.thin;
        border.color = borderColor;
        
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        
        const bordered = await sharp({
            create: {
                width: metadata.width + (border.width * 2),
                height: metadata.height + (border.width * 2),
                channels: 4,
                background: border.color
            }
        })
        .composite([{
            input: await image.toBuffer(),
            top: border.width,
            left: border.width
        }])
        .toBuffer();
        
        return bordered;
    } catch (error) {
        console.error('Border error:', error);
        return imageBuffer;
    }
}

/**
 * Add text to image
 */
async function addText(imageBuffer, text, position = 'bottom', fontSize = 40) {
    try {
        const positions = {
            'top': { y: 50 },
            'bottom': { y: 450 },
            'center': { y: 256 },
            'left': { x: 50, y: 256 },
            'right': { x: 462, y: 256 }
        };
        
        const pos = positions[position] || positions.bottom;
        
        const svgText = `
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                <style>
                    .text {
                        fill: white;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                        font-family: Arial, sans-serif;
                        text-anchor: middle;
                        dominant-baseline: middle;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    }
                </style>
                <text x="256" y="${pos.y}" class="text">${text}</text>
            </svg>
        `;
        
        const textBuffer = Buffer.from(svgText);
        
        return await sharp(imageBuffer)
            .composite([{ input: textBuffer, blend: 'over' }])
            .toBuffer();
    } catch (error) {
        console.error('Text error:', error);
        return imageBuffer;
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const input = args.join(' ').trim();
    
    // Parse command: .s Name | color | text | border | position
    // Example: .s My Pack | blue | Hello | thick | bottom
    const parts = input.split('|').map(p => p.trim());
    
    let packName = 'Saziki Bot';
    let color = 'none';
    let customText = '';
    let borderStyle = 'none';
    let textPosition = 'bottom';
    let fontSize = 40;
    let borderColor = '#FFFFFF';
    
    if (parts.length >= 1 && parts[0]) packName = parts[0];
    if (parts.length >= 2 && parts[1] && COLOR_PALETTE[parts[1].toLowerCase()]) color = parts[1].toLowerCase();
    if (parts.length >= 3 && parts[2]) customText = parts[2];
    if (parts.length >= 4 && parts[3] && BORDER_STYLES[parts[3].toLowerCase()]) borderStyle = parts[3].toLowerCase();
    if (parts.length >= 5 && parts[4] && ['top', 'bottom', 'center', 'left', 'right'].includes(parts[4].toLowerCase())) textPosition = parts[4].toLowerCase();
    
    const authorName = '@mareyo.edits';

    // Help menu
    if (!m.quoted && !m.message?.imageMessage) {
        const colorList = Object.keys(COLOR_PALETTE).slice(0, 20).join(', ');
        const borderList = Object.keys(BORDER_STYLES).join(', ');
        
        const helpMsg = `🎨 *ADVANCED STICKER MAKER*

*Format:*
${usedPrefix + command} PackName | Color | Text | Border | Position

*Examples:*
• Basic: ${usedPrefix}s My Pack
• With color: ${usedPrefix}s My Pack | blue
• With text: ${usedPrefix}s My Pack | red | Hello
• Full: ${usedPrefix}s My Pack | sunset | Hi | thick | bottom

*Colors:*
${colorList}

*Gradients:*
sunset, ocean, forest, night, candy, neon, peach, mint, aurora, royal, pastel, fire, ice, lavender, rose

*Borders:*
${borderList}

*Positions:*
top, bottom, center, left, right

*How to use:*
1. Reply to an image with the command
2. Or send image with caption

*Current settings:*
📦 Pack: ${packName}
🎨 Color: ${color || 'none'}
📝 Text: ${customText || 'none'}
🖼️ Border: ${borderStyle}
📍 Position: ${textPosition}`;

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

    const waitMsg = await m.reply('🎨 *Creating custom sticker...*');

    try {
        let processedImage = mediaBuffer;

        // Apply background color if selected
        if (color !== 'none') {
            processedImage = await applyBackground(processedImage, COLOR_PALETTE[color]);
        }

        // Apply border if selected
        if (borderStyle !== 'none') {
            processedImage = await applyBorder(processedImage, borderStyle, borderColor);
        }

        // Add text if provided
        if (customText) {
            processedImage = await addText(processedImage, customText, textPosition, fontSize);
        }

        // Create sticker
        const sticker = new Sticker(processedImage, {
            pack: packName,
            author: authorName,
            type: StickerTypes.FULL,
            quality: 90,
            categories: ['🎨']
        });

        const stickerBuffer = await sticker.toBuffer();

        // Send the sticker
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer
        }, { quoted: m });

        // Send success message with settings
        const successMsg = `✅ *Sticker Created!*\n\n` +
                          `📦 Pack: ${packName}\n` +
                          `🎨 Color: ${color}\n` +
                          `📝 Text: ${customText || 'none'}\n` +
                          `🖼️ Border: ${borderStyle}\n` +
                          `📍 Position: ${textPosition}`;

        await conn.sendMessage(m.chat, {
            text: successMsg,
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

// Add color preview command
let colorHandler = async (m, { conn, usedPrefix }) => {
    const colorList = Object.entries(COLOR_PALETTE).map(([name, value]) => {
        if (Array.isArray(value)) {
            return `• *${name}*: ${value.join(' → ')} (gradient)`;
        } else {
            return `• *${name}*: ${value}`;
        }
    }).join('\n');
    
    await m.reply(`🎨 *COLOR PALETTE*\n\n${colorList}\n\nUse: ${usedPrefix}s Pack | color`);
};

// Add border preview command
let borderHandler = async (m, { conn, usedPrefix }) => {
    const borderList = Object.keys(BORDER_STYLES).join(', ');
    await m.reply(`🖼️ *BORDER STYLES*\n\n${borderList}\n\nUse: ${usedPrefix}s Pack | color | text | border`);
};

handler.help = ['sticker', 's', 'stiker', 'scolor', 'sborder'];
handler.tags = ['tools'];
handler.command = /^(sticker|s|stiker)$/i;

// Subcommands
let colorCommand = async (m, { conn, usedPrefix }) => {
    const colorList = Object.keys(COLOR_PALETTE).slice(0, 20).join(', ');
    await m.reply(`🎨 *Available Colors:*\n${colorList}\n\nExample: ${usedPrefix}s MyPack | blue`);
};

let borderCommand = async (m, { conn, usedPrefix }) => {
    const borderList = Object.keys(BORDER_STYLES).join(', ');
    await m.reply(`🖼️ *Available Borders:*\n${borderList}\n\nExample: ${usedPrefix}s MyPack | blue | Hello | thick`);
};

// Export main handler and subcommands
export { colorHandler as colors, borderHandler as borders };
export default handler;