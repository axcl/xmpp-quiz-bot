const connection = require('./xmpp');
const conArr = [];
const master = function () {
    const con = new connection();
    const id1 = con.init('test1user', 'passw0rd123');
    id1.on("stanza", async (stanza) => {
        if (stanza.is('message') && stanza.getChild('body') && stanza.getChild('body').text()) {
            if (stanza.attrs.type === 'chat') {
                if (stanza.getChildText('body').trim().indexOf('join#') === 0 && stanza.getChildText('body').split('#').length === 4) {
                    conArr.push(new connection());
                    var d = stanza.getChildText('body').trim().toLowerCase().split('#');
                    try {
                        conArr[conArr.length - 1].init(d[1], d[2], d[3], 'quiz', stanza.attrs.from.split('@')[0]);
                    } catch (error) {
                        console.error(error)
                    }

                }
            }
        }
    });

}

master();