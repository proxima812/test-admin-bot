import { Bot } from "grammy"
import simpleGit from "simple-git"
import fs from "fs"
import path from "path"
import { format } from "date-fns"
import dotenv from "dotenv"

dotenv.config() // Загружаем переменные окружения

export const {
	// Telegram bot token from t.me/BotFather
	TELEGRAM_BOT_TOKEN: token,
	REPO_PATH: repoPath,
	// Secret token to validate incoming updates
	TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop(),
} = process.env

// Default grammY bot instance
export const bot = new Bot(token)

// Инициализация Git
const git = simpleGit(repoPath)

// Хранилище для сессий пользователей
const sessions = new Map()

// Обработчик команды /start
bot.command("start", ctx => {
	ctx.reply("Привет! Давайте создадим новый пост. Введите заголовок:")
	sessions.set(ctx.chat.id, { step: "title" })
})

// Обработчик текстовых сообщений
bot.on("message:text", async ctx => {
	const chatId = ctx.chat.id
	const session = sessions.get(chatId)

	// Проверяем, есть ли сессия для пользователя
	if (!session) {
		ctx.reply("Начните с команды /start.")
		return
	}

	const message = ctx.message.text

	switch (session.step) {
		case "title":
			// Шаг: заголовок
			session.title = message
			session.step = "description"
			ctx.reply("Теперь введите описание:")
			break

		case "description":
			// Шаг: описание
			session.description = message
			session.step = "content"
			ctx.reply(
				"Отлично! Теперь введите текст поста (можно использовать форматирование Markdown):",
			)
			break

		case "content":
			// Шаг: контент
			session.content = message
			const fileName = `post-${Date.now()}.md`
			const filePath = path.join(repoPath, fileName)

			// Создаем содержимое файла .md
			const markdownContent = `---
title: ${session.title}
description: ${session.description}
pubDate: ${format(new Date(), "yyyy-MM-dd")}
---

${session.content}
`

			// Сохраняем файл
			try {
				fs.writeFileSync(filePath, markdownContent)

				// Добавляем и пушим в репозиторий
				await git.add(filePath)
				await git.commit(`Добавлен новый пост: ${session.title}`)
				await git.push()

				ctx.reply("Пост успешно добавлен и запушен в репозиторий!")

				// Очищаем сессию
				sessions.delete(chatId)
			} catch (error) {
				console.error("Ошибка при работе с Git:", error)
				ctx.reply("Произошла ошибка при добавлении поста в репозиторий.")
			}
			break

		default:
			ctx.reply("Неизвестная команда. Попробуйте заново.")
			break
	}
})
