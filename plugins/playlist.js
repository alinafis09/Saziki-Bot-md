// plugins/playlist.js

// YouTube Search with List Message

import yts from 'yt-search';

// Store search results per user (temporary cache)

global.searchCache = global.searchCache || new Map();

/**

 * Format number with commas

 * @param {number} num - Number to format

 * @returns {string} Formatted number

 */

function formatNumber(num) {

    if (!num) return '0';

    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';

    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';

    return num.toString();

}

/**

 * Format duration from seconds

 * @param {number} seconds - Duration in seconds

 * @returns {string} Formatted duration (MM:SS)

 */

function formatDuration(seconds) {

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, '0')}`;

}

/**

 * Create WhatsApp List Message

 * @param {string} jid - Chat ID

 * @param {string} title - List title

 * @param {string} text - List description

 * @param {string} buttonText - Button text

 * @param {Array} sections - List sections

 * @param {Object} quoted - Quoted message

 * @returns {Object} List message

 */

function createListMessage(jid, title, text, buttonText, sections, quoted) {

    const listMessage = {

        interactiveMessage: {

            header: { title },

            body: { text },

            nativeFlowMessage: {

                buttons: [{

                    name: 'single_select',

                    buttonParamsJson: JSON.stringify({

                        title: buttonText,

                        sections: sections.map(section => ({

                            title: section.title,

                            rows: section.rows.map(row => ({

                                header: row.header,

                                title: row.title,

                                description: row.description,

                                id: row.id

                            }))

                        }))

                    })

                }],

                messageParamsJson: ''

            }

        }

    };

    return {

        messageContext: {

            viewOnceMessage: {

                message: listMessage

            }

        },

        jid,

        quoted

    };

}

let handler = async (m, { conn, args, usedPrefix, command }) => {

    const query = args.join(' ').trim();

    if (!query) {

        const helpMsg = `🎵 *YouTube Search*

*Usage:* ${usedPrefix + command} <song name>

*Example:* ${usedPrefix + command} never gonna give you up

Search for videos and select from list to download audio.`;

        await m.reply(helpMsg);

        return;

    }

    const waitMsg = await m.reply(`🔍 *Searching for:* ${query}`);

    try {

        // Search YouTube

        const results = await yts(query);

        

        if (!results.videos || results.videos.length === 0) {

            await conn.sendMessage(m.chat, {

                text: '❌ *No results found*\nTry a different search term.'

            }, { quoted: m });

            return;

        }

        // Take top 10 results

        const topResults = results.videos.slice(0, 10);

        

        // Cache results for this user

        global.searchCache.set(m.sender, {

            results: topResults,

            timestamp: Date.now()

        });

        // Create sections for list message

        const sections = [{

            title: `🔍 Results for: "${query}"`,

            rows: topResults.map((video, index) => ({

                header: `${index + 1}`,

                title: video.title.substring(0, 60) + (video.title.length > 60 ? '…' : ''),

                description: `${video.author.name} • ${formatDuration(video.duration.seconds)} • ${formatNumber(video.views)} views`,

                id: `${usedPrefix}playaudio ${index + 1}`

            }))

        }];

        // Create and send list message

        const listMsg = createListMessage(

            m.chat,

            '🎵 YouTube Search',

            `Found ${results.videos.length} results for "${query}"\n\nSelect a video to download audio:`,

            '📋 Select Video',

            sections,

            m

        );

        await conn.relayMessage(

            m.chat,

            listMsg.messageContext,

            { messageId: listMsg.messageContext.viewOnceMessage?.message?.interactiveMessage?.contextInfo?.stanzaId }

        );

        // Delete waiting message

        await conn.sendMessage(m.chat, {

            text: '✅ *Search complete!*',

            edit: waitMsg.key

        });

    } catch (error) {

        console.error('YouTube search error:', error);

        await conn.sendMessage(m.chat, {

            text: `❌ *Error:* ${error.message || 'Failed to search YouTube'}`,

            edit: waitMsg.key

        });

    }

};

handler.help = ['playlist'];

handler.tags = ['downloader'];

handler.command = /^(playlist|ytsearch|search)$/i;

handler.limit = true;

export default handler;