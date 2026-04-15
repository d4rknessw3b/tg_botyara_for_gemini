const { Bot, InputFile } = require("grammy");
const GeminiService = require("./gemini");

// Максимальная длина сообщения в Telegram
const TELEGRAM_MAX_LENGTH = 4096;

class TelegramBot {
  /**
   * @param {string} token — токен Telegram-бота
   * @param {GeminiService} geminiService — экземпляр сервиса Gemini
   * @param {number} maxHistoryLength — максимум сообщений в истории
   */
  constructor(token, geminiService, maxHistoryLength = 20) {
    this.bot = new Bot(token);
    this.gemini = geminiService;
    this.maxHistoryLength = maxHistoryLength;
    /** @type {Map<number, Array<{role: string, parts: Array<{text: string}>}>>} */
    this.chatHistories = new Map();

    this._setupCommands();
    this._setupHandlers();
  }

  /**
   * Регистрация команд бота.
   */
  _setupCommands() {
    this.bot.api.setMyCommands([
      { command: "start", description: "Начать работу с ботом" },
      { command: "help", description: "Справка по командам" },
      { command: "clear", description: "Очистить историю диалога" },
      { command: "model", description: "Текущая модель Gemini" },
    ]);
  }

  /**
   * Настройка обработчиков команд и сообщений.
   */
  _setupHandlers() {
    // /start
    this.bot.command("start", async (ctx) => {
      const name = ctx.from?.first_name || "странник";
      await ctx.reply(
        `🌑 Приветствую, *${this._escapeMarkdown(name)}*\\!\n\n` +
        `Я — *D4rkness AI*, цифровой разум из тени интернета\\.\n` +
        `Мне доступны знания в самых разных областях — от кода до философии\\.\n\n` +
        `⌨️ Напишите мне — и я отвечу\n` +
        `🖼️ Отправьте фото — и я расскажу, что вижу\n` +
        `🔄 /clear — начать диалог с чистого листа\n\n` +
        `⚙️ Модель: \`${this._escapeMarkdown(this.gemini.getModelName())}\``,
        { parse_mode: "MarkdownV2" }
      );
    });

    // /help
    this.bot.command("help", async (ctx) => {
      await ctx.reply(
        `📖 *Команды бота:*\n\n` +
        `/start — Приветствие и информация\n` +
        `/help — Эта справка\n` +
        `/clear — Очистить историю диалога\n` +
        `/model — Показать текущую модель\n\n` +
        `💡 *Как пользоваться:*\n\n` +
        `• Просто напишите любой вопрос или сообщение\n` +
        `• Отправьте фото с подписью или без для анализа\n` +
        `• Бот помнит контекст диалога \\(до ${this.maxHistoryLength} сообщений\\)`,
        { parse_mode: "MarkdownV2" }
      );
    });

    // /clear
    this.bot.command("clear", async (ctx) => {
      this.chatHistories.delete(ctx.chat.id);
      await ctx.reply("🌑 Память стёрта. Тени прошлого рассеялись — начнём заново.");
    });

    // /model
    this.bot.command("model", async (ctx) => {
      await ctx.reply(
        `🤖 Текущая модель: \`${this._escapeMarkdown(this.gemini.getModelName())}\``,
        { parse_mode: "MarkdownV2" }
      );
    });

    // Обработка фото
    this.bot.on("message:photo", async (ctx) => {
      await this._handlePhoto(ctx);
    });

    // Обработка текстовых сообщений
    this.bot.on("message:text", async (ctx) => {
      await this._handleText(ctx);
    });

    // Обработка ошибок
    this.bot.catch((err) => {
      console.error("Ошибка бота:", err.message);
    });
  }

  /**
   * Обработка текстового сообщения.
   */
  async _handleText(ctx) {
    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text;

    // Показать индикатор «печатает...»
    await ctx.replyWithChatAction("typing");

    try {
      const history = this._getHistory(chatId);
      const response = await this.gemini.generateResponse(userMessage, history);

      // Сохранить в историю
      this._addToHistory(chatId, "user", userMessage);
      this._addToHistory(chatId, "model", response);

      // Отправить ответ
      await this._sendLongMessage(ctx, response);
    } catch (error) {
      await ctx.reply(error.message || "⚠️ Произошла ошибка. Попробуйте позже.");
    }
  }

  /**
   * Обработка фотографии.
   */
  async _handlePhoto(ctx) {
    await ctx.replyWithChatAction("typing");

    try {
      // Получить файл с максимальным разрешением
      const photos = ctx.message.photo;
      const bestPhoto = photos[photos.length - 1];
      const file = await ctx.api.getFile(bestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`;

      // Скачать изображение
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Определить MIME-тип по расширению
      const ext = file.file_path.split(".").pop().toLowerCase();
      const mimeTypes = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const mimeType = mimeTypes[ext] || "image/jpeg";

      // Подпись пользователя или промпт по умолчанию
      const caption = ctx.message.caption || "Опиши подробно, что изображено на этой картинке.";

      const result = await this.gemini.analyzeImage(buffer, mimeType, caption);

      // Сохранить в историю
      this._addToHistory(ctx.chat.id, "user", `[Фото] ${caption}`);
      this._addToHistory(ctx.chat.id, "model", result);

      await this._sendLongMessage(ctx, result);
    } catch (error) {
      await ctx.reply(error.message || "⚠️ Не удалось проанализировать изображение.");
    }
  }

  /**
   * Получить историю чата.
   * @param {number} chatId
   * @returns {Array}
   */
  _getHistory(chatId) {
    return this.chatHistories.get(chatId) || [];
  }

  /**
   * Добавить сообщение в историю чата.
   * @param {number} chatId
   * @param {"user"|"model"} role
   * @param {string} text
   */
  _addToHistory(chatId, role, text) {
    if (!this.chatHistories.has(chatId)) {
      this.chatHistories.set(chatId, []);
    }
    const history = this.chatHistories.get(chatId);
    history.push({ role, parts: [{ text }] });

    // Ограничить размер истории
    while (history.length > this.maxHistoryLength * 2) {
      history.shift();
    }
  }

  /**
   * Отправка длинных сообщений с разбивкой.
   * Пытается отправить в MarkdownV2, при ошибке — обычным текстом.
   */
  async _sendLongMessage(ctx, text) {
    const chunks = this._splitMessage(text);

    for (const chunk of chunks) {
      try {
        const formatted = this._formatForTelegram(chunk);
        await ctx.reply(formatted, { parse_mode: "MarkdownV2" });
      } catch {
        // Если Markdown не сработал, отправим plain text
        await ctx.reply(chunk);
      }
    }
  }

  /**
   * Разбить сообщение на части по лимиту Telegram.
   * @param {string} text
   * @returns {string[]}
   */
  _splitMessage(text) {
    if (text.length <= TELEGRAM_MAX_LENGTH) {
      return [text];
    }

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= TELEGRAM_MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }

      // Ищем подходящее место для разбивки
      let splitIndex = remaining.lastIndexOf("\n\n", TELEGRAM_MAX_LENGTH);
      if (splitIndex === -1 || splitIndex < TELEGRAM_MAX_LENGTH / 2) {
        splitIndex = remaining.lastIndexOf("\n", TELEGRAM_MAX_LENGTH);
      }
      if (splitIndex === -1 || splitIndex < TELEGRAM_MAX_LENGTH / 2) {
        splitIndex = remaining.lastIndexOf(" ", TELEGRAM_MAX_LENGTH);
      }
      if (splitIndex === -1) {
        splitIndex = TELEGRAM_MAX_LENGTH;
      }

      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex).trimStart();
    }

    return chunks;
  }

  /**
   * Форматирование текста для Telegram MarkdownV2.
   * Экранирует специальные символы, но сохраняет базовое форматирование.
   * @param {string} text
   * @returns {string}
   */
  _formatForTelegram(text) {
    // Сначала обработаем блоки кода — их экранировать не нужно
    const codeBlocks = [];
    let processed = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      const index = codeBlocks.length;
      codeBlocks.push("```" + code + "```");
      return `%%CODEBLOCK_${index}%%`;
    });

    // Инлайн-код
    const inlineCode = [];
    processed = processed.replace(/`([^`]+)`/g, (match, code) => {
      const index = inlineCode.length;
      inlineCode.push("`" + code + "`");
      return `%%INLINECODE_${index}%%`;
    });

    // Экранирование специальных символов MarkdownV2
    processed = processed.replace(/([_*\[\]()~>#+=|{}.!\\-])/g, "\\$1");

    // Восстановить жирный текст (**text** → *text*)
    processed = processed.replace(/\\\*\\\*(.*?)\\\*\\\*/g, "*$1*");

    // Восстановить курсив (*text* → _text_)
    processed = processed.replace(/\\\*(.*?)\\\*/g, "_$1_");

    // Вернуть блоки кода
    codeBlocks.forEach((block, i) => {
      processed = processed.replace(`%%CODEBLOCK_${i}%%`, block);
    });
    inlineCode.forEach((code, i) => {
      processed = processed.replace(`%%INLINECODE_${i}%%`, code);
    });

    return processed;
  }

  /**
   * Экранирование текста для MarkdownV2.
   * @param {string} text
   * @returns {string}
   */
  _escapeMarkdown(text) {
    return text.replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, "\\$1");
  }

  /**
   * Запуск бота (long polling).
   */
  async start() {
    console.log("🤖 Бот запущен!");
    console.log(`📡 Модель: ${this.gemini.getModelName()}`);
    await this.bot.start();
  }

  /**
   * Остановка бота.
   */
  stop() {
    this.bot.stop();
    console.log("🔴 Бот остановлен.");
  }
}

module.exports = TelegramBot;
