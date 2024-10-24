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

//This is the purger things to delete messages and user messages.

const { client } = require('./discordHandler'); 

async function registerPurgeCommands() {
    const commands = [
        {
            name: 'purgemessages',
            description: 'Purge a specified number of recent messages.',
            options: [
                {
                    type: 4, 
                    name: 'amount',
                    description: 'The number of messages to purge (between 1 and 100)',
                    required: true,
                },
            ],
        },
        {
            name: 'purgeusermessages',
            description: 'Purge messages from a specific user.',
            options: [
                {
                    type: 3, 
                    name: 'username',
                    description: 'The username of the person whose messages you want to purge',
                    required: true,
                },
            ],
        },
    ];

    try {
        // Fetch existing global commands
        const existingCommands = await client.application.commands.fetch();

        // Loop through new commands to add them individually
        for (const command of commands) {
            // Check if the command already exists
            const existingCommand = existingCommands.find(c => c.name === command.name);
            if (existingCommand) {
                console.log(`Command /${command.name} already exists. Skipping registration.`);
                continue; // Skip registration if the command already exists
            }

            // Create the new command
            await client.application.commands.create(command);
            console.log(`Successfully registered new command /${command.name}.`);
        }

    } catch (error) {
        console.error('Error registering additional purge commands:', error);
    }
}


// Handles the commands for purge messages
async function purgeMessages(interaction, amount) {
    try {
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return interaction.reply('Please provide a valid number of messages to delete (between 1 and 100).');
        }

        // Bulk delete the specified number of messages
        await interaction.channel.bulkDelete(amount, true);
        console.log(`Purged ${amount} recent messages.`);
        await interaction.reply({ content: `Purged ${amount} recent messages.`, ephemeral: true });
    } catch (error) {
        console.error('Failed to purge messages:', error);
        await interaction.reply({ content: 'Failed to purge messages. Please try again.', ephemeral: true });
    }
}

// handles slash command to delete 1 user messages
async function purgeUserMessages(interaction, username) {
    try {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(msg => msg.author.username === username);

        if (userMessages.size === 0) {
            return interaction.reply(`No messages found from user ${username}.`);
        }

        // Convert to an array and delete it
        const userMessageArray = Array.from(userMessages.values());

      
        await interaction.channel.bulkDelete(userMessageArray, true);
        console.log(`Purged ${userMessages.size} messages from ${username}.`);
        await interaction.reply({ content: `Purged ${userMessages.size} messages from ${username}.`, ephemeral: true });
    } catch (error) {
        console.error('Failed to purge user messages:', error);
        await interaction.reply({ content: 'Failed to purge user messages. Please try again.', ephemeral: true });
    }
}

//overall listener
function setupPurgeCommandListener() {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName, options } = interaction;

        if (commandName === 'purgemessages') {
            const amount = options.getInteger('amount');
            await purgeMessages(interaction, amount);
        }

        if (commandName === 'purgeusermessages') {
            const username = options.getString('username');
            await purgeUserMessages(interaction, username);
        }
    });
}

//The needed stuff
function discordPurgeCommands() {
    client.once('ready', async () => {
        await registerPurgeCommands(); // Register slash commands only after the client is ready
        setupPurgeCommandListener(); // Setup listener for interactions
        console.log(`Bot is ready and commands are registered.`);
    });
}

module.exports = { discordPurgeCommands };
