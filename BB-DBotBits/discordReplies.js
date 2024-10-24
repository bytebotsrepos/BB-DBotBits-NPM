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
const { client } = require('./discordHandler.js'); // Ensure client is properly imported
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// Function to register dynamic slash commands and reply
function discordReply(commandName, responseText) {
    client.once('ready', async () => {
        // Define the slash command based on the params
        const newCommand = {
            name: commandName,       // Slash command name from params
            description: `Replies with a custom message: ${responseText}`,
        };

        const rest = new REST({ version: '9' }).setToken(client.token);

        try {
            console.log(`Checking for existing commands before registering /${commandName}.`);

            // Fetch existing global commands
            const existingCommands = await rest.get(
                Routes.applicationCommands(client.user.id)
            );

            // Check if the command already exists then ignore if it does. 
            const existingCommand = existingCommands.find(cmd => cmd.name === commandName);

            if (existingCommand) {
                console.log(`Command /${commandName} already exists. Skipping registration.`);
            } else {
                // Register the new command with Discord because it needs to.
                await rest.post(
                    Routes.applicationCommands(client.user.id),
                    { body: newCommand },
                );

                console.log(`Successfully registered /${commandName} command.`);
            }

        } catch (error) {
            console.error(`Failed to register /${commandName} command:`, error);
        }
    });

    // Listen's for those sexy wake commands you made.
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName: receivedCommandName } = interaction;

        // Check if the received command matches the dynamically created command.
        if (receivedCommandName === commandName) {
            await interaction.reply(responseText);
        }
    });
}

module.exports = { discordReply };
