/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
Warning do not change anything in here unless you know what you are doing
              
*/

const { client } = require('./discordHandler'); 
const fs = require('fs');
const path = require('path');

// File to store warnings data
const warningsFilePath = path.join(__dirname, 'warnings.json');

// Load warnings data from a file.
let warningsData = {};
if (fs.existsSync(warningsFilePath)) {
    warningsData = JSON.parse(fs.readFileSync(warningsFilePath, 'utf-8'));
} else {
    fs.writeFileSync(warningsFilePath, JSON.stringify(warningsData, null, 2));
}

// Function to save warnings data to the JSON file
function saveWarningsData() {
    fs.writeFileSync(warningsFilePath, JSON.stringify(warningsData, null, 2));
}

// Function to start spam check
function discordCheckSpam() {
    client.on('messageCreate', async (message) => {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Check if the message contains a URL
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        if (urlPattern.test(message.content)) {
            const serverId = message.guild.id;
            const userId = message.author.id;

            // start server and user data if not present
            if (!warningsData[serverId]) {
                warningsData[serverId] = {};
            }
            if (!warningsData[serverId][userId]) {
                warningsData[serverId][userId] = 0;
            }

            // Increment the user's warning count
            warningsData[serverId][userId] += 1;
            saveWarningsData();

            // Check the user's warning count
            const warningCount = warningsData[serverId][userId];
            if (warningCount < 3) {
                // Issue a warning message
                await message.reply(`⚠️ Warning ${warningCount}/3: Posting URLs is not allowed. Continue and you will be kicked.`);
            } else {
                // Kick the user after 3 warnings / Again you can get creative here.
                try {
                    await message.guild.members.kick(userId);
                    await message.channel.send(`🚫 ${message.author.tag} has been kicked for repeated URL posting.`);

                    // Reset the user's warning count after they are kicked
                    delete warningsData[serverId][userId];
                    saveWarningsData();
                } catch (error) {
                    console.error(`Failed to kick user ${message.author.tag}:`, error);
                }
            }
        }
    });
}

module.exports = { discordCheckSpam };
