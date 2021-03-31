import {} from "dotenv/config.js";
import { Telegraf } from "telegraf";
import logger from "./logger.js";

import { showHelp, showAddressSearchHelp } from "./utils.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

// Only log when debugging.
if (process.env.DEBUG) {
  // Log to console.
  bot.use(logger);
}

// Start/help info message (works for private chats only).
bot.command(
  ["start", "aiuto"],
  (ctx, next) => ctx.chat.type === "private" && next(),
  (ctx) => {
    const addressSearch = ctx.message.text.endsWith("address_search");

    // If user wants to do an address search, show the how-to message.
    if (addressSearch) {
      return showAddressSearchHelp(ctx).catch((_) => {});
    }

    // Otherwise, show the classic help message.
    showHelp(ctx).catch((_) => {});
  },
);

// Address search info message (works for private chats only).
bot.command(
  "indirizzo",
  (ctx, next) => ctx.chat.type === "private" && next(),
  (ctx) => showAddressSearchHelp(ctx).catch((_) => {}),
);

// Display Bugliano entry.
bot.on("inline_query", async (ctx) => {
  // Cache results for 1 day on Telegram servers.
  return ctx
    .answerInlineQuery(
      [
        {
          type: "article",
          id: "bugliano",
          title: "Bugliano",
          description: "Toscana",
          input_message_content: {
            message_text:
              "<b>Bugliano</b> risulta coperta da <b>FTTH 10000 Gbps/s FWA VHCN & Antani</b>, come se fosse Antani, anche per il direttore.\n\n<i>I cittadini ringraziano tutta l'amministrazione comunale ed in particolare il sindaco</i> <b>Fabio Buggiani</b> per l'innovazione tecnologica.",
            parse_mode: "HTML",
          },
        },
      ],
      { cache_time: 3600 },
    )
    .catch((_) => {});
});

// Launch bot
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
