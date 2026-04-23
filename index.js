const axios = require("axios");

// 📌 ID kanałów
const LINK_CHANNEL_ID = "1495453163019567315";
const QC_CHANNEL_ID = "1495795428698882109";

// 🔒 blokada duplikatów
const cooldown = new Set();

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    const key = message.author.id + "_" + message.content;
    if (cooldown.has(key)) return;
    cooldown.add(key);
    setTimeout(() => cooldown.delete(key), 4000);

    // 🔗 znajdź link
    const match = message.content.match(/https?:\/\/\S+/);
    if (!match) return;

    let url = match[0];

    // =========================
    // 🔗 LINK CONVERTER
    // =========================
    if (message.channel.id === LINK_CHANNEL_ID) {

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

      if (!/(taobao|weidian|1688)/i.test(url)) {
        return message.reply("❌ Niepoprawny link do itemu");
      }

      const res = await axios.post(
        "https://open.kakobuy.com/open/pic/qcImage",
        {
          token: process.env.API_TOKEN,
          goodsUrl: url,
        }
      );

      if (res.data.status !== "success") {
        return message.reply("❌ " + res.data.message);
      }

      const images = res.data.data;

      if (!images.length) {
        return message.reply("❌ Brak QC zdjęć");
      }

      // embed nagłówkowy
      const header = new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle("📸 QC Zdjęcia")
        .setDescription(images[0].product_name);

      await message.reply({ embeds: [header] });

      // wysyłanie zdjęć
      for (const img of images) {
        await message.channel.send({
          content: `📅 ${img.qc_date}`,
          files: [img.image_url],
        });
      }
    }

  } catch (err) {
    console.error(err);
    message.reply("❌ Wystąpił błąd");
  }
});
