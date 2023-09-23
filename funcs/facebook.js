const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { getBuffer, filterAlphanumericWithDash } = require('./functions');
const { readDb, writeDb, addUserDb, changeBoolDb } = require('./database');
const util = require('util');

function fbdown(link){
	return new Promise((resolve,reject) => {
	let config = {
		'url': link
		}
			axios('https://www.getfvid.com/downloader',{
			method: 'POST',
			data: new URLSearchParams(Object.entries(config)),
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
				"X-XSRF-TOKEN": "eyJpdiI6IkVNbUtrYm5UVlNBXC96cExtaXBCcDl3PT0iLCJ2YWx1ZSI6ImM4cG9XMWk1ZDNkcyt6VjJKd3pvZitOd1lJU1JMMHNFRlwvYXB2b2VJYnB5OTRCQmRHRWI4akZ0SWVPVzJ6NEZUVnNFckZ6R0Z6TDNackRLenJhWlVaUT09IiwibWFjIjoiN2MzNDZlNjExYjE4YzBhZTEzZmViNjg5NWNlY2Y2ZjY1Y2JhZDRiZTZlZjU0NmVmMzY0N2ZmM2NkODVlNTk5OSJ9",
				"cookie": "XSRF-TOKEN=eyJpdiI6IkVNbUtrYm5UVlNBXC96cExtaXBCcDl3PT0iLCJ2YWx1ZSI6ImM4cG9XMWk1ZDNkcyt6VjJKd3pvZitOd1lJU1JMMHNFRlwvYXB2b2VJYnB5OTRCQmRHRWI4akZ0SWVPVzJ6NEZUVnNFckZ6R0Z6TDNackRLenJhWlVaUT09IiwibWFjIjoiN2MzNDZlNjExYjE4YzBhZTEzZmViNjg5NWNlY2Y2ZjY1Y2JhZDRiZTZlZjU0NmVmMzY0N2ZmM2NkODVlNTk5OSJ9;"
			}
		})
	.then(async({ data }) => {
		const $ = cheerio.load(data)
		resolve({
			Normal_video: $('body > div.page-content > div > div > div.col-lg-10.col-md-10.col-centered > div > div:nth-child(3) > div > div.col-md-4.btns-download > p:nth-child(1) > a').attr('href'),
			HD: $('body > div.page-content > div > div > div.col-lg-10.col-md-10.col-centered > div > div:nth-child(3) > div > div.col-md-4.btns-download > p:nth-child(1) > a').attr('href'),
			audio: $('body > div.page-content > div > div > div.col-lg-10.col-md-10.col-centered > div > div:nth-child(3) > div > div.col-md-4.btns-download > p:nth-child(2) > a').attr('href'),
		  thumb: $('.img-video').css('background-image').slice(4, -1).replace(/"/g, "")
			})
		})
	.catch(reject)
	})
}

async function getFacebook(bot, chatId, url) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    let get = await fbdown(url);
    let data = get.HD ? [[{ text: 'Download Normal Video', callback_data: 'fbn ' + chatId }], [{ text: 'Download HD Video', callback_data: 'fbh ' + chatId }], [{ text: 'Download Audio Only', callback_data: 'fba ' + chatId, }]] : [[{ text: 'Download Normal Video', callback_data: 'fbn ' + chatId }], [{ text: 'Download Audio Only', callback_data: 'fba ' + chatId, }]];
    let db = await readDb('./database.json');
    db[chatId] = {
      fbnormal: get.Normal_video,
      fbhd: get.HD ? get.HD : '',
      fbmp3: get.audio
    };
    await writeDb(db, './database.json');
    let options = {
      caption: 'Please select the following options!',
      reply_markup: JSON.stringify({
        inline_keyboard: data
      })
    };
    await bot.sendPhoto(chatId, get.thumb ? get.thumb : 'https://telegra.ph/file/35683519e0893130739da.jpg', options);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n• Url: ${url}\n\n${err}`.trim());
    await bot.editMessageText('An error occurred, failed to download the video!', { chat_id: chatId, message_id: load.message_id });
  }
}

async function getFacebookNormal(bot, chatId) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  let db = await readDb('./database.json');
  try {
    await bot.sendVideo(chatId, db[chatId].fbnormal);
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n\n${err}`.trim());
    await bot.editMessageText('Failed to download the video!\n\nPlease download it yourself in your browser\n' + db[chatId].fbnormal, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  }
}

async function getFacebookHD(bot, chatId) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  let db = await readDb('./database.json');
  try {
    await bot.sendVideo(chatId, db[chatId].fbhd);
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n\n${err}`.trim());
    await bot.editMessageText('Failed to download the video!\n\nPlease download it yourself in your browser\n' + db[chatId].fbhd, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  }
}

async function getFacebookAudio(bot, chatId) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  let db = await readDb('./database.json');
  try {
    let buff = await getBuffer(db[chatId].fbmp3)
    await fs.writeFileSync('content/Facebook_audio_' + chatId + '.mp3', buff);
    await bot.sendAudio(chatId, 'content/Facebook_audio_' + chatId + '.mp3');
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(1798659423, `Error\n• ChatId: ${chatId}\n\n${err}`.trim());
    await bot.editMessageText('Failed to send the audio!\n\nPlease download it yourself in your browser\n' + db[chatId].fbmp3, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  }
}

module.exports = {
  getFacebook,
  getFacebookNormal,
  getFacebookHD,
  getFacebookAudio
}