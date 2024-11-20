/*
 _ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
                   Please adjust as needed
              
Welcome to the settings section.
*/


// Bot Status
const showStatus = true;
let botOnlineStatus = 'online' // You can set this to 'idle', 'dnd', or 'invisible'
let botStatusTxt = 'Created using BB-DBotBits' // The status you want the bot to display
let botDoing = 4 // 0 (Playing), 1 (Streaming), 2 (Listening), 3 (Watching), 4 (blank), 5 (Competing)


/*
Please enter role ID's you with to see tickets, I have used the same role over and
over again. Please update all 3 and add as many as you need with , at the end apart 
from the last id
Some servers start with 0 and JS hates that so please ensure it's enclosed in ""
*/

let ticketAccess = [
    '1296083272178335776',
    '1296083272178335776',
    '1296083272178335776'
];

/* This section is for the rules 
The role ID and Channel id need to be entered below in order for the rules to work.
The role ID will set the role people are assinged upon accepting the rules
Channel ID is where the rules will be posted.
*/

let rulesSettings = [
    {
        roleId: '1296083272178335776',      
        channelID: '1297203259307462788'  
    }
];

const showCredits = true; /* Please do not remove this line... If you do want to remove it
Please donate to the project: https://buymeacoffee.com/coffeeismyonlyfriend if your using for non-commercial use a simple on off donation will really help us
If you plan on using the library for more than one bot please consider a tier. If you are a developer making bots for commercial gain. You need to purcase the developer tier.
*/ 

//XP System
promoteUserOnXP = false; // Turn off promote. This is usefull if you have newbies role and want to promote to members.
requiredPrmoteLevel = 5; // Level required to be promoted to next Discord rank
promotionRoleId = 'YOUR_ROLE_ID';


// Allow your website to be put in chat, bypassing the URL spam filter
const allowedURL = false; // Change to true if you want to bypass
const website = 'https://bytebots.net'; // change the url you want to have allowed in your chat. Do not worry about any slashes after your main url link


module.exports = { allowedURL, website, ticketAccess, rulesSettings, showCredits, botOnlineStatus, botStatusTxt, botDoing, showStatus, promoteUserOnXP, promotionRoleId, requiredPrmoteLevel};

