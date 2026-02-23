// plugins/download-instagram.js
// Instagram Downloader Plugin

import axios from 'axios';
import cheerio from 'cheerio';

/**
 * Instagram Downloader using multiple APIs for reliability
 * @param {string} url - Instagram video/reel URL
 * @returns {Promise<Object>} Download information
 */
async function instagramDownloader(url) {
  try {
    // Method 1: Using SaveFrom API
    const saveFromAPI = async () => {
      try {
        const response = await axios.post('https://savefrom.net/api/convert', {
          url: url,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.url) {
          return {
            success: true,
            url: response.data.url,
            type: 'video'
          };
        }
      } catch (e) {
        return { success: false };
      }
    };

    // Method 2: Using Instagram Video Downloader API
    const instagramAPI = async () => {
      try {
        const apiUrl = `https://instagram-video-downloader-download-instagram-videos.p.rapidapi.com/instagram`;
        const response = await axios.get(apiUrl, {
          params: { url: url },
          headers: {
            'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY', // Get from rapidapi.com
            'X-RapidAPI-Host': 'instagram-video-downloader-download-instagram-videos.p.rapidapi.com'
          }
        });
        
        if (response.data && response.data.video) {
          return {
            success: true,
            url: response.data.video,
            type: 'video'
          };
        }
      } catch (e) {
        return { success: false };
      }
    };

    // Method 3: Using Instagram Downloader API (Alternative)
    const alternativeAPI = async () => {
      try {
        const response = await axios.get(`https://insta-downloader-api.onrender.com/api?url=${encodeURIComponent(url)}`);
        
        if (response.data && response.data.video_url) {
          return {
            success: true,
            url: response.data.video_url,
            type: 'video'
          };
        }
      } catch (e) {
        return { success: false };
      }
    };

    // Try all methods in sequence
    const methods = [saveFromAPI, instagramAPI, alternativeAPI];
    
    for (const method of methods) {
      const result = await method();
      if (result.success) {
        return result;
      }
    }

    return { success: false, error: 'All download methods failed' };
  } catch (error) {
    console.error('Instagram downloader error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Extract Instagram URL from text
 * @param {string} text - Input text
 * @returns {string|null} Extracted URL or null
 */
function extractInstagramUrl(text) {
  const patterns = [
    /(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[a-zA-Z0-9_-]+(?:\/)?)/,
    /(https?:\/\/instagr\.am\/[a-zA-Z0-9_-]+)/,
    /(https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  // Get URL from args or quoted message
  let url;
  
  if (args.length > 0) {
    url = extractInstagramUrl(args.join(' '));
  } else if (m.quoted && m.quoted.text) {
    url = extractInstagramUrl(m.quoted.text);
  } else if (m.quoted && m.quoted.caption) {
    url = extractInstagramUrl(m.quoted.caption);
  }

  if (!url) {
    return m.reply(`❌ *Please provide a valid Instagram URL*\n\nExample:\n${usedPrefix + command} https://www.instagram.com/p/Cxample123/`);
  }

  // Send processing message
  await m.reply('⏳ *Downloading from Instagram...*\nPlease wait a moment.');

  try {
    // Download from Instagram
    const result = await instagramDownloader(url);
    
    if (!result.success) {
      return m.reply('❌ *Failed to download.*\nPlease try again or check the URL.');
    }

    if (!result.url) {
      return m.reply('❌ *No downloadable content found.*\nThe post might be private or deleted.');
    }

    // Prepare caption
    const caption = `📥 *Instagram Downloader*\n\n` +
                    `🔗 *URL:* ${url}\n` +
                    `📦 *Type:* ${result.type || 'Video'}\n` +
                    `🤖 *Downloaded by:* @${m.sender.split('@')[0]}`;

    // Send the video
    await conn.sendMessage(m.chat, {
      video: { url: result.url },
      caption: caption,
      mentions: [m.sender]
    }, { quoted: m });

  } catch (error) {
    console.error('Instagram download error:', error);
    m.reply(`❌ *Error:* ${error.message || 'Unknown error occurred'}`);
  }
};

handler.help = ['instagram', 'ig', 'igdl', 'instadl'];
handler.tags = ['downloader'];
handler.command = /^(instagram|ig|igdl|instadl)$/i;

handler.limit = true; // Optional: limit usage
handler.premium = false; // Set to true if premium only
handler.register = false; // Set to true if registration required

export default handler;
