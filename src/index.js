require("dotenv").config();

const GeminiService = require("./gemini");
const TelegramBot = require("./bot");

// ─── Валидация переменных окружения ────────────────────────────────

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MAX_HISTORY_LENGTH = parseInt(process.env.MAX_HISTORY_LENGTH, 10) || 20;

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "your_telegram_bot_token_here") {
  console.error("❌ Ошибка: укажите TELEGRAM_BOT_TOKEN в файле .env");
  console.error("   Получить токен: https://t.me/BotFather");
  process.exit(1);
}

if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
  console.error("❌ Ошибка: укажите GEMINI_API_KEY в файле .env");
  console.error("   Получить ключ: https://aistudio.google.com/apikey");
  process.exit(1);
}

// ─── Запуск ────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("   🚀 Telegram Gemini Bot");
  console.log("═══════════════════════════════════════");
  console.log();

  // Инициализация сервисов
  const geminiService = new GeminiService(GEMINI_API_KEY, GEMINI_MODEL);
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, geminiService, MAX_HISTORY_LENGTH);

  // Корректное завершение при сигналах
  const shutdown = () => {
    console.log("\n⏳ Завершение работы...");
    bot.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Запуск
  await bot.start();
}

main().catch((error) => {
  console.error("💥 Критическая ошибка:", error.message);
  process.exit(1);
});
