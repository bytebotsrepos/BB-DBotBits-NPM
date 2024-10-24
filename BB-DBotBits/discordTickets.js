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

const { client } = require('./discordHandler.js');
const {
    ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ticketAccess } = require('./settings/settings.js');

// Load or kick start a new ticket
let ticketData = {}; // Object for storing numbers
const ticketDataPath = path.join(__dirname, 'tickets.json');

// Check if the tickets.json file exists and load ticket data if not this will create one 
if (fs.existsSync(ticketDataPath)) {
    ticketData = JSON.parse(fs.readFileSync(ticketDataPath, 'utf-8'));
} else {
    fs.writeFileSync(ticketDataPath, JSON.stringify(ticketData));
}

// Array of role IDs that can see and manage tickets. If you need to add or remove permissions, go to settings.js do not edit the line below.
const canSeeRoles = ticketAccess;

// Log canSeeRoles as it was not sorting permssions so used to debug.
console.log('Roles that can see and manage tickets:', canSeeRoles);

// Saves the ticket to a file
function saveTicketData() {
    const tempFilePath = `${ticketDataPath}.tmp`;
    fs.writeFileSync(tempFilePath, JSON.stringify(ticketData, null, 2)); // Temp file
    fs.renameSync(tempFilePath, ticketDataPath); // Replace the orig file
}

// Get the ticket number 
function getNextTicketNumber(guildId) {
    if (!ticketData[guildId]) {
        ticketData[guildId] = { ticketNumber: 1 };
    }
    const currentTicketNumber = ticketData[guildId].ticketNumber;

    // Add +1 so tickets are counted properly
    ticketData[guildId].ticketNumber += 1;
    saveTicketData();

    return currentTicketNumber;
}

// Function to create the "Tickets" category if it doesn't exist
async function createTicketsCategory(guild) {
    let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);

    if (!category) {
        const everyoneRole = guild.roles.everyone;

        //Used to debug this was/is
        const rolePermissions = canSeeRoles.map(roleID => ({
            id: roleID,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.SendMessages
            ],
        }));
        console.log('Role Permissions:', rolePermissions);

        try {
            category = await guild.channels.create({
                name: 'Tickets',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: everyoneRole.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    ...rolePermissions // Ensure all roles get applied
                ],
            });
        } catch (error) {
            console.error('Error creating Tickets category:', error);
        }
    }

    return category;
}

// Function to create a new ticket channel safely
async function createTicket(interaction, openReason) {
    try {
        const category = await createTicketsCategory(interaction.guild);
        const ticketNumber = getNextTicketNumber(interaction.guild.id);

        const existingChannel = interaction.guild.channels.cache.find(
            channel => channel.name === `ticket-${ticketNumber}`
        );

        // Skip if the ticket already exists (Handles issues just leave it here this took ages to patch)
        if (existingChannel) {
            console.log(`Ticket #${ticketNumber} already exists.`);
            return;
        }

        const rolePermissions = canSeeRoles.map(roleID => ({
            id: roleID,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.SendMessages
            ],
        }));
        console.log('Role Permissions for Ticket Channel:', rolePermissions);

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                ...rolePermissions
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${ticketNumber}`)
            .setDescription(`Reason: ${openReason}`)
            .setColor('#00ff00')
            .setTimestamp()
            .setFooter({ text: `Ticket opened by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        const claimButton = new ButtonBuilder()
            .setCustomId(`claim_${ticketNumber}`)
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Primary);

        const closeButton = new ButtonBuilder()
            .setCustomId(`close_${ticketNumber}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

        await ticketChannel.send({
            embeds: [embed],
            components: [row],
        });

        await interaction.reply({ content: `Ticket #${ticketNumber} has been created. You can find it in ${ticketChannel}.`, ephemeral: true });

    } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.reply({ content: 'An error occurred while creating the ticket. Please try again later.', ephemeral: true });
    }
}

// Function to register the /tickets 
async function discordTickets() {
    // Register the /tickets command without overwriting existing ones
    client.once('ready', async () => {
        const guild = client.guilds.cache.first();
        if (!guild) return console.error('No guild found!');

        const commandData = new SlashCommandBuilder()
            .setName('tickets')
            .setDescription('Open a support ticket')
            .addStringOption(option => option.setName('reason').setDescription('Reason for opening the ticket').setRequired(true))
            .toJSON();

        try {
            // Fetch existing commands and check if the /tickets command is already registered
            const existingCommands = await guild.commands.fetch();
            const existingCommand = existingCommands.find(cmd => cmd.name === 'tickets');

            if (existingCommand) {
                console.log('/tickets command already exists. Skipping registration.');
            } else {
                await guild.commands.create(commandData);
                console.log('/tickets command registered!');
            }
        } catch (error) {
            console.error('Failed to register /tickets command:', error);
        }
    });

    // Handle the interactionCreate event for /tickets and button interactions
    client.on('interactionCreate', async (interaction) => {
        try {
            if (interaction.isCommand() && interaction.commandName === 'tickets') {
                const openReason = interaction.options.getString('reason');
                await createTicket(interaction, openReason);
            }

            if (interaction.isButton()) {
                const ticketNumber = interaction.customId.split('_')[1];

                if (interaction.customId.startsWith('claim_')) {
                    const updatedRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(interaction.customId)
                                .setLabel(`Claimed by ${interaction.user.tag}`)
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId(`close_${ticketNumber}`)
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                        );

                    await interaction.update({
                        content: `${interaction.user.tag} has claimed this ticket.`,
                        components: [updatedRow]
                    });
                }
                //Fixed this as it stopped workinb
                if (interaction.customId.startsWith('close_')) {
                    await interaction.deferUpdate();
                
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    const transcript = messages.map(msg => `[${msg.createdAt}] ${msg.author.tag}: ${msg.content}`).reverse().join('\n');
                    const transcriptPath = path.join(__dirname, `transcript_ticket_log_${ticketNumber}.txt`);
                
                    fs.writeFileSync(transcriptPath, transcript);
                
                    const user = interaction.guild.members.cache.get(interaction.user.id);
                    if (user) {
                        try {
                            // Try sending the transcript via Message
                            await user.send({ content: `Here is the transcript for Ticket #${ticketNumber}.`, files: [transcriptPath] });
                        } catch (dmError) {
                            // If sending a message fails, log the error and send a message in the ticket channel
                            console.error(`Failed to send DM to user ${interaction.user.tag}:`, dmError);
                
                            await interaction.channel.send({
                                content: `${interaction.user.tag}, I couldn't send you a DM with the transcript. Please check your privacy settings to allow DMs from server members.`,
                            });
                        }
                    }
                
                    // Send a message for ticket closure
                    const closeEmbed = new EmbedBuilder()
                        .setTitle('Ticket Closed')
                        .setDescription(`Closed by: ${interaction.user.tag}`)
                        .setColor('#e74c3c')
                        .setTimestamp();
                
                    await interaction.channel.send({ embeds: [closeEmbed] });
                    await interaction.channel.delete();
                }
                
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
        }
    });
}

// Like all files this exports the function needed.
module.exports = { discordTickets };
