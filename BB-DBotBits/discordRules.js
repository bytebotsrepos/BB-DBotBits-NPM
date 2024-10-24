/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
Warning do not change anything in here unless you know what you are doing  
Please ensure you edit the settins.js with the roleid and channel id          
*/

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require('discord.js'); // Add the necessary imports
const fs = require('fs');
const path = require('path');
const { rulesSettings } = require('./settings/settings.js');
const { client } = require('./discordHandler');

const acceptedUsersFilePath = path.join(__dirname, 'acceptedUsers.json');
const rulesFilePath = path.join(__dirname, '../rules.txt');

// If rules.txt is not made in your root directory this will make it with the following rules.
const defaultRulesContent = `Welcome to our Discord server! Please follow these rules:
1. Be respectful to all members.
2. No spamming, advertising, or self-promotion.
3. Use the appropriate channels for your discussions.
4. Follow Discord’s Terms of Service.
5. No hate speech, harassment, or abusive behavior.
6. Keep content safe for work and family-friendly.
Thank you for being part of our community!`

// Ensure rules.txt exists, or create it with default rules
function ensureRulesFile() {
    if (!fs.existsSync(rulesFilePath)) {
        fs.writeFileSync(rulesFilePath, defaultRulesContent, 'utf-8');
        console.log('Created default rules.txt file.');
    }
}

// Load accepted users data from the JSON file
function loadAcceptedUsers() {
    try {
        const data = fs.readFileSync(acceptedUsersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {}; // Return an empty object if the file does not exist or cannot be read
    }
}

// Save accepted users data to the JSON file
function saveAcceptedUsers(data) {
    fs.writeFileSync(acceptedUsersFilePath, JSON.stringify(data, null, 2));
}

// Function to clear all messages in the rules channel. I put this in because if you restart the bot it reposts the rules
// We could do without duplicate rules so I purge the channel upon every start up.
async function clearRulesChannel(channel) {
    try {
        let messages;
        do {
            messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await channel.bulkDelete(messages, true);
                console.log(`Deleted ${messages.size} messages from the rules channel.`);
            }
        } while (messages.size > 0);
    } catch (error) {
        console.error('Failed to clear rules channel:', error);
    }
}

// Function to display rules as an embed with an accept button
function displayRules(channel) {
    const rulesContent = fs.readFileSync(rulesFilePath, 'utf-8');

    // Create an embed with the title "Rules" and content from rules.txt
    const rulesEmbed = new EmbedBuilder()
        .setTitle('Rules')
        .setDescription(rulesContent);

    // Prepare the "Accept" button
    const acceptButton = new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(acceptButton);

    // Send the embed with the accept button
    channel.send({ embeds: [rulesEmbed], components: [row] });
}

// Function to handle interaction when the accept button is clicked
function setupAcceptHandler() {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;

        const userId = interaction.member.id;
        const serverId = interaction.guild.id;

        if (interaction.customId === 'accept_rules') {
            // Load the accepted users data
            const acceptedUsers = loadAcceptedUsers();

            // Check if the user has already accepted
            if (acceptedUsers[serverId] && acceptedUsers[serverId].includes(userId)) {
                await interaction.reply({ content: 'You have already accepted the rules!', ephemeral: true });
                return;
            }

            try {
                // Add the role to the user
                await interaction.member.roles.add(rulesSettings[0].roleId);

                // Store the user's acceptance in the JSON file
                if (!acceptedUsers[serverId]) {
                    acceptedUsers[serverId] = [];
                }
                acceptedUsers[serverId].push(userId);
                saveAcceptedUsers(acceptedUsers);

                // Update button to say "Thank you for accepting the rules"
                const updatedButton = new ButtonBuilder()
                    .setCustomId('thank_you_accepted')
                    .setLabel('Thank you for accepting the rules')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);

                const updatedRow = new ActionRowBuilder().addComponents(updatedButton);

                // Update the interaction with the new button
                await interaction.update({ components: [updatedRow] });

            } catch (error) {
                console.error('Failed to assign role:', error);
                await interaction.reply({ content: 'There was an error assigning the role. Please contact an admin.', ephemeral: true });
            }
        }
    });
}

// Main function to set up rules display and handler
function discordRules() {
    client.once('ready', async () => {
        console.log(`Logged in as ${client.user.tag}!`);

        // Ensure that rules.txt exists or create it with default rules
        ensureRulesFile();

        // Ensure that rulesSettings[0].channelID exists
        if (!rulesSettings[0] || !rulesSettings[0].channelID) {
            console.error('Channel ID is not defined in settings.');
            return;
        }

        const channel = client.channels.cache.get(rulesSettings[0].channelID);
        if (!channel) {
            console.error('Channel not found. Please check the channel ID.');
            return;
        }

        // Clear all messages in the rules channel
        await clearRulesChannel(channel);

        // Display the rules message as an embed
        displayRules(channel);

        // Set up the accept button handler
        setupAcceptHandler();
    });
}

module.exports = { settings: discordRules };
