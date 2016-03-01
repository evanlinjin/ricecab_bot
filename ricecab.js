///////////////////////////////////////////////////////////////// Library Setup:

var TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');
var exec = require('child_process').exec;
var cron = require('node-cron');

//////////////////////////////////////////////// Load "Ricecab Bot" Information:

var token = '216808904:AAFqAjnnVVpHmKU4ZsExIMNuUdZX8R49YSQ';
var bot = new TelegramBot(token, {polling: true});
var ricecab_id = -116496721;
var bank_acc = '12-3086-0261060-00';
var path = '/home/pi/ricecab_bot/';

/////////////////////////////////////////////////////// Load "User Information":

var users = [
    {id : 133607928, cost: 2.52}, // Evan Lin
    {id : 177677828, cost: 0.48}, // Honour Carmichael
    {id : 177893563, cost: 1.52}, // Carl Velasco
    {id : 187936081, cost: 2.52}, // Amy Lai
    {id : 199377811, cost: 1.21}  // Vincent Wolfgramm-Russel
];

function uget_index(id) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === id) {return i;}
    }
    return 0;
}

//////////////////////////////////////////////// "Ricecab Bot" Logic Definition:
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "/checkin"

bot.onText(/\/checkin/, function(msg, match) {
    var chatId = msg.chat.id;
    var userName = msg.from.first_name + ' ' + msg.from.last_name;
    var userId = msg.from.id;
    var timeStamp = new Date();

    // FIND MONTHLY SUM >>
    exec('wc ' + path + 'logs/' + userId + '.txt', function(err, file_data) {
        var n_lines = file_data.toString().split(" ", 3);
        var n_l = n_lines.slice(2, n_lines.length);
        var tripcost = users[uget_index(userId)].cost;
        var cost_sum = n_l * tripcost + tripcost;
        var n_rides = n_l + 1; // Number of rides after checkin.

        // DATA STRING >>
        var data = '['
        + 'CHECKIN:"' + timeStamp + '"'
        + ', NAME:"' + userName + '"'
        + ', ID:"' + userId + '"'
        + ', COST:"' + tripcost + '"'
        + ', MONTHLY_SUM:"' + cost_sum + '"'
        + ']\n';

        // FILE IO >>
        // Make Stats File.
        var l1 = "NAME: " + userName + ", ";
        var l2 = "RIDES: " + n_rides + ", ";
        var l3 = "SUM: $" + cost_sum + "\n";

        fs.writeFile(path + 'stats/' + userId + '.txt', l1 + l2 + l3, function(err) {
            if(err) {
                bot.sendMessage(chatId, "ERROR: '/checkin' stats cannot be compiled.");
                console.log(chatId + " ERROR: '/checkin' stats cannot be compiled.");
            }
        });

        // Append to Log File.
        fs.appendFile(path + 'logs/' + userId + '.txt', data, function(err) {
            if(err) {
                bot.sendMessage(chatId, "ERROR: '/checkin' request error.");
                console.log(chatId + " ERROR: '/checkin' request error.");
            }

            // PREPARE MESSAGE >>
            bot.sendMessage(chatId, data);
            // Inform others if Evan has checked in.
            if (userId === 133607928) {
                var evan_msg = "Your driver, " + userName + ", has checked in."
                + "\nThose who aren't here need to hurry the curry!";
                bot.sendMessage(ricecab_id, evan_msg);
            }
        });
        console.log(data); // CONSOLE LOG.
    });
});

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "/info"
bot.onText(/\/info/, function(msg, match) {
    var chatId = msg.chat.id;

    fs.readFile(path + 'INFO', function(err, data) {
        if (err) {
            bot.sendMessage(chatId, "ERROR: '/info' request has issues.");
            console.log(chatId + " ERROR: '/info' request has issues.");
        }
        bot.sendMessage(chatId, data.toString());
        console.log("[INFO request on " + chatId + "]");
    });
});

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "/stats"
bot.onText(/\/stats/, function(msg, match) {

    var chatId = msg.chat.id;
    var userName = msg.from.first_name + ' ' + msg.from.last_name;
    var userId = msg.from.id;
    var l0 = "** STATS **\n";

    exec('cat ' + path + 'stats/*', function(err, file_data) {
        if (err) {
            bot.sendMessage(chatId, l0 + "Nothing to show.");
        } else {
            bot.sendMessage(chatId, l0 + file_data.toString());
        }
        console.log("[STATS request on " + chatId + "]");
    });
});

///////////////////////////////////////////////////////// ADMINISTRATOR COMMANDS

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "/\"
bot.onText(/\/go/, function(msg, match) {
    var userName = msg.from.first_name + ' ' + msg.from.last_name;
    if (msg.from.id === 133607928) {
        bot.sendMessage(ricecab_id, "Evan is on his way to the car now!");
        console.log("[GO request by " + userName + ": APPROVED]");
    } else {
        console.log("[GO request by " + userName + ": REJECTED]");
    }
});

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "/reset"
bot.onText(/\/reset/, function(msg, match) {
    var userName = msg.from.first_name + ' ' + msg.from.last_name;
    if (msg.from.id === 133607928) {
        reset_all();
        console.log("[RESET request by " + userName + ": APPROVED]");
    } else {
        console.log("[RESET request by " + userName + ": REJECTED]");
    }
});

//////////////////////////////////////////////////////////////////////////// FUN

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "/photo"
bot.onText(/\/what_is_evan_doing/, function(msg, match) {
    var chatId = msg.chat.id;
    var userName = msg.from.first_name + ' ' + msg.from.last_name;
    var userId = msg.from.id;
    var timeStamp = new Date();

    if (msg.chat.id !== ricecab_id) {
        access_denied( '/photo', userName, userId, chatId, timeStamp);
    } else {
        access_granted( '/photo', userName, userId, chatId, timeStamp);
        bot.sendMessage(ricecab_id, "Let me find out...");

        var photo_file_dir = (path + 'cam.jpg');
        exec('raspistill -vf -hf -o ' + photo_file_dir, function(err, io_data) {
            if (err) {
                bot.sendMessage(ricecab_id, "ERROR: '/what_is_evan_doing' Unable to generate photo.");
            } else {
                send_photo(ricecab_id, photo_file_dir, timeStamp.toString());
            }
        });
    }
});

///////////////////////////////////////////////////////////////////// AUTOMATION

cron.schedule('* 0 0 1 1-12 *', function() {
    console.log("[RESET request by AUTOMATION: APPROVED]");
    reset_all();
    setTimeout(console.log("[RESET request completed.]"), 1000*60*5); // 5min timeout.
});

function reset_all() {
    var timeStamp = new Date();
    var line = "\n💰*💰*💰*💰*💰*💰*💰*💰*💰\n\n";

    var l0 = "💰💰 PAYDAY INFORMATION 💰💰\n\n"
    + "Hey all! I have just been informed by my master, @evanlinjin, "
    + "that it is time for you all to pay your share of money.\n\n"
    + "Please transfer the required amount of money (shown below) "
    + "to his bank account: " + bank_acc + ".\n";

    exec('cat ' + path + 'stats/*', function(err, file_data) {
        if (err) {
            bot.sendMessage(ricecab_id, l0 + line + "Nothing to show.\n" + line + timeStamp);
        } else {
            bot.sendMessage(ricecab_id, l0 + line + file_data.toString() + line + timeStamp);

            // RESET ALL >>
            exec('rm ' + path + 'stats/* ' + path + 'logs/*', function(err, rm_output) {
                if (err) {
                    bot.sendMessage(ricecab_id, "ERROR: '/reset' request error.");
                    console.log(ricecab_id + " ERROR: '/reset' request error.");
                }
            });
        }
    });
}

/////////////////////////////////////////////////////////////// CAMERA FUNCTIONS

function send_photo(chat_id, photo_file_dir, caption_desc) {
    bot.sendPhoto(chat_id, photo_file_dir, {caption: caption_desc});
}

////////////////////////////////////////////////////////// CONSOLE LOG FUNCTIONS

function access_denied(cmd, userName, userId, chatId, timeStamp) {
    var msg = "ON " + timeStamp + " >>\n" +
    "[ACCESS DENIED] CMD: '" + cmd + "'" +
    ", Name: "    + userName +
    ", User ID: " + userId +
    ", Chat ID: " + chatId + "\n";
    console.log(msg);
}

function access_granted(cmd, userName, userId, chatId, timeStamp) {
    var msg = "ON " + timeStamp + " >>\n" +
    "[ACCESS GRANTED] CMD: '" + cmd + "'" +
    ", Name: "    + userName +
    ", User ID: " + userId +
    ", Chat ID: " + chatId + "\n";
    console.log(msg);
}
