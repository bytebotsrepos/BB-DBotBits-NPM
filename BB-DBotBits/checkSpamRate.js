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

const { client } = require('./discordHandler'); // Import client from CommonJS file
const fs = require('fs');
const path = require('path');

// File to store rate limit warnings data, I used json because sod txt file handling
const rateLimitWarningsFilePath = path.join(__dirname, 'rateLimitWarnings.json');

// Load rate limit warnings data from file or create a new object
let rateLimitWarningsData = {};
if (fs.existsSync(rateLimitWarningsFilePath)) {
    rateLimitWarningsData = JSON.parse(fs.readFileSync(rateLimitWarningsFilePath, 'utf-8'));
} else {
    fs.writeFileSync(rateLimitWarningsFilePath, JSON.stringify(rateLimitWarningsData, null, 2));
}

// this saves the warnings
function saveRateLimitWarningsData() {
    fs.writeFileSync(rateLimitWarningsFilePath, JSON.stringify(rateLimitWarningsData, null, 2));
}

// In-memory store to track message rates / if it crashes that's ok it will store in json
let messageTracker = {};

// Bots understanding of spam
const MESSAGE_LIMIT = 5; // Number of messages within the time frame
const TIME_FRAME = 10000; // Time frame in milliseconds (10 seconds)

// Spam rate checker
function checkSpamRate() {
    client.on('messageCreate', async (message) => {
        // Ignore messages from bots
        if (message.author.bot) return;

        const serverId = message.guild.id;
        const userId = message.author.id;

        // startup stuff
        if (!messageTracker[serverId]) {
            messageTracker[serverId] = {};
        }
        if (!messageTracker[serverId][userId]) {
            messageTracker[serverId][userId] = [];
        }

        // Track the time of the message | no essential but looks good in logs
        const now = Date.now();
        messageTracker[serverId][userId].push(now);

        // Remove messages that are outside the time frame because fuck spam.
        messageTracker[serverId][userId] = messageTracker[serverId][userId].filter(timestamp => now - timestamp <= TIME_FRAME);

        // Check if the user exceeds the message limit
        if (messageTracker[serverId][userId].length > MESSAGE_LIMIT) {
            // Issue a warning or kick the user depending on warnings
            if (!rateLimitWarningsData[serverId]) {
                rateLimitWarningsData[serverId] = {};
            }
            if (!rateLimitWarningsData[serverId][userId]) {
                rateLimitWarningsData[serverId][userId] = 0;
            }

            // Increment the user's warning count because ++ was not an option ;D
            rateLimitWarningsData[serverId][userId] += 1;
            saveRateLimitWarningsData();

            const warningCount = rateLimitWarningsData[serverId][userId];
            if (warningCount < 3) {
                // Issue a warning message. If you are reading these comments you can get creative here:
                await message.reply(`⚠️ Warning ${warningCount}/3: You are sending messages too quickly. Slow down or you will be kicked.`);
            } else {
                // Kick the user after 3 warnings
                try {
                    await message.guild.members.kick(userId);
                    await message.channel.send(`🚫 ${message.author.tag} has been kicked for spamming messages.`);

                    // Reset the user's warning count after they are kicked
                    delete rateLimitWarningsData[serverId][userId];
                    saveRateLimitWarningsData();
                } catch (error) {
                    console.error(`Failed to kick user ${message.author.tag}:`, error);
                }
            }

            // Reset the user's message tracking after a warning is issued
            messageTracker[serverId][userId] = [];
        }
    });

    // Periodically clear old data from the message tracker
    setInterval(() => {
        const now = Date.now();
        for (const serverId in messageTracker) {
            for (const userId in messageTracker[serverId]) {
                // Remove timestamps older than the defined time frame
                messageTracker[serverId][userId] = messageTracker[serverId][userId].filter(timestamp => now - timestamp <= TIME_FRAME);

                // Clean up empty entries
                if (messageTracker[serverId][userId].length === 0) {
                    delete messageTracker[serverId][userId];
                }
            }
        }
    }, TIME_FRAME);
}

module.exports = { checkSpamRate };
