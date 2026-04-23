const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const axios = require("axios");
const cheerio = require("cheerio");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔐 TOKEN (z Railway Variables)
const TOKEN = process.env.TOKEN;

// 📌 ID kanałów
const LINK_CHANNEL_ID = "1495453163019567315";
const QC_CHANNEL_ID = "1495795428698882109";

// 🔒 cooldown
const cooldown = new Set();

client.on("clientReady", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    const match = message.content.match(/https?:\/\/\S+/);
    if (!match) return;

    let url = match[0];

    // =========================
    // 🔗 LINK CONVERTER
    // =========================
    if (message.channel.id === LINK_CHANNEL_ID) {

      const key = message.author.id + "_" + message.content;
      if (cooldown.has(key)) return;
      cooldown.add(key);
      setTimeout(() => cooldown.delete(key), 4000);

      if (url.includes("acbuy.com")) {
        const inner = url.match(/url=([^&]+)/);
        if (inner) url = decodeURIComponent(inner[1]);
      }

      if (!/(taobao|weidian|1688|usfans|acbuy|litbuy)/i.test(url)) return;

      const kakobuy = `https://www.kakobuy.com/item/details?url=${encodeURIComponent(url)}&affcode=kdreps`;

      const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle("Twoje przekonwertowane linki!")
        .setDescription("Kliknij przycisk poniżej 👇");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Kakobuy")
          .setStyle(ButtonStyle.Link)
          .setURL(kakobuy)
      );

      return message.reply({
        embeds: [embed],
        components: [row],
        allowedMentions: { repliedUser: false }
      });
    }

    // =========================
    // 📸 QC FINDER (SCRAPING)
    // =========================
    if (message.channel.id === QC_CHANNEL_ID) {

      const idMatch = url.match(/itemID=(\d+)/);

      if (!idMatch) {
        return message.reply("❌ Nie mogę znaleźć itemID");
      }

      const searchUrl = `https://qc.photos/?url=${encodeURIComponent(url)}`;

      try {
        const res = await axios.get(searchUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
});
        const res = await axios.get(searchUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

const $ = cheerio.load(res.data);
const images = [];

$("img[src]").each((i, el) => {
  const src = $(el).attr("src");

  if (
    src &&
    src.startsWith("http") &&
    !src.includes("logo") &&
    !src.includes("icon")
  ) {
    images.push(src);
  }
});

        if (!images.length) {
          return message.reply("❌ Nie znaleziono QC zdjęć");
        }

        await message.reply(`📸 Znaleziono ${images.length} zdjęć QC`);

        // max 5 zdjęć
        for (let i = 0; i < Math.min(images.length, 5); i++) {
          await message.channel.send({
            files: [images[i]],
          });
        }

      } catch (err) {
        console.error(err);
        message.reply("❌ Błąd pobierania QC");
      }
    }

  } catch (err) {
    console.error("ERROR:", err);
  }
});

client.login(TOKEN);
