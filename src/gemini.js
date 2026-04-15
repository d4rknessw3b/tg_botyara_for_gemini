const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  /**
   * @param {string} apiKey — ключ API Google Gemini
   * @param {string} modelName — название модели (по умолчанию gemini-2.0-flash)
   */
  constructor(apiKey, modelName = "gemini-2.0-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Генерация текстового ответа с учётом истории диалога.
   * @param {string} prompt — сообщение пользователя
   * @param {Array<{role: string, parts: Array<{text: string}>}>} history — история диалога
   * @returns {Promise<string>} — ответ модели
   */
  async generateResponse(prompt, history = []) {
    try {
      const chat = this.model.startChat({
        history: history,
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Ошибка Gemini API:", error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Анализ изображения с помощью Gemini Vision.
   * @param {Buffer} imageBuffer — буфер изображения
   * @param {string} mimeType — MIME-тип (например, image/jpeg)
   * @param {string} prompt — текстовый запрос к изображению
   * @returns {Promise<string>} — ответ модели
   */
  async analyzeImage(imageBuffer, mimeType, prompt = "Опиши, что изображено на этой картинке.") {
    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Ошибка Gemini Vision API:", error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Получить название текущей модели.
   * @returns {string}
   */
  getModelName() {
    return this.modelName;
  }

  /**
   * Обработка ошибок API и формирование понятного сообщения.
   * @param {Error} error
   * @returns {Error}
   */
  _handleError(error) {
    const message = error.message || "";

    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return new Error("❌ Неверный API-ключ Gemini. Проверьте GEMINI_API_KEY в .env");
    }
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      return new Error("⏳ Превышен лимит запросов к Gemini API. Попробуйте позже.");
    }
    if (message.includes("SAFETY")) {
      return new Error("🛡️ Ответ заблокирован фильтрами безопасности Gemini.");
    }
    if (message.includes("blocked")) {
      return new Error("🚫 Запрос был заблокирован. Попробуйте переформулировать.");
    }

    return new Error(`⚠️ Ошибка Gemini: ${message}`);
  }
}

module.exports = GeminiService;
