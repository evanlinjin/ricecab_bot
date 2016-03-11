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
    {id: 133607928, cost: 2.52, name: 'Evan Lin'},
    {id: 177677828, cost: 0.48, name: 'Honour Carmichael'},
    {id: 177893563, cost: 1.52, name: 'Carl Velasco'},
    {id: 187936081, cost: 2.52, name: 'Amy Lai'},
    {id: 199377811, cost: 1.21, name: 'Vincent Wolfgramm-Russell'},
    {id: 197336637, cost: 2.52, name: 'Jay Shen'},
    {id: 175872719, cost: 2.52, name: 'David Long'}
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
    var timeStamp = msg.date;

    // FIND MONTHLY SUM >>
    var tripcost = users[uget_index(userId)].cost;
    var cost_sum = (get_total_cost(path, userId) + tripcost).toFixed(2); // costsum after checkin.
    var n_rides = get_n_rides(path, userId) + 1; // Number of rides after checkin.

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

        // PREPARE PERSONAL MESSAGE >>
        var checkin_msg = "CHECKIN SUCCESSFUL at '" + timeStamp + "'.\n"
            + "Name: " + userName + ", Cost: $" + tripcost + "\n"
            + "Run /stats for more details.";
        bot.sendMessage(chatId, checkin_msg);

        // PREPARE GLOBAL MESSAGE >>
        bot.sendMessage(ricecab_id, userName + " has checked in.");
    });
    console.log(data); // CONSOLE LOG.

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

    // Attempt to refresh stats.
    for (var i = 0; i < users.length; i++) {
        var userId = users[i].id;
        var userName = users[i].name;
        var cost_sum = (get_total_cost(path, userId)).toFixed(2);
        var n_rides = get_n_rides(path, userId);

        var l1 = "NAME: " + userName + ", ";
        var l2 = "RIDES: " + n_rides + ", ";
        var l3 = "SUM: $" + cost_sum + "\n";

        fs.writeFileSync(path + 'stats/' + userId + '.txt', l1 + l2 + l3);
    }

    // Output Stats >>

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

///////////////////////////////////////////////////// Speech Recognition Arrays.

var SRA_ride = ['give~aride', 'getaride', 'driveme', 'pick~up', 'need~ride'];

var SRA_morning = ['morning', 'touni'];
var SRA_evening = ['evening', 'afternoon', 'wayback', 'fromuni', 'backhome', 'ridehome'];

///////////////////////////////////////////////////////////////////////// Logic.

bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    var user1stName = msg.from.first_name;
    var str = msg.text; str = str.replace(/\s+/g, '').toLowerCase();

    switch (str) {
        case 'whereisevan?':
            bot.sendMessage(chatId, "Good question.");
            break;

        default:
        if (str.search('thanks') !== -1) {
            bot.sendMessage(chatId, "You're Welcome 😘");
        }
        if (if_include(str, SRA_ride) && if_include(str, 'tomorrow')) {

            var rdmsg = [
                "It is understood that ",
                " needs a ride tomorrow ",
                ". Evan will be informed! 🗣👌📢👍📡😊"
            ];

            if (if_include(str, SRA_morning)) {
                bot.sendMessage(chatId, rdmsg[0] + user1stName + rdmsg[1] + SRA_morning[0] + rdmsg[2]);
                inform_admin(user1stName + ' needs a ride tomorrow morning.');
            }
            if (if_include(str, SRA_evening)) {
                bot.sendMessage(chatId, rdmsg[0] + user1stName + rdmsg[1] + SRA_evening[0] + rdmsg[2]);
                inform_admin(user1stName + ' needs a ride tomorrow evening.');
            }
        }
    }
});

////////////////////////////////////////////////// Speech Recognition Functions.

// Should really only check a scentence at a time for accuracy.
function if_include(in_msg, phrases) {

    for (var i = 0; i < phrases.length; i++) {
        if (in_msg.search(phrases[i]) !== -1) {return true;}
        console.log('comparing: ' + in_msg + ' with: ' + phrases[i] + '.');

        // CHECK >> '~' :
        if (phrases[i].search('~') !== -1) {
            var temp_phrases = phrases[i].split('~');
            var n_incld = 0;

            for (var j = 0; j < temp_phrases.length; j++) {
                if (in_msg.search(temp_phrases[j]) !== -1) {n_incld = n_incld + 1;}
            }
            if (n_incld === temp_phrases.length) {return true;}
        }
    }
    return false;
}

//////////////////////////////////////////////// '/checkin' & '/stats' functions

// Get number of rides from specified user.
function get_n_rides(path, user_id) {
    var n_checkin = 0;
    var data;

    try { data = fs.readFileSync(path + 'logs/' + user_id + '.txt'); }
    catch (e) {
        if (e.code === 'ENOENT') {return n_checkin;}
        else {bot.sendMessage(user_id, "ERROR: In function 'get_n_rides'");}
    }

    var file_str = data.toString();

    for (var i = 0; i < file_str.length; i++) {
        if (file_str[i] === '[') { n_checkin += 1; }
    }
    return n_checkin;
}

// Get total cost from specified user.
function get_total_cost(path, user_id) {
    var data;

    try { data = fs.readFileSync(path + 'logs/' + user_id + '.txt'); }
    catch (e) {
        if (e.code === 'ENOENT') {return 0.00;}
        else {bot.sendMessage(user_id, "ERROR: In function 'get_n_rides'");}
    }

    // Convert data to lowercase, spaceless string.
    var file_str = data.toString();
    file_str = file_str.replace(/\s+/g, '').toLowerCase();

    var cmp_str = 'cost:';
    var total_cost = 0.00;

    for (var i = 0; i < file_str.length; i++) {

        // Find 'COST' in string.
        if (
            file_str[i] === cmp_str[0] &&
            file_str.slice(i, i + cmp_str.length) === cmp_str
        ) {
            // Move to after 'COST' term.
            i += cmp_str.length;

            // Find positions of two preceeding '"'s.
            var pos_PA = [];
            while (true) {
                if (file_str[i] === '"') { pos_PA.push(i); }
                if (pos_PA.length === 2) { break; }
                i += 1;
            }

            // Extract 'COST' value and add to 'total_cost'.
            total_cost += parseFloat(file_str.slice(pos_PA[0] + 1, pos_PA[1]));
        }
    }
    return total_cost;
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

function inform_admin(admin_msg) {bot.sendMessage(133607928, admin_msg);}
