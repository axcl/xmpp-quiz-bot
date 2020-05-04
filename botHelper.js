const fs = require('fs');
const quizDb = require('./questions');
const { xml } = require("@xmpp/client");

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

module.exports = function (messageHandler, roomName, master) {
    var questionsArr = shuffle(quizDb);
    var currentQuest = null, idleTry = 0;
    var groupScores = { room: roomName, scores: {} };
    var setting = {
        quiz: true,
        qTlimit: 12000,
        qIndex: 0,
        masters: [master]
    },
        questionsArrLen = questionsArr.length;
    var commands = ['quiz@start', 'quiz@stop', 'qspeed@'];
    var quizInterval, currentAns = '', showScoreInterval, quesStartTime = 0;

    function sendMsg(msg) {
        const message = xml(
            "message",
            { type: "groupchat", to: roomName },
            xml("body", {}, msg),
        );
        messageHandler.send(message)
            .then(i => undefined).catch(e => undefined);
    }

    function handleBotCmd(msg, from) {
        switch (msg) {
            case 'quiz@start':
                setting.quiz = true;
                quizInterval = setInterval(function () {
                    var data = questionsArr[setting.qIndex].split('|');
                    if (currentQuest === null) {
                        currentAns = data[1];
                        sendMsg(data[0])
                    } else {
                        if (idleTry > 5) {
idleTry=0;
currentAns=null;
                            sendMsg('Fools Correct answer is ' + currentAns);
                        } else {
                            idleTry++;
                            sendMsg(data[0]);
                        }

                    }
                }, setting.qTlimit);
                showScoreInterval = setInterval(function () {
                    var scores = `Top 5 Scores:`;
                }, 300 * 1000);
                sendMsg('Quiz started.');
                break;
            case 'quiz@stop':
                clearInterval(quizInterval);
                clearInterval(showScoreInterval);
                setting.quiz = false;
                sendMsg('Quiz stopped.');
                break;
            default:
                if (msg.indexOf('addmas@') === 0 && msg.split('@').length > 1) {
                    if (setting.masters.indexOf(msg.split('@')[1]) === -1)
                        setting.masters.push(msg.split('@')[1]);
                    sendMsg(msg.split('@')[1] + ' added to commanders.');

                } else if (msg.indexOf('delmas@') === 0 && msg.split('@').length > 1) {
                    setting.masters.splice(setting.masters.indexOf(msg.split('@')[1]), 1);
                    sendMsg(`${msg.split('@')[1]} deleted from commanders.`);
                } else if (msg.indexOf('qtime@') === 0 && msg.split('@').length > 1) {
                    if (!isNaN(msg.split('@')[1]) && msg.split('@')[1] > 3)
                        setting.qTlimit = parseInt(msg.split('@')[1]) * 1000;
                    else
                        sendMsg('Must be greater than 3 sec.');
                }
                break;
        }


    }
    var cnfg = {
        correct: 0,
        score: 0
    };
    function handleMsg(msg, from) {
        if (msg.trim().toLowerCase() == currentAns.trim().toLowerCase()) {
            currentAns = null;
idleTry=0;
            if (groupScores.scores.hasOwnProperty(from)) {
                groupScores.scores[from].correct++;
                groupScores.scores[from].score += 100;
            } else {
                groupScores.scores[from] = Object.assign({}, cnfg);
                groupScores.scores[from].correct++;
                groupScores.scores[from].score += 100;
            }
            sendMsg(`${from}: you have answered correctly!`);
            setting.qIndex = setting.qIndex < questionsArrLen - 1 ? setting.qIndex + 1 : 0;
        }
    }

    messageHandler.on("stanza", async (stanza) => {
        if (stanza.is('message') && stanza.getChildText('body') && stanza.attrs.type === 'groupchat') {
            if (stanza.getChildText('body').trim().indexOf('@') !== -1 && setting.masters.indexOf(stanza.attrs.from.split('/')[1]) > -1) {
                handleBotCmd(stanza.getChildText('body').trim());
            } else if (setting.quiz) {
                handleMsg(stanza.getChildText('body').trim(), stanza.attrs.from.split('/')[1]);
            }
        }
    })
};
