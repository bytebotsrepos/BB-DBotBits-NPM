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
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Function to register a global slash command and send a customized embed
async function discordReplyEmbed(wakeword, title, body, footer, image = null, url = null) {
    client.once('ready', async () => {
        // Define the slash command
        const command = new SlashCommandBuilder()
            .setName(wakeword)
            .setDescription(`Send an embed message with the wakeword: ${wakeword}`);

        // Register the command globally without overwriting existing ones
        try {
            // Fetch existing global commands
            const existingCommands = await client.application.commands.fetch();
            const existingCommand = existingCommands.find(cmd => cmd.name === wakeword);

            // Check if the command already exists
            if (existingCommand) {
                console.log(`Command /${wakeword} already exists. Skipping registration.`);
            } else {
                // Register the new command
                await client.application.commands.create(command.toJSON());
                console.log(`Global slash command /${wakeword} registered.`);
            }
        } catch (error) {
            console.error(`Failed to register global slash command /${wakeword}:`, error);
        }
    });

    // interaction handler thing
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        // Handle the slash command interaction for the specified wakeword
        if (commandName === wakeword) {
            try {
                // Create the embed
                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(body)
                    // Default blue color, I favorite is blue but if you're reading this you can change it.
                    //in a future update the color will be in settings if you must change it below use this:
                    //https://htmlcolorcodes.com/ <- not sponsored or supported in anyway just a useful tool.
                    .setColor('#0099ff') 
                    .setFooter({ text: footer }); // Add footer

                // If a URL is provided, make the title clickable
                if (url) {
                    embed.setURL(url);
                }

                // If an image URL is provided, add it to the embed
                if (image) {
                    embed.setImage(image);
                }

                // Send the embed as a reply to the command interaction
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Failed to send embed:', error);
                await interaction.reply({ content: 'Failed to send the embed. Please try again.', ephemeral: true });
            }
        }
    });
}

module.exports = { discordReplyEmbed };
