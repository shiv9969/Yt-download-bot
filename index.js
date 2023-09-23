/* required to disable the deprecation warning, 
will be fixed when node-telegram-bot-api gets a new update */
require('dotenv').config()
process.env['NTBA_FIX_350'] = 1
let express = require('express');
let app = express();
let TelegramBot = require('node-telegram-bot-api')
let {
  getTiktokInfo,
  tiktokVideo,
  tiktokAudio,
  tiktokSound
} = require('./funcs/tiktok')
let {
  getDataTwitter,
  downloadTwitterHigh,
  downloadTwitterLow,
  downloadTwitterAudio
} = require('./funcs/twitter')
let {
  getPlaylistSpotify,
  getAlbumsSpotify,
  getSpotifySong
} = require('./funcs/spotify')
let {
  downloadInstagram
} = require('./funcs/instagram')
let {
  pinterest
} = require('./funcs/pinterest')
let {
  getYoutube,
  getYoutubeAudio,
  getYoutubeVideo
} = require('./funcs/youtube')
let {
  getFacebook,
  getFacebookNormal,
  getFacebookHD,
  getFacebookAudio
} = require('./funcs/facebook')
let {
  getNetworkUploadSpeed,
  getNetworkDownloadSpeed,
} = require('./funcs/dev')
let {
  readDb,
  writeDb,
  addUserDb,
  changeBoolDb
} = require('./funcs/database')
let userLocks = {};
let token = process.env.TOKEN
let bot = new TelegramBot(token, { polling: true })
// Bot Settings
let botName = 'Social Media Dowloader Bot';
app.get('/', async (req, res) => {
  res.send({
    Status: "Active"
  })
})

app.listen(5000, function() {});
console.log('Bot is running...')

// start
bot.onText(/\/start/, async (msg) => {
  let db = await readDb('./database.json');
  let chatId = msg.chat.id;
  if (!db[chatId]) {
    await addUserDb(chatId, './database.json');
    let response = `Hello I am ${botName},You only need to send the video / audio link then the bot will process it, This bot only supports downloading the following link!\n\n• Youtube\n• Tiktok\n• Instagram\n• Twitter\n• Facebook\n• Pinterest\n• Spotify\n\nBot by @Krxuvv`
    await bot.sendMessage(chatId, response);
    db = await readDb('./database.json');
  } else if (db[chatId]) {
    let response = `Hello I am ${botName},You only need to send the video / audio link then the bot will process it, This bot only supports downloading the following link!\n\n• Youtube\n• Tiktok\n• Instagram\n• Twitter\n• Facebook\n• Pinterest\n• Spotify\n\nBot by @Krxuvv`
    await bot.sendMessage(chatId, response);
  }
})

// !dev commands
// get network upload speed
bot.onText(/\/upload/, async (msg) => {
	let chatId = msg.chat.id
	if (String(msg.from.id) !== String(process.env.DEV_ID)) {
		return
	}
	await getNetworkUploadSpeed(bot, chatId)
})

// get network download speed
bot.onText(/\/download/, async (msg) => {
	let chatId = msg.chat.id
	// if user is not the developer
	if (String(msg.from.id) !== String(process.env.DEV_ID)) {
		return
	}
	await getNetworkDownloadSpeed(bot, chatId)
})

// Tiktok Regex
bot.onText(/https?:\/\/(?:.*\.)?tiktok\.com/, async (msg) => {
  let chatId = msg.chat.id;
  let url = msg.text;
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await getTiktokInfo(bot, chatId, url);
  } finally {
    userLocks[userId] = false;
  }
})

// Twitter Regex
bot.onText(/https?:\/\/(?:.*\.)?twitter\.com/, async (msg) => {
  let chatId = msg.chat.id;
  let url = msg.text;
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await getDataTwitter(bot, chatId, url);
  } finally {
    userLocks[userId] = false;
  }
})

// Instagram Regex
bot.onText(/(https?:\/\/)?(www\.)?(instagram\.com)\/.+/, async (msg) => {
  let chatId = msg.chat.id;
  let url = msg.text;
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await downloadInstagram(bot, chatId, url);
  } finally {
    userLocks[userId] = false;
  }
})

// Pinterest Regex
bot.onText(/(https?:\/\/)?(www\.)?(pinterest\.ca|pinterest\.?com|pin\.?it)\/.+/, async (msg) => {
  let chatId = msg.chat.id;
  let url = msg.text;
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await pinterest(bot, chatId, url);
  } finally {
    userLocks[userId] = false;
  }
})

// Spotify Track Regex
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/track\/.+/, async (msg, match) => {
  let chatId = msg.chat.id;
  let url = match[0];
	let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
		await getSpotifySong(bot, chatId, url)
	} finally {
    userLocks[userId] = false;
  }
})

// Spotify Albums Regex
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/album\/.+/, async (msg, match) => {
	let chatId = msg.chat.id;
  let url = match[0];
	let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
		await getAlbumsSpotify(bot, chatId, url)
	} finally {
    userLocks[userId] = false;
  }
})

// Spotify Playlist Regex
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/playlist\/.+/, async (msg, match) => {
	let chatId = msg.chat.id;
  let url = match[0];
	let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
		await getPlaylistSpotify(bot, chatId, url)
	} finally {
    userLocks[userId] = false;
  }
})

// Youtube Regex
bot.onText(/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/, async (msg, match) => {
	let chatId = msg.chat.id;
  let url = match[0];
	let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
		await getYoutube(bot, chatId, url)
	} finally {
    userLocks[userId] = false;
  }
})

// Facebook Regex
bot.onText(/^https?:\/\/(www\.)?(m\.)?facebook\.com\/.+/, async (msg, match) => {
	let chatId = msg.chat.id;
  let url = match[0];
	let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
		await getFacebook(bot, chatId, url)
	} finally {
    userLocks[userId] = false;
  }
})

bot.on('callback_query', async (mil) => {
  let data = mil.data;
  let url = data.split(' ').slice(1).join(' ');
  let chatid = mil.message.chat.id;
  let msgid = mil.message.message_id;
  if (data.startsWith('tta')) {
    await bot.deleteMessage(chatid, msgid);
    await tiktokAudio(bot, chatid, url);
  } else if (data.startsWith('ttv')) {
    await bot.deleteMessage(chatid, msgid);
    await tiktokVideo(bot, chatid, url);
  } else if (data.startsWith('tts')) {
    await bot.deleteMessage(chatid, msgid);
    await tiktokSound(bot, chatid, url);
  } else if (data.startsWith('twh')) {
    await bot.deleteMessage(chatid, msgid);
    await downloadTwitterHigh(bot, chatid, url);
  } else if (data.startsWith('twl')) {
    await bot.deleteMessage(chatid, msgid);
    await downloadTwitterLow(bot, chatid, url);
  } else if (data.startsWith('twa')) {
    await bot.deleteMessage(chatid, msgid);
    await downloadTwitterAudio(bot, chatid, url);
  } else if (data.startsWith('spt')) {
    await bot.deleteMessage(chatid, msgid);
    await getSpotifySong(bot, chatid, url);
  } else if (data.startsWith('fbn')) {
    await bot.deleteMessage(chatid, msgid);
    await getFacebookNormal(bot, chatid);
  } else if (data.startsWith('fbh')) {
    await bot.deleteMessage(chatid, msgid);
    await getFacebookHD(bot, chatid);
  } else if (data.startsWith('fba')) {
    await bot.deleteMessage(chatid, msgid);
    await getFacebookAudio(bot, chatid);
  } else if (data.startsWith('ytv')) {
    let args = url.split(' ');
    await bot.deleteMessage(chatid, msgid);
    await getYoutubeVideo(bot, chatid, args[0], args[1]);
  } else if (data.startsWith('yta')) {
    let args = url.split(' ');
    await bot.deleteMessage(chatid, msgid);
    await getYoutubeAudio(bot, chatid, args[0], args[1]);
  }
})

process.on('uncaughtException', console.error)