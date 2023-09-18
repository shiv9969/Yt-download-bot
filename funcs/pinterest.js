const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');

async function pindl(url) {
  try {
    const { data } = await axios.get(
      `https://www.savepin.app/download.php?url=${url}&lang=en&type=redirect`
    );
    const $ = cheerio.load(data);
    const result = decodeURIComponent(
        $(
          ".download-link > div:nth-child(2) > div > table > tbody >  tr:nth-child(1) > td:nth-child(3) > a"
        )
          .attr("href")
          .split("url=")[1]
      )
    //console.log(result);
    return result;
  } catch (err) {
    result = "Error: Invalid URL!"
    //console.log(result);
    return result;
  }
}

async function pinterest(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.')
  try {
    let get = await pindl(url);
    if (!get) {
      await bot.deleteMessage(chatId, load.message_id);
      return bot.sendMessage(chatId, 'Failed to download media, make sure your link is valid!')
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
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${util.format(err)}`.trim());
    await bot.deleteMessage(chatId, load.message_id);
    return bot.sendMessage(chatId, 'Failed to download media, make sure your link is valid!')
  }
}

module.exports = {
  pinterest
}