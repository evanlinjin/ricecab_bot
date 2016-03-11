require('./ricecab.js');

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
