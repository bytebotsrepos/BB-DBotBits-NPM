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

const sqlite3 = require('sqlite3').verbose();
const { client } = require('./discordHandler'); 
const { promoteUserOnXP, promotionRoleId, requiredPrmoteLevel } = require('./settings/settings'); 

//All Database things
const db = new sqlite3.Database('user_levels.db');

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS user_levels (
  user_id INTEGER,
  guild_id INTEGER,
  xp INTEGER,
  level INTEGER,
  PRIMARY KEY (user_id, guild_id)
)`);

function discordXP() {
  //Listen for all messages
  client.on('messageCreate', async (message) => {
    // Ignore messages from any bots
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Insert and/or ignore the user level data
    db.run(
      `INSERT OR IGNORE INTO user_levels (user_id, guild_id, xp, level) VALUES (?, ?, ?, ?)`,
      [userId, guildId, 0, 0]
    );

    // Update XP
    db.run(
      `UPDATE user_levels SET xp = xp + 10 WHERE user_id = ? AND guild_id = ?`,
      [userId, guildId],
      function (err) {
        if (err) console.error(err);
      }
    );

    // Get teh XP and level
    db.get(
      `SELECT xp, level FROM user_levels WHERE user_id = ? AND guild_id = ?`,
      [userId, guildId],
      (err, row) => {
        if (err) console.error(err);

        const { xp, level } = row;

        // Leveleling up system logic
        if (xp >= level * 100) {
          const newLevel = level + 1;

          db.run(
            `UPDATE user_levels SET level = ? WHERE user_id = ? AND guild_id = ?`,
            [newLevel, userId, guildId],
            function (err) {
              if (err) console.error(err);

              message.channel.send(`Congratulations, ${message.author}, you reached level ${newLevel}!`);

              // settings if turned on promote on xp level 5
              if (newLevel === requiredPrmoteLevel && promoteUserOnXP) {
                // Try to fetch the role by ID
                const role = message.guild.roles.cache.get(promotionRoleId);

                if (role) {
                  // gets the member and add the role
                  const member = message.guild.members.cache.get(userId);
                  if (member) {
                    member.roles.add(role)
                      .then(() => {
                        message.channel.send(`${message.author}, you've been promoted for reaching level 5!`);
                      })
                      .catch((err) => {
                        console.error(`Failed to assign role to ${message.author.tag}:`, err);
                        message.channel.send(`Sorry, ${message.author}, I couldn't promote you.`);
                      });
                  }
                } else {
                  console.error(`Role with ID ${promotionRoleId} not found.`);
                }
              }
            }
          );
        }
      }
    );
  });
}

//As always exports the required func
module.exports = { discordXP };