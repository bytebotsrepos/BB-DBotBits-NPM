/*
_ __        _       ____        _       ____                      
| __ ) _   _| |_ ___| __ )  ___ | |_ ___|  _ \ ___ _ __   ___  ___ 
|  _ \| | | | __/ _ \  _ \ / _ \| __/ __| |_) / _ \ '_ \ / _ \/ __|
| |_) | |_| | ||  __/ |_) | (_) | |_\__ \  _ <  __/ |_) | (_) \__ \
|____/ \__, |\__\___|____/ \___/ \__|___/_| \_\___| .__/ \___/|___/
       |___/                                      |_|              
                    https://bytebots.net 
    DO NOT CHANGE THIS AT ALL THIS IS A SIMPLE VERSION CONTROL
  This will alert you in console. if there is an update avaliable

  For those concerened that an update might break somthing we got you
  This just alerts you in console and does not auto update :) 
              
*/

const https = require('https');

function versionChecker() {
    https.get('https://bytebots.net/bbJsDiscordRepo/version.txt', (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Process the result.
        resp.on('end', () => {
            const version = data.trim();
            if (version === "0.0.1") {
                console.log("Version is 0.0.1, There is nothing to do... Happy Coding");
            } else {
                console.log("There is a new version of BBDBots. Found version: " + version);
            }
        });

    }).on("error", (err) => {
        console.log("Error fetching version: " + err.message);
    });
}

module.exports = versionChecker;
