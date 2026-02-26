import axios from "axios";

async function fesnuk(postUrl, cookie = "", userAgent = "") {

    if (!postUrl || !postUrl.trim()) throw new Error("> ⚠️ *𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠 𝙡𝙞𝙣𝙠*");

    if (!/(facebook.com|fb.watch)/.test(postUrl)) throw new Error("Invalid Facebook URL.");

    const headers = {

        "sec-fetch-user": "?1",

        "sec-ch-ua-mobile": "?0",

        "sec-fetch-site": "none",

        "sec-fetch-dest": "document",

        "sec-fetch-mode": "navigate",

        "cache-control": "max-age=0",

        authority: "www.facebook.com",

        "upgrade-insecure-requests": "1",

        "accept-language": "en-GB,en;q=0.9",

        "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',

        "user-agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",

        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",

        cookie: cookie || "",

    };

    try {

        const { data } = await axios.get(postUrl, { headers });

        const extractData = data.replace(/"/g, '"').replace(/&/g, "&");

        const sdUrl = match(extractData, /"browser_native_sd_url":"(.*?)"/, /sd_src\s*:\s*"([^"]*)"/)?.[1];

        const hdUrl = match(extractData, /"browser_native_hd_url":"(.*?)"/, /hd_src\s*:\s*"([^"]*)"/)?.[1];

        const title = match(extractData, /<meta\sname="description"\scontent="(.*?)"/)?.[1] || "";

        if (sdUrl) {

            return {

                url: postUrl,

                title: parseString(title),

                quality: {

                    sd: parseString(sdUrl),

                    hd: parseString(hdUrl || ""),

                },

            };

        } else {

            throw new Error("『*𝘼𝙣 𝙚𝙧𝙧𝙤𝙧 𝙤𝙘𝙘𝙪𝙧𝙧𝙚𝙙*』");

        }

    } catch (error) {

        console.error("Error:", error);

        throw new Error("『*𝘼𝙣 𝙚𝙧𝙧𝙤𝙧 𝙤𝙘𝙘𝙪𝙧𝙧𝙚𝙙*』");

    }

}

function parseString(string) {

    try {

        return JSON.parse(`{"text": "${string}"}`).text;

    } catch (e) {

        return string;

    }

}

function match(data, ...patterns) {

    for (const pattern of patterns) {

        const result = data.match(pattern);

        if (result) return result;

    }

    return null;

}

let handler = async (m, { args, conn }) => {

    if (!args[0]) throw "Please provide a Facebook URL.";

    let result = await fesnuk(args[0]);

    // Send the video in SD quality

    let sdQuality = result.quality.sd;

    if (sdQuality) {

        await conn.sendMessage(m.chat, {

            video: { url: sdQuality },

            mimetype: 'video/mp4',

        }, { quoted: m });

        m.reply(`Sending video...\nTitle: ${result.title}\nQuality: SD`);

    } else {

        m.reply("Unable to fetch the video in SD quality.");

    }

};

handler.help = handler.command = ['fb'];

handler.tags = ['downloader'];

export default handler;