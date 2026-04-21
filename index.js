require("dotenv").config();

const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔐 TOKEN z Railway / .env
const TOKEN = process.env.TOKEN; // ← Wklej token w .env albo Railway (NIE tutaj)

// 📌 ID kanału
const CHANNEL_ID = "1495453163019567315";

// 🔒 blokada duplikatów
const cooldown = new Set();

client.on("ready", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== CHANNEL_ID) return;

    const key = message.author.id + "_" + message.content;
    if (cooldown.has(key)) return;
    cooldown.add(key);
    setTimeout(() => cooldown.delete(key), 4000);

    // 🔗 znajdź link w wiadomości
    const match = message.content.match(/https?:\/\/\S+/);
    if (!match) return;

    let url = match[0];

    // 🔥 ACBUY (decode URL)
    if (url.includes("acbuy.com")) {
      const inner = url.match(/url=([^&]+)/);
      if (inner) {
        url = decodeURIComponent(inner[1]);
      }
    }

    // 🔥 tylko obsługiwane strony
    if (!/(taobao|weidian|1688|usfans|acbuy|litbuy)/i.test(url)) return;

    // 🔗 afiliacyjny Kakobuy
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

    await message.reply({
      embeds: [embed],
      components: [row],
      allowedMentions: { repliedUser: false }
    });

  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);