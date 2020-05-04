const { client, xml, jid } = require("@xmpp/client");

const debug = require("@xmpp/debug");
const botHelper = require('./botHelper');

module.exports = function () {
    return {
        address: null,
        xmpp: null,
        init: function (username, password, roomname, type, master) {
            this.xmpp = client({
                service: "wss://chitbuzz.com:5001/ws",
                domain: "chitbuzz.com",
                resource: `cbbot.${(Math.floor(Math.random() * 90000) + 10000)}`,
                username: username,
                password: password,
            });
            debug(this.xmpp, true);
            var _self = this;
            this.xmpp.on("error", (err) => {
                console.error(err);
            });

            this.xmpp.on("offline", () => {
                console.log("offline");
            });

            this.xmpp.on("stanza", async (stanza) => {
                if (type == 'quiz' && stanza.is('message') && stanza.getChildText('body')) {
                    if (stanza.getChildText('body').trim().indexOf('bot@left') === 0)
                        _self.leaveRoom(`${roomname}@conference.chitbuzz.com`);
                }

                // if (stanza.is("message")) {
                //     await xmpp.send(xml("presence", { type: "unavailable" }));
                //     await xmpp.stop();
                // }
            });

            this.xmpp.on("online", async (address) => {
                // Makes itself available
                await _self.xmpp.send(xml("presence"));
                _self.address = address;
                if (roomname)
                    _self.joinRoom(`${roomname}@conference.chitbuzz.com`);
                //bind Bot Helper 
                const bot = new botHelper(_self.xmpp, `${roomname}@conference.chitbuzz.com`, master);
            });

            this.xmpp.start().catch(console.error);
            return this.xmpp;
        },
        joinRoom: async function (roomJid) {
            let messageJoin = xml('presence', { to: roomJid + '/' + this.address.local, type: 'available', from: this.address.toString() })
            await this.xmpp.send(messageJoin);
        },
        leaveRoom: async function (roomJid) {
            let messageLeft = xml('presence', { to: roomJid + '/' + this.address.local, type: 'unavailable', from: this.address.toString() })
            await this.xmpp.send(messageLeft);
        },
    }
}
