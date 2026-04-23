require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔐 TOKEN
const TOKEN = process.env.TOKEN;

// 📌 ID kanałów
const LINK_CHANNEL_ID = "1495453163019567315";
const QC_CHANNEL_ID = "1495795428698882109";

// 🔒 cooldown tylko do link convertera
const cooldown = new Set();

client.on("clientReady", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    console.log("MSG:", message.content);
    console.log("CHANNEL:", message.channel.id);

    // 🔗 znajdź link
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

      console.log("LINK CHANNEL TRIGGERED");

      // decode ACBUY
      if (url.includes("acbuy.com")) {
        const inner = url.match(/url=([^&]+)/);
        if (inner) {
          url = decodeURIComponent(inner[1]);
        }
      }

      // tylko wspierane
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
          .setEmoji("<:kako:1495469729119338821>")
      );

      return message.reply({
        embeds: [embed],
        components: [row],
        allowedMentions: { repliedUser: false }
      });
    }

    // =========================
    // 📸 QC FINDER
    // =========================
    if (message.channel.id === QC_CHANNEL_ID) {

  console.log("QC CHANNEL TRIGGERED");

  // wyciągnij itemID z weidian
  const idMatch = url.match(/itemID=(\d+)/);

  if (!idMatch) {
    return message.reply("❌ Nie mogę znaleźć itemID w linku");
  }

  const itemID = idMatch[1];

  // 🔗 linki do QC
  const qcPhotos = `https://qc.photos/?url=${encodeURIComponent(url)}`;
  const finds = `https://qcfinder.com/?url=${encodeURIComponent(url)}`;

  const embed = new EmbedBuilder()
    .setColor("#2b2d31")
    .setTitle("📸 QC Finder")
    .setDescription(`Item ID: **${itemID}**\nKliknij poniżej żeby zobaczyć QC`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("QC Photos")
      .setStyle(ButtonStyle.Link)
      .setURL(qcPhotos),
    new ButtonBuilder()
      .setLabel("QC Finder")
      .setStyle(ButtonStyle.Link)
      .setURL(finds)
  );

    return message.reply({
    embeds: [embed],
    components: [row],
  });
}

  } catch (err) {
    console.error("ERROR:", err);
  }
});

client.login(TOKEN);
