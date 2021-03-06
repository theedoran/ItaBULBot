import {} from "dotenv/config.js";
import { Telegraf } from "telegraf";
import logger from "./logger.js";

import {
  showHelp,
  showAddressSearchHelp,
  buildResults,
  showFiberData,
  showFWAData,
  cancelRequests,
  showCityPCNData,
  showAddressData,
} from "./utils.js";

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

// Display cities/regions in inline query.
bot.on("inline_query", async (ctx) => {
  const [results, addressHowTo] = await buildResults(ctx.inlineQuery.query);

  // Cache for 1 hour.
  let msgExtra = { cache_time: 3600 };

  if (addressHowTo) {
    msgExtra = {
      ...msgExtra,
      switch_pm_text: "🔍  Scopri come cercare un indirizzo",
      switch_pm_parameter: "address_search",
    };
  }

  // Cache results for 1 day on Telegram servers.
  return ctx.answerInlineQuery(results, msgExtra).catch((_) => {});
});

// User chose city or region.
bot.on("chosen_inline_result", (ctx) => {
  // City/region or city and egon ids.
  const id = ctx.chosenInlineResult.result_id;

  const addressSearch = id.match(/^address_(\d+)_(\d+)_(.+)$/);

  if (addressSearch) {
    const [_, cityId, streetId, civic] = addressSearch;

    return showAddressData(cityId, streetId, civic, ctx).catch((_) => {});
  }

  // Display fiber data by default.
  return showFiberData(id, ctx).catch((_) => {});
});

// Delete message on cancel button click.
bot.action("cancel_loading", (ctx) => {
  const msgId = ctx.callbackQuery.inline_message_id;

  return ctx
    .editMessageText("❌  Ricerca annullata.")
    .then((_) => cancelRequests.add(msgId))
    .catch((_) => {})
    .finally(() => ctx.answerCbQuery().catch((_) => {}));
});

// Show fiber details.
bot.action(/^show_fiber_details_(\d+)/, (ctx) => {
  const [id] = ctx.match.slice(1);

  return showFiberData(id, ctx)
    .catch((_) => {})
    .finally(() => ctx.answerCbQuery().catch((_) => {}));
});

// Show FWA details.
bot.action(/^show_fwa_details_(\d+)/, (ctx) => {
  const [id] = ctx.match.slice(1);

  return showFWAData(id, ctx)
    .catch((_) => {})
    .finally(() => ctx.answerCbQuery().catch((_) => {}));
});

// Show PCN details.
bot.action(/^show_pcn_details_(.+)_(\d+)/, (ctx) => {
  const [prevStatus, cityId] = ctx.match.slice(1);

  return showCityPCNData(prevStatus, cityId, ctx)
    .catch((_) => {})
    .finally(() => ctx.answerCbQuery().catch((_) => {}));
});

// Launch bot
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
