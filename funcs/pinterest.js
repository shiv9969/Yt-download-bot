require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');

async function pindl(url) {
  try {
    const { data } = await axios.get(url, { headers: {
				"user-agent": "Mozilla/5.0 (Linux; U; Android 12; in; SM-A015F Build/SP1A.210812.016.A015FXXS5CWB2) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36"
			}});
    const $ = cheerio.load(data);
    const scriptTag = $('script[data-test-id="video-snippet"]').html() || $('script[data-test-id="leaf-snippet"]').html();
    if (scriptTag) {
        const jsonData = JSON.parse(scriptTag);
        const resultt = jsonData.contentUrl || jsonData.image;
        return resultt
    } else {
      result = "Error: Invalid URL!"
      return result;
    }
  } catch (err) {
    result = "Error: Invalid URL!"
    return result;
  }
}

async function pinterest(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Loading.')
  try {
    let get = await pindl(url);
    if (!get) {
      return bot.editMessageText('Failed to get data, make sure your Pinterest link is valid!', { chat_id: chatId, message_id: load.message_id })
    } else {
      if (get.endsWith('.mp4')) {
        await bot.sendVideo(chatId, get)
        return bot.deleteMessage(chatId, load.message_id);
      } else {
        await bot.sendPhoto(chatId, get)
        return bot.deleteMessage(chatId, load.message_id);
      }
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${err}`.trim());
    return bot.editMessageText('Failed to download media, make sure your link is valid!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  pinterest
}