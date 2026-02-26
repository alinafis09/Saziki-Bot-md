// plugins/playlist.js
// YouTube Playlist Manager with List Message Support

import yts from 'yt-search';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWAMessageFromContent } from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Store playlists (in production use database)
let playlists = new Map();
let userPlaylists = new Map();

/**
 * Format duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Search YouTube videos
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
async function searchYouTube(query) {
    try {
        const results = await yts(query);
        return results.videos.slice(0, 10).map(video => ({
            id: video.videoId,
            title: video.title,
            url: video.url,
            duration: video.duration.seconds,
            durationStr: video.duration.toString(),
            author: video.author.name,
            views: video.views,
            thumbnail: video.thumbnail
        }));
    } catch (error) {
        console.error('YouTube search error:', error);
        return [];
    }
}

/**
 * Get video info
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} Video info
 */
async function getVideoInfo(url) {
    try {
        const info = await ytdl.getInfo(url);
        const format = info.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        
        return {
            id: info.videoDetails.videoId,
            title: info.videoDetails.title,
            url: url,
            duration: parseInt(info.videoDetails.lengthSeconds),
            durationStr: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
            author: info.videoDetails.author.name,
            views: parseInt(info.videoDetails.viewCount),
            thumbnail: info.videoDetails.thumbnails.pop()?.url,
            format: format,
            size: format?.contentLength ? parseInt(format.contentLength) : 0
        };
    } catch (error) {
        console.error('Video info error:', error);
        return null;
    }
}

/**
 * Download video
 * @param {string} url - YouTube URL
 * @returns {Promise<string>} File path
 */
async function downloadVideo(url) {
    try {
        const info = await ytdl.getInfo(url);
        const format = info.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        
        const fileName = `video_${Date.now()}.mp4`;
        const filePath = path.join(TEMP_DIR, fileName);
        
        return new Promise((resolve, reject) => {
            ytdl(url, { format: format })
                .pipe(fs.createWriteStream(filePath))
                .on('finish', () => resolve(filePath))
                .on('error', reject);
        });
    } catch (error) {
        console.error('Download error:', error);
        return null;
    }
}

/**
 * Create list message
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

    const message = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: listMessage
        }
    }, {
        userJid: global.conn.user.jid,
        quoted
    });

    return message;
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const action = args[0]?.toLowerCase();
    const userId = m.sender;
    const playlistName = args[1]?.toLowerCase();

    // Main help menu
    if (!action) {
        const sections = [
            {
                title: '📋 PLAYLIST COMMANDS',
                rows: [
                    { header: '➕', title: 'Create Playlist', description: 'Create new playlist', id: `${usedPrefix}playlist create <name>` },
                    { header: '🔍', title: 'Search YouTube', description: 'Search for videos', id: `${usedPrefix}playlist search <query>` },
                    { header: '📥', title: 'Add to Playlist', description: 'Add video to playlist', id: `${usedPrefix}playlist add <name> <url>` },
                    { header: '📋', title: 'My Playlists', description: 'Show your playlists', id: `${usedPrefix}playlist list` },
                    { header: '🎵', title: 'View Playlist', description: 'Show playlist contents', id: `${usedPrefix}playlist view <name>` },
                    { header: '▶️', title: 'Play Video', description: 'Play video from playlist', id: `${usedPrefix}playlist play <name> <number>` },
                    { header: '📤', title: 'Remove Song', description: 'Remove song from playlist', id: `${usedPrefix}playlist remove <name> <number>` },
                    { header: '🗑️', title: 'Delete Playlist', description: 'Delete entire playlist', id: `${usedPrefix}playlist delete <name>` }
                ]
            },
            {
                title: '📝 EXAMPLES',
                rows: [
                    { title: 'Create playlist', description: '.playlist create mylist', id: `${usedPrefix}playlist create mylist` },
                    { title: 'Search videos', description: '.playlist search never gonna give you up', id: `${usedPrefix}playlist search never gonna give you up` },
                    { title: 'Add to playlist', description: '.playlist add mylist https://youtu.be/...', id: `${usedPrefix}playlist add mylist https://youtu.be/...` },
                    { title: 'View playlist', description: '.playlist view mylist', id: `${usedPrefix}playlist view mylist` }
                ]
            }
        ];

        const listMsg = createListMessage(
            m.chat,
            '🎵 YouTube Playlist Manager',
            `👤 User: @${m.sender.split('@')[0]}\n\nSelect a command from the list:`,
            '📋 Commands',
            sections,
            m
        );

        await conn.relayMessage(m.chat, listMsg.message, { messageId: listMsg.key.id });
        return;
    }

    // Create new playlist
    if (action === 'create') {
        if (!playlistName) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist create <name>\nExample: ${usedPrefix}playlist create mylist`);
            return;
        }

        const userKey = `${userId}:${playlistName}`;
        if (playlists.has(userKey)) {
            await m.reply(`❌ Playlist "${playlistName}" already exists!`);
            return;
        }

        playlists.set(userKey, {
            name: playlistName,
            owner: userId,
            createdAt: new Date().toISOString(),
            songs: []
        });

        if (!userPlaylists.has(userId)) {
            userPlaylists.set(userId, []);
        }
        userPlaylists.get(userId).push(playlistName);

        await m.reply(`✅ *Playlist "${playlistName}" created successfully!*\n\nUse ${usedPrefix}playlist search <query> to find videos.`);
        return;
    }

    // Search YouTube
    if (action === 'search') {
        const query = args.slice(1).join(' ');
        if (!query) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist search <query>\nExample: ${usedPrefix}playlist search never gonna give you up`);
            return;
        }

        await m.reply(`🔍 *Searching YouTube for:* ${query}`);

        const results = await searchYouTube(query);
        
        if (results.length === 0) {
            await m.reply('❌ No results found');
            return;
        }

        const sections = [{
            title: '🔍 SEARCH RESULTS',
            rows: results.map((video, i) => ({
                header: `${i + 1}`,
                title: video.title.substring(0, 40) + (video.title.length > 40 ? '...' : ''),
                description: `${video.author} • ${video.durationStr} • ${video.views.toLocaleString()} views`,
                id: `${usedPrefix}playlist info ${video.url}`
            }))
        }];

        const listMsg = createListMessage(
            m.chat,
            '🔍 YouTube Search',
            `Found ${results.length} results for "${query}"\nSelect a video for more options:`,
            'Select Video',
            sections,
            m
        );

        await conn.relayMessage(m.chat, listMsg.message, { messageId: listMsg.key.id });
        return;
    }

    // Get video info
    if (action === 'info') {
        const url = args[1];
        if (!url || !url.includes('youtu')) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist info <youtube-url>`);
            return;
        }

        await m.reply('⏳ *Getting video information...*');

        const video = await getVideoInfo(url);
        if (!video) {
            await m.reply('❌ Failed to get video info');
            return;
        }

        const sections = [
            {
                title: '🎬 VIDEO OPTIONS',
                rows: [
                    { header: '📥', title: 'Download Video', description: `Size: ${formatSize(video.size)}`, id: `${usedPrefix}playlist dl ${url}` },
                    { header: '➕', title: 'Add to Playlist', description: 'Add to existing playlist', id: `${usedPrefix}playlist addto ${url}` }
                ]
            },
            {
                title: '📋 YOUR PLAYLISTS',
                rows: (userPlaylists.get(userId) || []).map(name => ({
                    header: '🎵',
                    title: name,
                    description: `Add to ${name}`,
                    id: `${usedPrefix}playlist add ${name} ${url}`
                }))
            }
        ];

        if (sections[1].rows.length === 0) {
            sections.pop();
            sections.push({
                title: '📋 NO PLAYLISTS',
                rows: [{
                    header: '➕',
                    title: 'Create Playlist',
                    description: 'Create a new playlist first',
                    id: `${usedPrefix}playlist create mylist`
                }]
            });
        }

        const infoText = `*${video.title}*\n\n` +
                        `👤 ${video.author}\n` +
                        `⏱️ ${video.durationStr}\n` +
                        `👁️ ${video.views.toLocaleString()} views\n` +
                        `📦 ${formatSize(video.size)}`;

        const listMsg = createListMessage(
            m.chat,
            '🎬 Video Info',
            infoText,
            'Options',
            sections,
            m
        );

        await conn.relayMessage(m.chat, listMsg.message, { messageId: listMsg.key.id });
        return;
    }

    // Add to playlist
    if (action === 'add') {
        const name = args[1];
        const url = args[2];

        if (!name || !url || !url.includes('youtu')) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist add <playlist-name> <youtube-url>`);
            return;
        }

        const playlist = playlists.get(`${userId}:${name}`);
        if (!playlist) {
            await m.reply(`❌ Playlist "${name}" not found!`);
            return;
        }

        await m.reply('⏳ *Getting video info...*');

        const video = await getVideoInfo(url);
        if (!video) {
            await m.reply('❌ Failed to get video info');
            return;
        }

        // Check if already in playlist
        if (playlist.songs.some(s => s.id === video.id)) {
            await m.reply('❌ This video is already in the playlist');
            return;
        }

        playlist.songs.push({
            id: video.id,
            title: video.title,
            url: video.url,
            duration: video.duration,
            durationStr: video.durationStr,
            author: video.author,
            thumbnail: video.thumbnail,
            addedAt: new Date().toISOString()
        });

        await m.reply(`✅ *Added to "${name}"*\n\n🎵 ${video.title}\n⏱️ ${video.durationStr}\n👤 ${video.author}`);
        return;
    }

    // List user playlists
    if (action === 'list') {
        const userLists = userPlaylists.get(userId) || [];
        
        if (userLists.length === 0) {
            await m.reply(`📭 *You have no playlists*\n\nCreate one: ${usedPrefix}playlist create <name>`);
            return;
        }

        const sections = [{
            title: '📋 YOUR PLAYLISTS',
            rows: userLists.map(name => {
                const playlist = playlists.get(`${userId}:${name}`);
                return {
                    header: '🎵',
                    title: name,
                    description: `${playlist?.songs.length || 0} songs`,
                    id: `${usedPrefix}playlist view ${name}`
                };
            })
        }];

        const listMsg = createListMessage(
            m.chat,
            '📋 Your Playlists',
            `👤 @${m.sender.split('@')[0]}\nTotal: ${userLists.length} playlists`,
            'Select Playlist',
            sections,
            m
        );

        await conn.relayMessage(m.chat, listMsg.message, { messageId: listMsg.key.id });
        return;
    }

    // View playlist
    if (action === 'view') {
        const name = args[1];
        if (!name) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist view <name>`);
            return;
        }

        const playlist = playlists.get(`${userId}:${name}`);
        
        if (!playlist) {
            await m.reply(`❌ Playlist "${name}" not found!`);
            return;
        }

        if (playlist.songs.length === 0) {
            await m.reply(`📭 *Playlist "${name}" is empty*\n\nAdd songs: ${usedPrefix}playlist search <query>`);
            return;
        }

        // Calculate total duration
        const totalSeconds = playlist.songs.reduce((acc, s) => acc + s.duration, 0);
        const totalDuration = formatDuration(totalSeconds);

        const songRows = playlist.songs.map((song, index) => ({
            header: `${index + 1}`,
            title: song.title.substring(0, 40) + (song.title.length > 40 ? '...' : ''),
            description: `${song.author} • ${song.durationStr}`,
            id: `${usedPrefix}playlist play ${name} ${index + 1}`
        }));

        const sections = [{
            title: `🎵 ${name} (${playlist.songs.length} songs • ${totalDuration})`,
            rows: songRows
        }];

        const listMsg = createListMessage(
            m.chat,
            `🎵 ${name}`,
            `👤 @${m.sender.split('@')[0]}\n📅 Created: ${new Date(playlist.createdAt).toLocaleDateString()}\n\nSelect a song to play or download:`,
            'Select Song',
            sections,
            m
        );

        await conn.relayMessage(m.chat, listMsg.message, { messageId: listMsg.key.id });
        return;
    }

    // Play video
    if (action === 'play') {
        const name = args[1];
        const songNumber = parseInt(args[2]);

        if (!name || isNaN(songNumber)) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist play <name> <song-number>`);
            return;
        }

        const playlist = playlists.get(`${userId}:${name}`);
        if (!playlist) {
            await m.reply(`❌ Playlist "${name}" not found!`);
            return;
        }

        if (songNumber < 1 || songNumber > playlist.songs.length) {
            await m.reply(`❌ Invalid song number. Playlist has ${playlist.songs.length} songs.`);
            return;
        }

        const song = playlist.songs[songNumber - 1];
        
        await m.reply(`⏳ *Downloading: ${song.title}*`);

        try {
            const filePath = await downloadVideo(song.url);
            if (!filePath) throw new Error('Download failed');

            const stats = fs.statSync(filePath);
            const fileSize = formatSize(stats.size);

            await conn.sendMessage(m.chat, {
                video: fs.readFileSync(filePath),
                caption: `🎵 *${song.title}*\n👤 ${song.author}\n⏱️ ${song.durationStr}\n📦 ${fileSize}`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            // Clean up
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Play error:', error);
            await m.reply('❌ Failed to play video');
        }
        return;
    }

    // Download video
    if (action === 'dl') {
        const url = args[1];
        if (!url || !url.includes('youtu')) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist dl <youtube-url>`);
            return;
        }

        await m.reply('⏳ *Downloading video...*');

        try {
            const filePath = await downloadVideo(url);
            if (!filePath) throw new Error('Download failed');

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;
            const stats = fs.statSync(filePath);
            const fileSize = formatSize(stats.size);

            await conn.sendMessage(m.chat, {
                video: fs.readFileSync(filePath),
                caption: `🎵 *${title}*\n📦 ${fileSize}`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Download error:', error);
            await m.reply('❌ Failed to download video');
        }
        return;
    }

    // Remove song from playlist
    if (action === 'remove') {
        const name = args[1];
        const songNumber = parseInt(args[2]);

        if (!name || isNaN(songNumber)) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist remove <name> <song-number>`);
            return;
        }

        const playlist = playlists.get(`${userId}:${name}`);
        if (!playlist) {
            await m.reply(`❌ Playlist "${name}" not found!`);
            return;
        }

        if (songNumber < 1 || songNumber > playlist.songs.length) {
            await m.reply(`❌ Invalid song number. Playlist has ${playlist.songs.length} songs.`);
            return;
        }

        const removed = playlist.songs.splice(songNumber - 1, 1)[0];
        await m.reply(`✅ *Removed from "${name}"*\n\n🎵 ${removed.title}`);
        return;
    }

    // Delete playlist
    if (action === 'delete') {
        const name = args[1];
        if (!name) {
            await m.reply(`❌ *Usage:* ${usedPrefix}playlist delete <name>`);
            return;
        }

        const playlist = playlists.get(`${userId}:${name}`);
        if (!playlist) {
            await m.reply(`❌ Playlist "${name}" not found!`);
            return;
        }

        playlists.delete(`${userId}:${name}`);
        const userLists = userPlaylists.get(userId) || [];
        userPlaylists.set(userId, userLists.filter(n => n !== name));

        await m.reply(`✅ *Playlist "${name}" deleted successfully!*`);
        return;
    }

    // Unknown command
    await m.reply(`❌ Unknown command: ${action}\n\nUse ${usedPrefix}playlist to see available commands.`);
};

handler.help = ['playlist'];
handler.tags = ['downloader'];
handler.command = /^(playlist|pl)$/i;
handler.limit = true;

export default handler;