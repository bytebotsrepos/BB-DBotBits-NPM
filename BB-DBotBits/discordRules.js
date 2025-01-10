/*
 * _ __        _       ____        _       ____
 * | __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___
 * |  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
 * | |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
 * |____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
 *       |___/                                      |_|
 *                    https://bytebots.net
 * Warning do not change anything in here unless you know what you are doing
 * Please ensure you edit the settins.js with the roleid and channel id
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { rulesSettings } = require('./settings/settings.js');
const { client } = require('./discordHandler');

const acceptedUsersFilePath = path.join(__dirname, 'acceptedUsers.json');
const rulesFilePath = path.join(__dirname, '/../../rules.txt');

const defaultRulesContent = `Welcome to our Discord server! Please follow these rules:
1. Be respectful to all members.
2. No spamming, advertising, or self-promotion.
3. Use the appropriate channels for your discussions.
4. Follow Discord’s Terms of Service.
5. No hate speech, harassment, or abusive behavior.
6. Keep content safe for work and family-friendly.
Thank you for being part of our community!`

function ensureRulesFile() {
    if (!fs.existsSync(rulesFilePath)) {
        fs.writeFileSync(rulesFilePath, defaultRulesContent, 'utf-8');
        console.log('Created default rules.txt file.');
    }
}

function loadAcceptedUsers() {
    try {
        const data = fs.readFileSync(acceptedUsersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveAcceptedUsers(data) {
    fs.writeFileSync(acceptedUsersFilePath, JSON.stringify(data, null, 2));
}

async function clearRulesChannel(channel) {
    try {
        let messages;
        let totalDeleted = 0;
        do {
            messages = await channel.messages.fetch({ limit: 100 });
            const deletableMessages = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 1209600000); // 14 days limit
            if (deletableMessages.size > 0) {
                await channel.bulkDelete(deletableMessages, true);
                totalDeleted += deletableMessages.size;
                console.log(`Deleted ${deletableMessages.size} messages from the rules channel.`);
            } else {
                console.log('No deletable messages found within the 14-day limit.');
                break;
            }
        } while (messages.size > 0);
        console.log(`Deleted a total of ${totalDeleted} messages from the rules channel.`);
    } catch (error) {
        console.error('Failed to clear rules channel:', error);
    }
}

function splitTextIntoChunks(text, chunkSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

function displayRules(channel) {
    const rulesContent = fs.readFileSync(rulesFilePath, 'utf-8');
    const chunks = splitTextIntoChunks(rulesContent, 4000);

    chunks.forEach((chunk, index) => {
        const rulesEmbed = new EmbedBuilder()
        .setTitle(index === 0 ? 'Rules' : `Rules (Part ${index + 1})`)
        .setDescription(chunk);

        const acceptButton = new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(acceptButton);

        channel.send({ embeds: [rulesEmbed], components: index === chunks.length - 1 ? [row] : [] });
    });
}

function setupAcceptHandler() {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;

        const userId = interaction.member.id;
        const serverId = interaction.guild.id;

        if (interaction.customId === 'accept_rules') {
            const acceptedUsers = loadAcceptedUsers();

            if (acceptedUsers[serverId] && acceptedUsers[serverId].includes(userId)) {
                await interaction.reply({ content: 'You have already accepted the rules!', ephemeral: true });
                return;
            }

            try {
                await interaction.member.roles.add(rulesSettings[0].roleId);

                if (!acceptedUsers[serverId]) {
                    acceptedUsers[serverId] = [];
                }
                acceptedUsers[serverId].push(userId);
                saveAcceptedUsers(acceptedUsers);

                const updatedButton = new ButtonBuilder()
                .setCustomId('thank_you_accepted')
                .setLabel('Thank you for accepting the rules')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true);

                const updatedRow = new ActionRowBuilder().addComponents(updatedButton);

                await interaction.update({ components: [updatedRow] });

            } catch (error) {
                console.error('Failed to assign role:', error);
                await interaction.reply({ content: 'There was an error assigning the role. Please contact an admin.', ephemeral: true });
            }
        }
    });
}

function discordRules() {
    client.once('ready', async () => {
        console.log(`Logged in as ${client.user.tag}!`);

        ensureRulesFile();

        if (!rulesSettings[0] || !rulesSettings[0].channelID) {
            console.error('Channel ID is not defined in settings.');
            return;
        }

        const channel = client.channels.cache.get(rulesSettings[0].channelID);
        if (!channel) {
            console.error('Channel not found. Please check the channel ID.');
            return;
        }

        await clearRulesChannel(channel);

        displayRules(channel);

        setupAcceptHandler();
    });
}

module.exports = { settings: discordRules };