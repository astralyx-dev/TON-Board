import { Telegraf } from "telegraf";

import config from "../config.js";

const bot = new Telegraf(config.botToken);

const createPost = async (message, disableNotify) => {
    let post = await bot.telegram.sendMessage(config.channelId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: disableNotify
    });
    return post;
}

const pinMessage = async (messageId) => {
    await bot.telegram.pinChatMessage(config.channelId, messageId);
}

export { createPost, pinMessage };