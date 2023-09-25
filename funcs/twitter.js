const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs')
const fs = require('fs')
const util = require('util')
const { getBuffer } = require('./functions')

function twitter(link){
	return new Promise((resolve, reject) => {
		let config = {
			'URL': link
		}
    axios.post('https://twdown.net/download.php',qs.stringify(config),{
			headers: {
				"user-agent": "Mozilla/5.0 (Linux; U; Android 12; in; SM-A015F Build/SP1A.210812.016.A015FXXS5CWB2) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36"
			}
		})
		.then(({ data }) => {
		const $ = cheerio.load(data)
		resolve({
				desc: $('div:nth-child(1) > div:nth-child(2) > p').text().trim(),
				thumb: $('div:nth-child(1) > img').attr('src'),
				HD: $('tbody > tr:nth-child(1) > td:nth-child(4) > a').attr('href'),
				SD: $('tr:nth-child(2) > td:nth-child(4) > a').attr('href'),
				audio: 'https://twdown.net/' + $('body > div.jumbotron > div > center > div.row > div > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(4) > a').attr('href')
			})
		})
	.catch(reject)
	})
}

async function getDataTwitter(bot, chatId, url) {
  let surl = url.replace('https://twitter.com/', '');
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    let getd = await twitter(url);
    if (!getd.HD && !getd.SD) {
      await bot.deleteMessage(chatId, load.message_id);
      return bot.editMessageText('Failed  to get video information, make sure the Twitter link is valid and not a photo!', { chat_id: chatId, message_id: load.message_id })
    } else if (getd.HD && getd.thumb) {
      let options = {
        caption: `${getd.desc ? getd.desc + '\n\n' : ''}Please select the following option!`,
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: 'High Quality Videos', callback_data: 'twh ' + surl }],
            [{ text: 'Low Quality Videos', callback_data: 'twl ' + surl }],
            [{ text: 'Download Audio Only', callback_data: 'twa ' + surl }]
          ]
        })
      };
      await bot.sendPhoto(chatId, getd.thumb, options);
      await bot.deleteMessage(chatId, load.message_id);
    }
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${util.format(err)}`.trim());
    return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function downloadTwitterHigh(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Downloading video...');
  try {
    let get = await twitter('https://twitter.com/' + url);
    if (!get.HD) {
      return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
    } else {
      await bot.sendVideo(chatId, get.HD, { caption: get.desc ? get.desc : '' })
      return bot.deleteMessage(chatId, load.message_id);
    }
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${util.format(err)}`.trim());
    return bot.editMessageText('Error sending video!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function downloadTwitterLow(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Downloading video...');
  try {
    let get = await twitter('https://twitter.com/' + url);
    if (!get.SD) {
      return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
    } else {
      await bot.sendVideo(chatId, get.SD, { caption: get.desc ? get.desc : '' });
      return bot.deleteMessage(chatId, load.message_id);
    }
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${util.format(err)}`.trim());
    return bot.editMessageText('Error sending video!', { chat_id: chatId, message_id: load.message_id })
  }
}


async function downloadTwitterAudio(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Downloading audio...');
  try {
    let get = await twitter('https://twitter.com/' + url);
    if (!get.audio) {
      return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
    } else {
      let fname = 'Twitter_audio_'+chatId+'.mp3'
      let buff = await getBuffer(get.audio);
      await fs.writeFileSync('content/'+fname, buff);
      await bot.sendAudio(chatId, 'content/'+fname, { contentType: 'audio/mp3' });
      await fs.unlinkSync('content/'+fname)
      return bot.deleteMessage(chatId, load.message_id);
    }
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${util.format(err)}`.trim());
    return bot.editMessageText('Error sending audio!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  getDataTwitter,
  downloadTwitterHigh,
  downloadTwitterLow,
  downloadTwitterAudio
}