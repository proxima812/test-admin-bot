import {Bot} from "grammy";

export const {

    // Telegram bot token from t.me/BotFather
    TELEGRAM_BOT_TOKEN: token,

    // Secret token to validate incoming updates
    TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop()

} = process.env;


// Default grammY bot instance
export const bot = new Bot(token);


// Обработчик команды /start
bot.command("start", (ctx) => {
  ctx.reply("Привет! Давайте создадим новый пост. Введите заголовок:");
  sessions.set(ctx.chat.id, { step: "title" });
});

