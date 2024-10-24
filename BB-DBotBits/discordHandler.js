/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
        This handles the discord connections DO NOT EDIT!!!!


              
*/


require('dotenv').config({ path: 'token.env' });

const token = process.env.token;

if (!token) {
    console.error("Error: token is not set in token.env");
    process.exit(1);
}

console.log("Token Loaded successfully.");

// Import required modules
const { Client, GatewayIntentBits } = require('discord.js');
const versionChecker = require('./versionChecker');
const { showCredits, botStatusTxt, botOnlineStatus, botDoing, showStatus } = require('./settings/settings');
const { registerCreditsCommand } = require('./bbCredits');

// Check version and perform setup
//versionChecker();

// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,  
    ],
});

// Login function for the Discord client
function discordLogin(token) {
    try {
        return client.login(token);
    } catch (error) {
        console.error("Failed to login to Discord:", error);
        process.exit(1);
    }
}

// Event listener for when the bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Handle credits feature
    if (showCredits) {
        console.log("Credits feature is enabled. Registering credits command...");
        registerCreditsCommand(client);
    } else {
        console.log("Credits are disabled.");
    }

    // Handle bot status
    if (showStatus) {
        // Set the bot's status
        client.user.setPresence({
            activities: [{ name: botStatusTxt, type: botDoing }], 
            status: botOnlineStatus, 
        });

        console.log(`Status set to: ${botStatusTxt} (${botOnlineStatus})`);
    }
});

discordLogin(token);

module.exports = { discordLogin, client, token };
