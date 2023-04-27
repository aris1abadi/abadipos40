import express from 'express'

import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import { handler } from '../build/handler.js'
import { MongoClient } from 'mongodb'
//import {getTimeCode} from '$lib/myFunction'
import qrcode from 'qrcode'

//import {dataMenuStore,dataPelanggan,n_order} from "../src/lib/stores/store.js"
//import {getFormatJam,getFormatTanggal} from "../src/lib/myFunction"
import pkg from 'whatsapp-web.js';
const { Client, Location, List, Buttons, LocalAuth } = pkg;
const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

const uri = 'mongodb://localhost:27017'
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true
}

let client
let clientPromise

let dataMenu
let dataPelanggan
let transaksiCountNow = 0

const wa_order = {
    _id: ' ',
    pelanggan: '-',
    jenis_order: 'Online',
    time: '-',
    tgl: '-',
    untuk_tgl: '-',
    status: 'open',
    totalTagihan: 0,
    totalDp: 0,
    totalItem: 0,
    item: []
}



let dta
let tes = 0
let waMsg

const port = 5173
const app = express()
const server = createServer(app)

//dataload
process.nextTick(function () {
    loadMenu()
    loadPelanggan()
    loadTransaksiJualCount()

})


//-------------------WA handle----------------
waClient.initialize();

waClient.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

waClient.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
    //qrcode.generate(qr, { small: true })
    qrcode.toDataURL(qr, (err, url) => {
        ioServer.emit('qr', url);
        //socket.emit('message', 'QR Code received, scan please!');
      });
});

waClient.on('authenticated', () => {
    console.log('AUTHENTICATED');
    
});

waClient.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
    ioServer.emit('waError', "AUTHENTICATION FAILURE");
});

waClient.on('ready', () => {
    console.log('READY');
    ioServer.emit('waReady', "wa sudah siap");
});


waClient.on('message', async msg => {
    //console.log('MESSAGE RECEIVED', msg);
    if (msg.type === 'order') {
        console.log("ada order masuk")
        let newOrder = await msg.getOrder()
        //const infoPelanggan = await msg.getInfo()
        const plg = await msg.getContact()

        let waOrder = {
            order: newOrder.products,
            pelanggan: plg
        }
        waOrderHandle(waOrder, msg)

        //console.log(infoPelanggan)
        let orderConten = plg.pushname + '\n'
        orderConten += plg.number
        orderConten += '\n'
        newOrder.products.forEach((order, index) => {
            orderConten += (index + 1)
            orderConten += '.'
            orderConten += order.name
            orderConten += '('
            orderConten += order.id
            orderConten += ')'

            orderConten += ' jml:'
            orderConten += order.quantity
            orderConten += '\n'
        });
        //console.log(tes.pushname)
        console.log(orderConten)
        //console.log(newOrder)
    }

    if (msg.body === '!ping reply') {
        // Send a new message as a reply to the current one
        msg.reply('pong');

    } else if (msg.body === '!ping') {
        // Send a new message to the same chat
        waClient.sendMessage(msg.from, 'pong');

    } else if (msg.body.startsWith('!sendto ')) {
        // Direct send a new message to specific id
        let number = msg.body.split(' ')[1];
        let messageIndex = msg.body.indexOf(number) + number.length;
        let message = msg.body.slice(messageIndex, msg.body.length);
        number = number.includes('@c.us') ? number : `${number}@c.us`;
        let chat = await msg.getChat();
        chat.sendSeen();
        waClient.sendMessage(number, message);

    } else if (msg.body.startsWith('!subject ')) {
        // Change the group subject
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newSubject = msg.body.slice(9);
            chat.setSubject(newSubject);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body.startsWith('!echo ')) {
        // Replies with the same message
        msg.reply(msg.body.slice(6));
    } else if (msg.body.startsWith('!desc ')) {
        // Change the group description
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newDescription = msg.body.slice(6);
            chat.setDescription(newDescription);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body === '!leave') {
        // Leave the group
        let chat = await msg.getChat();
        if (chat.isGroup) {
            chat.leave();
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body.startsWith('!join ')) {
        const inviteCode = msg.body.split(' ')[1];
        try {
            await waClient.acceptInvite(inviteCode);
            msg.reply('Joined the group!');
        } catch (e) {
            msg.reply('That invite code seems to be invalid.');
        }
    } else if (msg.body === '!groupinfo') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`
                *Group Details*
                Name: ${chat.name}
                Description: ${chat.description}
                Created At: ${chat.createdAt.toString()}
                Created By: ${chat.owner.user}
                Participant count: ${chat.participants.length}
            `);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body === '!chats') {
        const chats = await waClient.getChats();
        waClient.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
    } else if (msg.body === '!info') {
        let info = waClient.info;
        waClient.sendMessage(msg.from, `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.wid.user}
            Platform: ${info.platform}
        `);
    } else if (msg.body === '!mediainfo' && msg.hasMedia) {
        const attachmentData = await msg.downloadMedia();
        msg.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
    } else if (msg.body === '!quoteinfo' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();

        quotedMsg.reply(`
            ID: ${quotedMsg.id._serialized}
            Type: ${quotedMsg.type}
            Author: ${quotedMsg.author || quotedMsg.from}
            Timestamp: ${quotedMsg.timestamp}
            Has Media? ${quotedMsg.hasMedia}
        `);
    } else if (msg.body === '!resendmedia' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            const attachmentData = await quotedMsg.downloadMedia();
            waClient.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
        }
    } else if (msg.body === '!location') {
        msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'));
    } else if (msg.location) {
        console.log(msg.location)
        msg.reply(msg.location);
    } else if (msg.body.startsWith('!status ')) {
        const newStatus = msg.body.split(' ')[1];
        await waClient.setStatus(newStatus);
        msg.reply(`Status was updated to *${newStatus}*`);
    } else if (msg.body === '!mention') {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        chat.sendMessage(`Hi @${contact.number}!`, {
            mentions: [contact]
        });
    } else if (msg.body === '!delete') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.fromMe) {
                quotedMsg.delete(true);
            } else {
                msg.reply('I can only delete my own messages');
            }
        }
    } else if (msg.body === '!pin') {
        const chat = await msg.getChat();
        await chat.pin();
    } else if (msg.body === '!archive') {
        const chat = await msg.getChat();
        await chat.archive();
    } else if (msg.body === '!mute') {
        const chat = await msg.getChat();
        // mute the chat for 20 seconds
        const unmuteDate = new Date();
        unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
        await chat.mute(unmuteDate);
    } else if (msg.body === '!typing') {
        const chat = await msg.getChat();
        // simulates typing in the chat
        chat.sendStateTyping();
    } else if (msg.body === '!recording') {
        const chat = await msg.getChat();
        // simulates recording audio in the chat
        chat.sendStateRecording();
    } else if (msg.body === '!clearstate') {
        const chat = await msg.getChat();
        // stops typing or recording in the chat
        chat.clearState();
    } else if (msg.body === '!jumpto') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            waClient.interface.openChatWindowAt(quotedMsg.id._serialized);
        }
    } else if (msg.body === '!buttons') {
        let button = new Buttons(
            'Button body\n\nWant to test buttons some more? Check out https://github.com/wwebjs/buttons-test',
            [
                { body: 'Some text' },
                { body: 'Try clicking me (id:test)', id: 'test' },
            ],
            'title',
            'footer'

        );
        console.log('buttons test')
        await waClient.sendMessage(msg.from, button);
    } else if (msg.body === '!list') {
        let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
        let list = new List('List body', 'btnText', sections, 'Title', 'footer');
        waClient.sendMessage(msg.from, list);
    } else if (msg.body === '!reaction') {
        msg.react('👍');
    }
});

waClient.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // do stuff here
    }
});

waClient.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    //console.log(after); // message after it was deleted.
    //if (before) {
    //    console.log(before); // message before it was deleted.
    //}
});

waClient.on('message_revoke_me', async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    //console.log(msg.body); // message before it was deleted.
});

waClient.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if (ack == 3) {
        // The message was read
    }
});

waClient.on('group_join', (notification) => {
    // User has joined or been added to the group.
    console.log('join', notification);
    notification.reply('User joined.');
});

waClient.on('group_leave', (notification) => {
    // User has left or been kicked from the group.
    console.log('leave', notification);
    notification.reply('User left.');
});

waClient.on('group_update', (notification) => {
    // Group picture, subject or description has been updated.
    console.log('update', notification);
});

waClient.on('change_state', state => {
    console.log('CHANGE STATE', state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = false;

waClient.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    //if (rejectCalls) await call.reject();
    //await waClient.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call. ${rejectCalls ? 'This call was automatically rejected by the script.' : ''}`);
});

waClient.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});



//---------------------------------------------
function bikinIdTransaksiWa() {
    let tr = 'W';
    let temp = 0;
    let tm = new Date();

    tr += String(tm.getFullYear());
    temp = tm.getMonth() + 1;
    if (temp < 10) tr += '0';
    tr += temp;

    temp = tm.getDate();
    if (temp < 10) tr += '0';
    tr += temp;
    transaksiCountNow += 1

    if (transaksiCountNow < 100) tr += '0';
    if (transaksiCountNow < 10) tr += '0';
    tr += transaksiCountNow;
    return tr
    //console.log(tr);

    //$idTransaksiJual = tr;
}

function waOrderHandle(msg, waSrc) {
    //hapus order lama
    wa_order.item = []
    wa_order.totalTagihan = 0
    wa_order.totalItem = 0
    //cek data pelanggan
    loadTransaksiJualCount()


    let newPelanggan = true
    let plg = {
        _id: 'P' + msg.pelanggan.number,
        nama: msg.pelanggan.pushname,
        telp: msg.pelanggan.number,
        map: '0,0',
        alamat: "-"

    }
    dataPelanggan.forEach((pelanggan) => {
        if ((pelanggan.nama === plg.nama) && (pelanggan._id === plg._id)) {
            newPelanggan = false
        }
    })
    if (newPelanggan) {
        console.log("waOrderHandle", "simpan pelanggan baru")
        simpanPelanggan(plg)

    }
    let timeNow = getFormatTanggal()
    timeNow += ' '
    timeNow += getFormatJam()
    let jmlItem = 0;


    wa_order.pelanggan = plg
    wa_order.time = getFormatJam()
    wa_order.tgl = getFormatTanggal()


    let itemNow = {
        time: timeNow,
        itemDetil: []
    };
    //                '-------------------------------'
    let waResponse = '              Pesanan Anda\n'
    waResponse += 'No.pesanan......: '
    waResponse += wa_order._id
    waResponse += '\nNama...........: '
    waResponse += plg.nama
    waResponse += '\nNomer Antrian..: \n'
    waResponse += 'Antrian sekarang: \n'
    waResponse += '-------------------------------------------------\n'

    let stokHabis = false
    let stokResp = '  Persediaan menu kami Habis:\n'
    stokResp += '-------------------------------------------------\n'

    dataMenu.forEach((menu, index) => {
        msg.order.forEach((order, index) => {
            if (menu.id_wa === order.id) {
                let odr = {
                    id: menu.id,
                    nama: menu.nama,
                    harga: menu.harga,
                    jml: order.quantity,
                    //catatan: $dataMenuStore[i].catatan
                };
                //if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
                if (menu.stok === 0) {
                    stokHabis = true

                } else {
                    itemNow.itemDetil.push(odr);
                    wa_order.totalTagihan += odr.jml * odr.harga
                    wa_order.totalItem += odr.jml

                    waResponse += odr.nama
                    waResponse += " ("
                    waResponse += odr.jml
                    waResponse += ')\n'
                }



            }
        })
        if (menu.stok === 0) {
            stokResp += menu.nama + ' habis,\n'

        }

    })
    if (stokHabis) {
        stokResp += '-------------------------------------------------'
        stokResp += '\nSilahkan Ulangi pesanan anda \n '
        stokResp += 'Pilih menu yang masih tersedia'
        kirimResponseWa(waSrc.from, stokResp)
    } else {
        wa_order.item.push(itemNow);
        simpanTransaksiJual(wa_order);
        simpanTransaksiJualCount(transaksiCountNow)
        //console.log('wa_order', wa_order)
        waResponse += '-------------------------------------------------'
        waResponse += '\nTotal                     : '
        waResponse += rupiah(wa_order.totalTagihan)
        waResponse += "\n\n    Pesanan Anda Segera kami proses\n"
        waResponse += "                 TerimaKasih\n"
        kirimResponseWa(waSrc.from, waResponse)
    }
}

function rupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

function kirimResponseWa(dest, msg) {
    waClient.sendMessage(dest, msg)
}

const ioServer = new Server(server, {
    cors: {
        //origin: "http://192.168.0.110:3000",
        origin: "*",
        methods: ["GET", "POST"]
    }
})
/*
app.use(cors({0.110:3000",
    methods: ["GET", "POST"]
  }));
    origin: "http://192.168.
  */

client = new MongoClient(uri, options)
clientPromise = client.connect()

ioServer.on('connection', (socket) => {
    socket.on('fromClient', msg => {
        //console.log('ini dari client: ' + msg)
        if (msg === 'getMenu') {
            loadMenu()
        } else if (msg === 'getMenuPesenan') {
            loadMenuPesenan()

        } else if (msg === 'getTransaksiJual') {
            loadTransaksiJual()
        } else if (msg === 'getTransaksiJualOpen') {
            loadTransaksiJualOpen()
        }
        else if (msg === 'getTransaksiJualCount') {
            loadTransaksiJualCount()
        } else if (msg === 'getBahan') {
            loadBahan()
        } else if (msg === 'getTransaksiBeli') {
            loadTransaksiBeli()
        } else if (msg === 'getTransaksiBeliCount') {
            loadTransaksiBeliCount()
        } else if (msg === 'getSuplier') {
            loadSuplier()
        } else if (msg === 'getPelanggan') {
            loadPelanggan()
        } else if (msg === 'getCloseTransaksiNow') {
            loadCloseTransaksiNow()
        }
    })

    socket.on('simpanTransaksiJual', msg => {
        simpanTransaksiJual(msg)
    })

    socket.on('simpanTransaksiBeli', msg => {
        simpanTransaksiBeli(msg)
    })

    socket.on('simpanTransaksiJualCount', msg => {
        simpanTransaksiJualCount(msg)
    })

    socket.on('simpanTransaksiBeliCount', msg => {
        simpanTransaksiBeliCount(msg)
    })


    socket.on('updateTransaksiJual', msg => {
        updateTransaksiJual(msg)
    })

    socket.on('closeTransaksiJual', msg => {
        closeTransaksiJual(msg)
    })

    socket.on('updateStok', msg => {
        updateStok(msg)
    })

    socket.on('tambahStok', msg => {
        tambahStok(msg)
    })

    socket.on('hapusItemLama', msg => {
        hapusItemLama(msg)
    })


    // Receive incoming messages and broadcast them
    socket.on('message', (message) => {
        ioServer.emit('message', {
            from: username,
            message: message,
            time: new Date().toLocaleString()
        });
    });
});


// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler)

server.listen(port)

function getTimeCode() {
    let tr = '';
    let temp = 0;
    let tm = new Date();

    tr = String(tm.getFullYear());
    temp = tm.getMonth() + 1;
    if (temp < 10) tr += '0';
    tr += temp;

    temp = tm.getDate();
    if (temp < 10) tr += '0';
    tr += temp;
    return tr
}

async function loadMenu() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataMenu').find().toArray()
        if (dta) {
            dataMenu = dta
            //console.log("load_dataMenu",dataMenu)
            ioServer.emit('myMenu', dta)
        }
        //
    } catch (err) {
        console.log(err)
    }
}

async function loadBahan() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataBahan').find().toArray()
        if (dta) {
            ioServer.emit('myBahan', dta)
        }

        //
    } catch (err) {
        console.log(err)
    }
}

async function loadSuplier() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataSuplier').find().toArray()
        if (dta) {
            ioServer.emit('mySuplier', dta)
        }

        //
    } catch (err) {
        console.log(err)
    }
}

async function loadPelanggan() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataPelanggan').find().toArray()
        if (dta) {
            dataPelanggan = dta
            ioServer.emit('myPelanggan', dta)
        }

        //
    } catch (err) {
        console.log(err)
    }
}


async function loadMenuPesenan() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataMenuPesenan').find().toArray()
        if (dta) {
            ioServer.emit('myMenuPesenan', dta)
        }
        //
    } catch (err) {
        console.log(err)
    }
}

async function loadTransaksiJual() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataTransaksiJual').find({ status: 'open' }).toArray()
        if (dta) {
            ioServer.emit('myTransaksiJual', dta)
        }
        //
    } catch (err) {
        console.log(err)
    }
}

async function loadTransaksiJualOpen() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        const dataNew = await db.collection('dataTransaksiJual').find({ status: 'open' }).toArray()
        if (dataNew) {
            ioServer.emit('myTransaksiJualOpen', dataNew)
        }
        //
    } catch (err) {
        console.log(err)
    }
}

async function loadTransaksiBeli() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataTransaksiBeli').find({ status: 'open' }).toArray()
        if (dta) {
            ioServer.emit('myTransaksiBeli', dta)
        }
        //
    } catch (err) {
        console.log(err)
    }
}

function getFormatJam() {
    let tm = new Date();

    let temp

    let tr = String(tm.getHours())
    tr += ':';
    tr += String(tm.getMinutes());
    tr += ':'
    tr += String(tm.getSeconds())
    return tr
}


function getFormatTanggal() {
    let tm = new Date();

    let tr = String(tm.getDate())
    tr += '/';
    tr += String(tm.getMonth() + 1);
    tr += '/'
    tr += String(tm.getFullYear())
    return tr
}


async function loadCloseTransaksiNow() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')


        let tanggal = getFormatTanggal()
        //console.log("tanggal sekarang" + tanggal)
        const dataNow = await db.collection('dataTransaksiJual').find({ $and: [{ tgl: tanggal }, { status: 'close' }] }).toArray()
        if (dataNow) {
            ioServer.emit('myCloseTransaksiNow', (dataNow))
            //console.log(dataNow)
        }
        //
    } catch (err) {
        console.log(err)
    }
}


async function loadTransaksiJualCount() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataTransaksiCount').findOne({ name: 'transaksiCount' })
        if (dta) {
            //console.log(dta.timeCode)
            let tc = getTimeCode()
            if (tc !== dta.timeCode) {
                await db.collection('dataTransaksiCount').updateOne({ name: 'transaksiCount' }, { $set: { transaksiBeliCount: 0 } })
                await db.collection('dataTransaksiCount').updateOne({ name: 'transaksiCount' }, { $set: { transaksiJualCount: 0 } })
                await db.collection('dataTransaksiCount').updateOne({ name: 'transaksiCount' }, { $set: { timeCode: tc } })
                dta.transaksiJualCount = 0;
                console.log("reset transaksi count")
            }
            transaksiCountNow = dta.transaksiJualCount
            wa_order._id = bikinIdTransaksiWa();
            ioServer.emit('myTransaksiJualCount', (dta.transaksiJualCount))


        }
        //
    } catch (err) {
        console.log(err)
    }
}

async function loadTransaksiBeliCount() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataTransaksiCount').findOne({ name: 'transaksiCount' })
        if (dta) {
            ioServer.emit('myTransaksiBeliCount', (dta.transaksiBeliCount))
        }
        //
    } catch (err) {
        console.log(err)
    }
}

async function simpanTransaksiJual(data) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataTransaksiJual').insertOne(data)

        loadTransaksiJual()

        ////

    } catch (err) {
        console.log(err)
    }
}

async function simpanTransaksiBeli(data) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataTransaksiBeli').insertOne(data)
        console.log(JSON.stringify(data))
        loadTransaksiBeli()

        ////

    } catch (err) {
        console.log(err)
    }
}

async function updateTransaksiJual(data) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataTransaksiJual').updateOne({ _id: data._id }, { $set: { id_pelanggan: data.id_pelanggan, nama_pelanggan: data.nama_pelanggan, jenis_order: data.jenis_order, totalTagihan: data.totalTagihan, totalBayar: data.totalBayar, item: data.item } })
        //update stok disini

        loadTransaksiJualOpen()
        ////

    } catch (err) {
        console.log(err)
    }
}




async function simpanTransaksiJualCount(count) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataTransaksiCount').updateOne({ name: 'transaksiCount' }, { $set: { transaksiJualCount: count } })
        console.log('transaksi jual count: ' + count)
        loadTransaksiJualCount()
        ////
    } catch (err) {
        console.log(err)
    }

}

async function simpanTransaksiBeliCount(count) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataTransaksiCount').updateOne({ name: 'transaksiCount' }, { $set: { transaksiBeliCount: count } })
        console.log('transaksi Beli count: ' + count)
        loadTransaksiBeliCount()
        ////
    } catch (err) {
        console.log(err)
    }

}

async function simpanPelanggan(dataPlg) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataPelanggan').insertOne(dataPlg)
        loadPelanggan();
        ////
    } catch (err) {
        console.log(err)
    }

}
/*
async function simpanTransaksi(dt, tc) {

    //simpan transaksi
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        //const collection = db.collection('dataTransaksijual')
        const tes = await db.collection('dataTransaksiJual').insertOne(dt)
        //console.log(tes)
        //update transaksiJualCount
        await db.collection('dataTransaksiCount').updateOne({ name: 'transaksiCount' }, { $set: { transaksiJualCount: tc } })

        cekTransaksiCount();
        //load new transaksi jual
        dta = await db.collection('dataTransaksiJual').find({ status: 'open' }).toArray()
        if (dta) {
            // console.log(dta)
            sck.emit('fromServer', { cmd: 'dataTransaksiJual', payload: dta })
        }


        updateStok(dt.item);
        //dt.item.forEach(item => {
        //     console.log(item.nama + ' stok:' + item.jml)
        // });
    } catch (err) {
        console.log(err)
    }
}

async function cekTransaksiCount() {
    const client = await clientPromise
    const db = client.db('abadipos')
    dta = await db.collection('dataTransaksiCount').findOne({ name: 'transaksiCount' })
    if (dta) {
        dta.transaksiJualCount += 1
        sck.emit('fromServer', { cmd: 'transaksiCount', payload: dta })
        console.log('kirim data count ' + dta.transaksiJualCount)
    }
}

async function updateTransaksi(dt) {
    //update
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        await db.collection('dataTransaksiJual').updateOne({ _id: dt._id }, { $set: { nama_pelanggan: dt.nama_pelanggan, jenis_order: dt.jenis_order, status: dt.status, totalTagihan: dt.totalTagihan, totalBayar: dt.totalBayar, item: dt.item } })
        //load new transaksi jual
        let dta = await db.collection('dataTransaksiJual').find({ status: 'open' }).toArray()
        if (dta) {
            console.log(dta)
            sck.emit('fromServer', { cmd: 'dataTransaksiJual', payload: dta })
        }

    } catch (err) {
        console.log(err)
    }

}
*/
async function closeTransaksiJual(data) {

    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        const tes = await db.collection('dataTransaksiJual').updateOne({ _id: data._id }, { $set: { id_pelanggan: data.id_pelanggan, nama_pelanggan: data.nama_pelanggan, jenis_order: data.jenis_order, status: 'close', totalTagihan: data.totalTagihan, totalBayar: data.totalBayar, item: data.item } })
        console.log('close transaksi')
        loadTransaksiJual()
        ////
    } catch (err) {
        console.log(err)
    }
    //client.close()

}
async function tambahStok(newStok) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        const menu = await db.collection('dataMenu').find().toArray()
        //console.log(newData)

        let jml = 0;
        let stok_id = []
        newStok.forEach((item) => {
            menu.forEach((mn) => {
                if (mn.id === item.id) {
                    db.collection('dataMenu').updateOne({ id: item.id }, { $set: { stok: item.jml } })
                    //console.log('update stok: ' + item.nama)

                }

                //cek resepId
            })


        })
        loadMenu()
        //
    } catch (err) {
        console.log(err)
    }


}

async function hapusItemLama(id) {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        let itm = []
        console.log("hapus item " + id)
        const tes = await db.collection('dataTransaksiJual').updateOne({ _id: id }, { $set: { item: itm, totalTagihan: 0 } })

    } catch (err) {
        console.log(err)
    }

}

async function updateStok(newData) {

    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        const tes = await db.collection('dataMenu').updateOne({ id: newData.id }, { $set: { stok: newData.newStok } })

        //console.log(newData)
        /*
                let jml = 0;
                let stok_id = []
                newData.itemDetil.forEach((item) => {
                    menu.forEach((mn) => {
                        if (mn.id === item.id) {
                            jml = mn.stok - item.jml
                            db.collection('dataMenu').updateOne({ id: item.id }, { $set: { stok: jml } })
                            //console.log('update stok: ' + item.nama)
                            stok_id = mn.resepId
                        }
        
                        //cek resepId
                    })
                    if (stok_id) {
                        console.log(JSON.stringify(stok_id))
                        let newId = 0
                        menu.forEach((mn) => {
                            if (mn.id !== item.id) {
                                mn.resepId.forEach((stk, index) => {
                                    stok_id.forEach((stokId) => {
                                        if (stokId === stk) {
                                            if (newId !== mn.id) {
                                                newId = mn.id                                        
                                                
                                                db.collection('dataMenu').updateOne({ id: mn.id }, { $set: { stok: jml } })
                                                //console.log("newId: " + newId)
                                                //console.log('update stok lain: ' + mn.nama)
                                            }
        
                                        }
                                    })
                                })
                            }
                            newId = 0
        
                            //cek resepId
                        })
        
        
                    }
                    //console.log(item.nama + ' > ' + item.jml)
        
        
                })
                */
        loadStok()
        //
    } catch (err) {
        console.log(err)
    }

}

async function loadStok() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')
        const st = await db.collection('dataMenu').find().toArray()

        let stokNow = []

        st.forEach((mn, index) => {
            stokNow.push(mn.stok)
        })
        ioServer.emit('myStok', stokNow)
        //console.log(stokNow)

    } catch (err) {
        console.log(err)
    }
}
