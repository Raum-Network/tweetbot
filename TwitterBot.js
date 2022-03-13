const needle = require('needle');
require('dotenv').config()
const Discord = require('discord.js');

const { Client, Intents } = require('discord.js');
const { json } = require('stream/consumers');
const { getEventListeners } = require('events');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const token = process.env.BEARER_TOKEN;

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream';



// Edit rules as desired below
const rules = [{
    'value': '@RaumNetwork',
    'tag': 'TaggedAccount'
},{
    'value': '#RaumNetwork',
    'tag': 'HashTaggedAccount'
}];

async function getAllRules() {

    const response = await needle('get', rulesURL, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return(response.body);
}

//code to get and  set rules and run stream
//Comment all the code below 
// async function getrules()   {
//  let currentRules;

//     try {
//         // Gets the complete list of rules currently applied to the stream
//         currentRules = await getAllRules();

//         // Add rules to the stream. Comment the line below if you don't want to add new rules.
//         //await setRules();

//     } catch (e) {
//         console.error(e);
//         process.exit(1);
//     }

//streamConnect(0)
// }


function streamConnect(retryAttempt) {

    const stream = needle.get(streamURL, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${token}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const twitdata = JSON.parse(data);
            const iddata = Object.values(twitdata.data)
            console.log(iddata[0])
            client.login(process.env.DISCORD_TOKEN);
            client.once('ready', ()=> {
                console.log(`the client becomes ready to start`);
                //console.log(streamConnect.twitdata.data.id)
                var url = "https://twitter.com/" + "RaumNetwork" + "/status/" + iddata[0]
                console.log(url)
                    try {
                        let channel = client.channels.fetch(process.env.DISCORD_CHANNEL_ID).then(channel => {
                            channel.send(url)
                            }).catch(err => {
                              console.log(err)
                            })
                        } catch (error) {
                                console.error(error);
                          }
                        })
            retryAttempt = 0;
            
        } catch (e) {
            if (twitdata.detail === "This stream is currently at the maximum allowed connection limit.") {
                console.log(twitdata.detail)
                process.exit(1)
            } else {
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt);
            }, 2 ** retryAttempt)
        }
    });

    return stream  ;
}

streamConnect(0);


