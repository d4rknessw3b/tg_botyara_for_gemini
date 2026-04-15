# 🤖 Telegram Gemini Bot

Телеграм-бот для общения с нейросетью **Google Gemini**. Поддерживает текстовые диалоги с сохранением контекста и анализ изображений.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)

---

## ✨ Возможности

- 💬 **Текстовые диалоги** — общение с Gemini с сохранением контекста разговора
- 🖼️ **Анализ изображений** — отправьте фото и получите описание или ответ на вопрос
- 📜 **История диалога** — бот помнит контекст (настраиваемая глубина)
- 📝 **Форматирование** — ответы форматируются для Telegram (жирный, курсив, код)
- ⚡ **Быстрый старт** — минимальная настройка, готов к работе за минуту

## 📋 Требования

- [Node.js](https://nodejs.org/) **18.0+**
- Telegram Bot Token — получить у [@BotFather](https://t.me/BotFather)
- Google Gemini API Key — получить в [Google AI Studio](https://aistudio.google.com/apikey)

## 🚀 Установка и запуск

### 1. Клонируйте репозиторий

```bash
https://github.com/d4rknessw3b/tg_botyara_for_gemini.git
cd tg_botyara_for_gemini
```

### 2. Установите зависимости

```bash
npm install
```

### 3. Настройте переменные окружения

Скопируйте шаблон и заполните своими данными:

```bash
cp .env.example .env
```

Откройте `.env` и укажите:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
GEMINI_API_KEY=ваш_ключ_от_google_ai_studio
```

### 4. Запустите бота

```bash
npm start
```

## ⚙️ Конфигурация

| Переменная | Описание | По умолчанию |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота | *обязательно* |
| `GEMINI_API_KEY` | API-ключ Google Gemini | *обязательно* |
| `GEMINI_MODEL` | Модель Gemini | `gemini-2.0-flash` |
| `MAX_HISTORY_LENGTH` | Макс. сообщений в истории | `20` |

## 🎮 Команды бота

| Команда | Описание |
|---|---|
| `/start` | Приветствие и информация о боте |
| `/help` | Справка по командам |
| `/clear` | Очистить историю диалога |
| `/model` | Показать текущую модель Gemini |

## 📁 Структура проекта

```
tg-gemini-bot/
├── .env.example       # Шаблон переменных окружения
├── .gitignore         # Игнорируемые файлы
├── package.json       # Зависимости и скрипты
├── README.md          # Документация
├── LICENSE            # Лицензия MIT
└── src/
    ├── index.js       # Точка входа
    ├── gemini.js      # Сервис интеграции с Gemini
    └── bot.js         # Логика Telegram-бота
```

## 📄 Лицензия

MIT — подробности в файле [LICENSE](LICENSE).
