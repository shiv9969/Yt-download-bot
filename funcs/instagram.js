const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');
const fs = require('fs');

async function igdl(url) {
  try {
    const resp = await axios.post(
      "https://saveig.app/api/ajaxSearch",
      new URLSearchParams({ q: url, t: "media", lang: "id" }),
      {
        headers: {
          accept: "*/*",
          "user-agent": "PostmanRuntime/7.32.2",
        },
      }
    );
    let result = { data: [] };
    const $ = cheerio.load(resp.data.data);
    $(".download-box > li > .download-items").each(function () {
      $(this)
        .find(".photo-option > select > option")
        .each(function () {
          let resolution = $(this).text();
          let url = $(this).attr("value");
          if (/1080/gi.test(resolution)) result.data.push(url);
        });
      $(this)
        .find("div:nth-child(2)")
        .each(function () {
          let url2 = $(this).find("a").attr("href");
          if (!url2) return;
          if (!/\.webp/gi.test(url2)) {
            result.data.push(url2);
          }
        });
    });
    return result;
  } catch {
    result = "Couldn't fetch data of url"
    return result;
  }
}

async function downloadInstagram(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.')
  try {
    let get = await igdl(url);
    if (!get.data[0]) {
      return bot.editMessageText('Failed to get data, make sure your Instagram link is valid!', { chat_id: chatId, message_id: load.message_id })
    } else if (get.data[0]) {
      let res = [];
      let res2 = [];
      if (get.data.length == 1) {
        if (get.data[0].includes('.jpg')) {
          await bot.deleteMessage(chatId, load.message_id)
          return bot.sendPhoto(chatId, get.data[0])
        } else {
          await bot.deleteMessage(chatId, load.message_id)
          await bot.sendVideo(chatId, get.data[0])
        }
      } else {
        get.data.forEach(maru => {
          if (maru.includes('.jpg') || maru.includes('-jpg')) {
            res.push({ type: 'photo', media: maru })
          } else {
            res2.push({ type: 'video', media: maru })
          }
        })
        let currentIndex = 0;
        while (currentIndex < res.length) {
          let mediaToSend = res.slice(currentIndex, currentIndex + 10);
          currentIndex += 10;

          if (mediaToSend.length > 0) {
            await bot.sendMediaGroup(chatId, mediaToSend);
          }
        }

        res.length = 0;
        res2.map(async (mi) => {
          await bot.sendVideo(chatId, mi.media)
        })

        await bot.deleteMessage(chatId, load.message_id)
      }
    }
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${util.format(err)}`.trim());
    return bot.editMessageText('An error occurred, make sure your Instagram link is valid!', { chat_id: chatId, message_id: load.message_id })
  }
}


module.exports = {
  downloadInstagram
}