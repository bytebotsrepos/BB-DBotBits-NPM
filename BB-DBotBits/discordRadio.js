/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
Warning do not change anything in here unless you know what you are doing
We took away support for anything less than node18. 
              

const fetch = require('node-fetch'); // If you are using anything below node 18 please consult the documentation
https://bytebots.net/radio/below-node-18
*/

const { client } = require('./discordHandler');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnectionStatus, AudioPlayerStatus, entersState } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

let currentMessage = null;
let currentConnection = null;
let currentPlayer = null;
const registeredCommands = new Set();

async function discordRadio(wakeword, streamUrl, thumbnailUrl) {
    const fetch = (await import('node-fetch')).default;

    if (registeredCommands.has(wakeword)) {
        console.log(`Command /${wakeword} already set up.`);
        return;
    }

    client.once('ready', async () => {
        try {
            const existingCommands = await client.application.commands.fetch();
            const existingCommand = existingCommands.find(cmd => cmd.name === wakeword);

            if (!existingCommand) {
                await client.application.commands.create({
                    name: wakeword,
                    description: `Play ${wakeword} radio in the voice channel`,
                });
                console.log(`Global slash command /${wakeword} registered.`);
            } else {
                console.log(`Command /${wakeword} already exists.`);
            }
        } catch (error) {
            console.error(`Failed to register global slash command: /${wakeword}`, error);
            return;
        }
    });

    client.on('interactionCreate', async interaction => {
        if (interaction.isCommand() && interaction.commandName === wakeword) {
            await handleRadioCommand(interaction, wakeword, streamUrl, thumbnailUrl);
        }
        
        if (interaction.isButton() && interaction.customId === 'stop') {
            await handleStopButton(interaction);
        }
    });

    registeredCommands.add(wakeword);
}

async function handleRadioCommand(interaction, wakeword, streamUrl, thumbnailUrl) {
    const fetch = (await import('node-fetch')).default;

    if (!interaction.member.voice.channel) {
        await interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true });
        return;
    }

    // Clean up any existing connections
    if (currentConnection) {
        currentConnection.destroy();
        currentConnection = null;
        console.log('Cleaned up previous connection.');
    }

    const voiceChannel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    currentConnection = connection;
    currentPlayer = player;

    try {
        // Wait for the connection to be fully established - This fixes the stupid bug that you need to call the radio twice
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        console.log('Voice connection is ready.');

        const response = await fetch(streamUrl);
        const stream = response.body;

        if (!stream) {
            throw new Error('No stream found');
        }

        const resource = createAudioResource(stream, { inlineVolume: true });
        resource.volume.setVolume(0.5);

        player.play(resource);
        connection.subscribe(player);
        console.log(`Playing ${wakeword} radio stream.`);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger)
            );

        const embed = new EmbedBuilder()
            .setColor('#0099ff') // Blue because I like blue :D
            .setTitle(`Now Playing ${wakeword} Radio`)
            .setDescription(`You are now listening to ${wakeword}\nenjoy the stream!`)
            .setThumbnail(thumbnailUrl || 'https://bytebots.net/pics/bb.png')
            .setFooter({ text: 'Player coded using BB-DBotBits Library https://bytebots.net', iconURL: 'https://bytebots.net/pics/bb.png' });

        // Delete old message if exists - no needed but it's still here
        if (currentMessage) {
            try {
                await currentMessage.delete();
            } catch (error) {
                console.error('Failed to delete the previous embed message:', error);
            }
        }

        currentMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        player.on('error', error => {
            console.error('Audio player error:', error.message);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Stream ended, cleaning up.');
            if (currentConnection) {
                currentConnection.destroy();
                currentConnection = null;
            }
            if (currentMessage) {
                currentMessage.delete().catch(err => console.error('Failed to delete message:', err));
                currentMessage = null;
            }
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Voice connection disconnected.');
            if (currentConnection) {
                currentConnection.destroy();
                currentConnection = null;
            }
        });

    } catch (error) {
        console.error('Failed to play the requested station:', error);
        await interaction.reply({ content: 'Failed to play the requested station. Please try again.', ephemeral: true });
    }
}

async function handleStopButton(interaction) {
    try {
        // Check if the interaction is still valid and defer it
        if (interaction.isRepliable()) {
            await interaction.deferReply({ ephemeral: true });
        }

        // Stop the player if it's active
        if (currentPlayer) {
            currentPlayer.stop();
            console.log('Stopped the player.');
        }

        // Destroy the voice connection if it exists
        if (currentConnection) {
            currentConnection.destroy();
            currentConnection = null;
            console.log('Stopped the radio and disconnected from the voice channel.');
        }

        // Attempt to delete the current message if it exists
        if (currentMessage) {
            try {
                await currentMessage.delete();
                currentMessage = null;
            } catch (error) {
                console.error('Failed to delete the embed message:', error);
            }
        }

        // Send a reply if the interaction was successfully deferred
        if (interaction.isRepliable()) {
            await interaction.editReply({ content: 'Stopped the stream and disconnected!' });
        }

    } catch (error) {
        console.error('Error handling stop button interaction:', error);

        // Handle cases where interaction might be invalid or expired
        if (error.code === 10062) {
            console.log('The interaction was unknown or expired. Please try again.');
        }
    }
}

module.exports = { discordRadio };
