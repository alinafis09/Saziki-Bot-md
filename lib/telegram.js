import TelegramBot from "node-telegram-bot-api"

import fs from "fs/promises"

import { existsSync } from "fs"

import path from "path"

import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// ========= CONFIGURATION =========
const CONFIG = {
  TOKEN: "8331333368:AAFAWNSAeRE9tlrRhkazrnIiB5W1qQoY494",
  OWNER: "https://wa.me/212719558797",
  WA_CHANNEL: "https://whatsapp.com/channel/0029VbB8fdr4inolWgXQ8l2a",
  TG_CHANNEL: "https://t.me/sazikigehak",
  WA_GROUP: "https://chat.whatsapp.com/HsiI2G8qVGS9W8Rjo6Hzvh?mode=gi_t",

  KEY_PREFIX: "Sazi-",

  KEY_LENGTH: 8,

  DB_PATH: path.join(__dirname, "./keys.json")

}

// ========= LOGGER =========

const logger = {

  info: (...args) => console.log(`[${new Date().toISOString()}] INFO:`, ...args),

  error: (...args) => console.error(`[${new Date().toISOString()}] ERROR:`, ...args),

  warn: (...args) => console.warn(`[${new Date().toISOString()}] WARN:`, ...args)

}

// ========= DATABASE MANAGER =========

class DatabaseManager {

  constructor(dbPath) {

    this.dbPath = dbPath

    this.cache = null

  }

  async initialize() {

    try {

      if (!existsSync(this.dbPath)) {

        await fs.writeFile(this.dbPath, JSON.stringify({ keys: [] }, null, 2))

        logger.info(`Database created at ${this.dbPath}`)

      }

      await this.load()

    } catch (error) {

      logger.error('Failed to initialize database:', error)

      throw error

    }

  }

  async load() {

    try {

      const data = await fs.readFile(this.dbPath, 'utf8')

      this.cache = JSON.parse(data)

    } catch (error) {

      logger.error('Failed to load database:', error)

      this.cache = { keys: [] }

    }

  }

  async save() {

    try {

      await fs.writeFile(this.dbPath, JSON.stringify(this.cache, null, 2))

      logger.info('Database saved successfully')

    } catch (error) {

      logger.error('Failed to save database:', error)

      throw error

    }

  }

  async addKey(key) {

    if (!this.cache) await this.load()

    this.cache.keys.push(key)

    await this.save()

    return key

  }

  async getKeys() {

    if (!this.cache) await this.load()

    return [...this.cache.keys]

  }

}

// ========= KEY GENERATOR =========

class KeyGenerator {

  constructor(prefix = "Sazi-", length = 8) {

    this.prefix = prefix

    this.length = length

  }

  generate() {

    const randomPart = Math.random()

      .toString(36)

      .slice(2, 2 + this.length)

      .toUpperCase()

    return `${this.prefix}${randomPart}`

  }

  validate(key) {

    return key.startsWith(this.prefix) && key.length === this.prefix.length + this.length

  }

}

// ========= BOT HANDLER =========

class BotHandler {

  constructor(bot, db, keyGen, config) {

    this.bot = bot

    this.db = db

    this.keyGen = keyGen

    this.config = config

    this.setupHandlers()

  }

  setupHandlers() {

    // Start command handler

    this.bot.onText(/\/start/, this.handleStart.bind(this))

    

    // Callback query handler

    this.bot.on('callback_query', this.handleCallback.bind(this))

    

    // Error handler

    this.bot.on('polling_error', this.handleError.bind(this))

    this.bot.on('webhook_error', this.handleError.bind(this))

  }

  async handleStart(msg) {

    try {

      const name = msg.from.first_name || 'User'

      const chatId = msg.chat.id

      logger.info(`Start command from user ${msg.from.id} (${name})`)

      await this.bot.sendMessage(chatId,

        `👋 *Welcome ${name} to Saziki! Here you will find the key to using your bot correctly.*\n` +

        `🤖 *SAZIKI SYSTEM*\n` +

        `Advanced Bot Access Panel\n\n` +

        `Choose option below:`,

        {

          parse_mode: "Markdown",

          reply_markup: {

            inline_keyboard: [

              [{ text: "🔑 Generate Key", callback_data: "getkey" }],

              [{ text: "👑 Owner", url: this.config.OWNER }],

              [

                { text: "📢 WhatsApp Channel", url: this.config.WA_CHANNEL },

                { text: "📢 Telegram Channel", url: this.config.TG_CHANNEL }

              ],

              [{ text: "👥 WhatsApp Group", url: this.config.WA_GROUP }]

            ]

          }

        }

      )

    } catch (error) {

      logger.error('Error in handleStart:', error)

      await this.bot.sendMessage(msg.chat.id, "❌ An error occurred. Please try again later.")

    }

  }

  async handleCallback(query) {

    try {

      const chatId = query.message.chat.id

      const data = query.data

      logger.info(`Callback query from user ${query.from.id}: ${data}`)

      switch (data) {

        case "getkey":

          await this.handleGetKey(query)

          break

        default:

          logger.warn(`Unknown callback data: ${data}`)

      }

      await this.bot.answerCallbackQuery(query.id)

    } catch (error) {

      logger.error('Error in handleCallback:', error)

      await this.bot.answerCallbackQuery(query.id, {

        text: "❌ An error occurred",

        show_alert: true

      })

    }

  }

  async handleGetKey(query) {

    try {

      const chatId = query.message.chat.id

      const key = this.keyGen.generate()

      

      await this.db.addKey(key)

      

      logger.info(`Generated key for user ${query.from.id}: ${key}`)

      await this.bot.sendMessage(chatId,

        `✅ *Your Access Key*\n\n` +

        `\`${key}\`\n\n` +

        `Save it. You will need it for login.`,

        { parse_mode: "Markdown" }

      )

    } catch (error) {

      logger.error('Error in handleGetKey:', error)

      await this.bot.sendMessage(query.message.chat.id, 

        "❌ Failed to generate key. Please try again later."

      )

    }

  }

  handleError(error) {

    logger.error('Bot polling error:', error)

  }

}

// ========= MAIN APPLICATION =========

class TelegramBotApp {

  constructor(config) {

    this.config = config

    this.bot = null

    this.db = null

    this.keyGen = null

    this.handler = null

  }

  async initialize() {

    try {

      logger.info('Initializing Telegram Bot...')

      // Validate token

      if (this.config.TOKEN === "PUT_TOKEN_HERE") {

        throw new Error("Please set your Telegram bot token in CONFIG.TOKEN")

      }

      // Initialize components

      this.bot = new TelegramBot(this.config.TOKEN, { 

        polling: true,

        polling: {

          interval: 300,

          autoStart: true,

          params: {

            timeout: 10

          }

        }

      })

      this.db = new DatabaseManager(this.config.DB_PATH)

      await this.db.initialize()

      this.keyGen = new KeyGenerator(

        this.config.KEY_PREFIX,

        this.config.KEY_LENGTH

      )

      this.handler = new BotHandler(

        this.bot,

        this.db,

        this.keyGen,

        this.config

      )

      logger.info('Telegram Bot initialized successfully')

      

      // Setup graceful shutdown

      this.setupGracefulShutdown()

      

    } catch (error) {

      logger.error('Failed to initialize bot:', error)

      process.exit(1)

    }

  }

  setupGracefulShutdown() {

    const shutdown = async () => {

      logger.info('Shutting down gracefully...')

      

      if (this.bot) {

        await this.bot.stopPolling()

        logger.info('Bot polling stopped')

      }

      

      process.exit(0)

    }

    process.on('SIGINT', shutdown)

    process.on('SIGTERM', shutdown)

  }

  async start() {

    await this.initialize()

    logger.info('Bot is running. Press Ctrl+C to stop.')

  }

}

// ========= APPLICATION ENTRY POINT =========

const app = new TelegramBotApp(CONFIG)

// Start the application

app.start().catch(error => {

  logger.error('Fatal error:', error)

  process.exit(1)

})

export { app, CONFIG, logger, DatabaseManager, KeyGenerator, BotHandler }