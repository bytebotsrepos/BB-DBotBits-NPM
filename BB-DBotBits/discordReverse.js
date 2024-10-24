/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
Warning do not change anything in here unless you know what you are doing
This is just a bit of fun i coded for testing it's quirky really but could 
make your chat's a little more wierd as it reverses a scentence for example:
hello become olleh
*/              

const { client } = require('./discordHandler.js');

// The entire function :)
function discordReverse() {
    client.on('messageCreate', (message) => {
        if (message.author.bot) return; // Ignore bot's own messages

        // Check if the message starts with the !reverse
        if (message.content.toLowerCase().startsWith('!reverse')) {
            // Extract the reason after the command
            const reverse = message.content.slice('!reverse'.length).trim();
            const reverseSTR = reverse.split('').reverse().join('').split(' ').reverse().join(' ')

            if (reverse) {
                // Send the the reverse string
                message.channel.send(`${reverseSTR}`);
            } else {
                // Handle the case where no reason was provided
                message.channel.send('I can not reverse a blank word/scentence.');
            }
        }
    });
}

// Export the discordTickets function for external use
module.exports = { discordReverse };
