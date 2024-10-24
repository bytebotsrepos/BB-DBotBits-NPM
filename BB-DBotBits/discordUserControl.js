/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
Warning do not change anything in here unless you know what you are doing
ALSO THIS IS USELESS AS DISCORD HAS THESE FEATURES BUILT IN JUST USE THEM
              


const { client } = require('./discordHandler'); // Import client from CommonJS file
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Function to register user control commands and handle them
async function discordUserControl() {
    client.once('ready', async () => {
        // Define the commands for kick, ban, and mute
        const commands = [
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Kick a user from the server.')
                .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to kick')
                        .setRequired(true)
                ),
            new SlashCommandBuilder()
                .setName('ban')
                .setDescription('Ban a user from the server.')
                .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to ban')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for banning the user')
                        .setRequired(false)
                ),
            new SlashCommandBuilder()
                .setName('mute')
                .setDescription('Mute a user in the server (only works with voice channels).')
                .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to mute')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('mute')
                        .setDescription('Mute or unmute the user (true for mute, false for unmute)')
                        .setRequired(true)
                )
        ];

        // Register the commands globally
        try {
            await client.application.commands.set(commands);
            console.log('Global slash commands for user control registered.');
        } catch (error) {
            console.error('Failed to register user control commands:', error);
        }
    });

    // Handle interactions for the commands
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const { commandName, options } = interaction;

        // Handle /kick
        if (commandName === 'kick') {
            const user = options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);

            if (!member) {
                await interaction.reply({ content: 'User not found on this server.', ephemeral: true });
                return;
            }

            try {
                await member.kick();
                await interaction.reply({ content: `${user.tag} has been kicked from the server.` });
            } catch (error) {
                console.error('Failed to kick user:', error);
                await interaction.reply({ content: 'Failed to kick the user. Please check my permissions.', ephemeral: true });
            }
        }

        // Handle /ban
        if (commandName === 'ban') {
            const user = options.getUser('user');
            const reason = options.getString('reason') || 'No reason provided';
            const member = interaction.guild.members.cache.get(user.id);

            if (!member) {
                await interaction.reply({ content: 'User not found on this server.', ephemeral: true });
                return;
            }

            try {
                await member.ban({ reason });
                await interaction.reply({ content: `${user.tag} has been banned from the server. Reason: ${reason}` });
            } catch (error) {
                console.error('Failed to ban user:', error);
                await interaction.reply({ content: 'Failed to ban the user. Please check my permissions.', ephemeral: true });
            }
        }

        // Handle /mute
        if (commandName === 'mute') {
            const user = options.getUser('user');
            const shouldMute = options.getBoolean('mute');
            const member = interaction.guild.members.cache.get(user.id);

            if (!member || !member.voice.channel) {
                await interaction.reply({ content: 'User is not in a voice channel or not found.', ephemeral: true });
                return;
            }

            try {
                await member.voice.setMute(shouldMute);
                const action = shouldMute ? 'muted' : 'unmuted';
                await interaction.reply({ content: `${user.tag} has been ${action}.` });
            } catch (error) {
                console.error('Failed to mute/unmute user:', error);
                await interaction.reply({ content: 'Failed to mute/unmute the user. Please check my permissions.', ephemeral: true });
            }
        }
    });
}

module.exports = { discordUserControl };
*/