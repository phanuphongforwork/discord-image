const { Client, GatewayIntentBits } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const express = require("express");

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});
const supabase = createClient(supabaseUrl, supabaseKey);

bot.on("ready", () => {
  console.log(`Bot connected as ${bot.user?.tag}`);
});

bot.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore messages from other bots

  if (message.content.startsWith(process.env.IMAGE_PREFIX || "!")) {
    const command = message.content.slice(1).trim(); // Extract the command from the message content, excluding the prefix

    const { data: mediaData, error } = await supabase
      .from("media")
      .select("*")
      .eq("command", command)
      .single();

    if (error) {
      console.error("Error querying media table:", error);
      return;
    }

    if (mediaData) {
      const { data, error: urlError } = await supabase.storage
        .from("media")
        .createSignedUrl(`images/${mediaData.id}/${mediaData.name}`, 60);

      // Handle the media file or response as desired
      if (data?.signedUrl) {
        message.channel.send(data?.signedUrl || "");
      }
    }
  }
});

bot.login(process.env.BOT_TOKEN);

module.exports = app;
