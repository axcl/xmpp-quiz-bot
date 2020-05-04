const connection = require('./xmpp');
const { xml } = require('@xmpp/client');
const conArr = [];
const master = function () {
    const con = new connection();
    const id1 = con.init('cbquizbot', 'chitbuzz!123##');
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
            } else if (stanza.attrs.type === 'subscribe') {
                let message = xml(
                    "presence",
                    {
                        type: "subscribed", from: this.address,
                        to: stanza.attrs.from
                    });
                id1.send(message);
            }
        }
    });

}

master();