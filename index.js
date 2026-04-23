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

  const match = message.content.match(/https?:\/\/\S+/);
  if (!match) return;

  const url = match[0];

  try {
    const res = await axios.post(
      "https://open.kakobuy.com/open/pic/qcImage",
      {
        token: "TUTAJ_WKLEJ_TOKEN_OD_CHINKI",
        goodsUrl: url
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (res.data.status !== "success") {
      return message.reply(`❌ API error: ${res.data.message}`);
    }

    const images = res.data.data.map(i => i.image_url);

    if (!images.length) {
      return message.reply("❌ Brak QC zdjęć");
    }

    await message.reply(`📸 Znaleziono ${images.length} zdjęć`);

    for (let i = 0; i < Math.min(images.length, 5); i++) {
      await message.channel.send({
        files: [images[i]],
      });
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
    message.reply("❌ Błąd API");
  }
}
