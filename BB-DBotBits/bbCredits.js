/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
Warning do not change anything in here unless you know what you are doing

If you want to turn this off, don't modify this file go to:
/settings/settings.js and change showCredits = true; to false.
              
*/

// Function to register the /credits slash command and reply
function registerCreditsCommand(client) {
    // Define the /credits command
    const commands = [
        {
            name: 'credits',       
            description: 'Displays the credits of the bot.',
        },
    ];

    try {
        console.log(`Started refreshing application (/) commands for /credits.`);

        // Register the command using client.application.commands.set
        client.application.commands.set(commands);

        console.log(`Successfully registered /credits command.`);
    } catch (error) {
        console.error(`Failed to register /credits command:`, error);
    }

    // Listen for interaction events (slash commands)
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        // Check if the received command is /credits
        if (commandName === 'credits') {
            const creditsText = `This bot was proudly made using ByteBots BB-DBotBits repo. https://bytebots.net`;
            await interaction.reply({ content: creditsText, ephemeral: true });
        }
    });
}

module.exports = { registerCreditsCommand };
