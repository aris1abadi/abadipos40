// require('dotenv').config();
import express from 'express';

import { createServer } from 'http';
import { Server } from 'socket.io';

import { handler } from '../build/handler.js';
import { MongoClient } from 'mongodb';
import qrcode from 'qrcode';


//import {dataMenuStore,dataPelanggan,n_order} from "../src/lib/stores/store.js"
//import {getFormatJam,getFormatTanggal} from "../src/lib/myFunction"
//const { Client, Location, List, Buttons, LocalAuth } = require('./index');
import pkg from 'whatsapp-web.js';
const { Client,  Location, List, Buttons,LocalAuth } = pkg;
const waClient = new Client({
	authStrategy: new LocalAuth(),
	puppeteer: { headless: true }
});

const uri = 'mongodb://localhost:27017';
const options = {
	useUnifiedTopology: true,
	useNewUrlParser: true
};

let client;
let clientPromise;

let dataMenu;
let dataPelanggan;
let dataBahan;
let transaksiJualCountNow = 0;
let transaksiBeliCountNow = 0

const wa_order = {
	id: ' ',
	pelanggan: {},
	jenisOrder: 'Online',
	meja: 1,
	waktuOrder: Date.now(),
	waktuKirim: Date.now(),
	alamatKirim: '',
	map: '-,-',
	status: 'open',
	totalTagihan: 0,
	totalBayar: 0,
	totalItem: 0,
	pembayaran: [],
	item: []
};

let dta;

const port = 3000;
const app = express();
const server = createServer(app);

//dataload
process.nextTick(function () {
	loadMenu();
	loadBahan();
	loadPelanggan();
	loadTransaksiJualCount();
});

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

waClient.on('auth_failure', (msg) => {
	// Fired if session restore was unsuccessful
	console.error('AUTHENTICATION FAILURE', msg);
	ioServer.emit('waError', 'AUTHENTICATION FAILURE');
});

waClient.on('ready', () => {
	console.log('READY');
	ioServer.emit('waReady', 'wa sudah siap');
});

waClient.on('message', async (msg) => {
	//console.log('MESSAGE RECEIVED', msg);
	if (msg.type === 'order') {
		console.log('ada order masuk');
		let newOrder = await msg.getOrder();
		//const infoPelanggan = await msg.getInfo()
		const kontak = await msg.getContact();
		//console.log("info kontak: ", kontak)
		//console.log("Nama : ",msg.notifyName)
		//let tesNom = msg.from.split("@")
		let waOrder = {
			order: newOrder.products,
			nama: kontak.pushname,
			telp: kontak.id.user,
			orderId: msg.orderId,
			//pelanggan: plg
		};
		//console.log("waOrder: ", waOrder)
		const respMsg = await waOrderHandle(waOrder, msg);
		//console.log("wa respon: ",respMsg)
		//msg.reply(respMsg)
		waClient.sendMessage(msg.from,respMsg)
		//console.log(infoPelanggan)
		let orderConten = waOrder.nama + '\n';
		orderConten += waOrder.telp;
		orderConten += '\n';
		newOrder.products.forEach((order, index) => {
			orderConten += index + 1;
			orderConten += '.';
			orderConten += order.name;
			orderConten += '(';
			orderConten += order.id;
			orderConten += ')';

			orderConten += ' jml:';
			orderConten += order.quantity;
			orderConten += '\n';
		});
		//console.log(tes.pushname)
		console.log(orderConten);
		//console.log(newOrder)
	}
});

/*
waClient.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);

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
        let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
        waClient.sendMessage(msg.from, button);
    } else if (msg.body === '!list') {
        let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
        let list = new List('List body', 'btnText', sections, 'Title', 'footer');
        waClient.sendMessage(msg.from, list);
    } else if (msg.body === '!reaction') {
        msg.react('👍');
    }
});
*/
waClient.on('disconnected', (reason) => {
	console.log('Client was logged out', reason);
});


//---------------------------------------------

/*
let waOrder = {
			order: newOrder.products,
			nama:msg.notifyName,
			telp:tesNom[0],
			orderId:msg.orderId,
			//pelanggan: plg
		};


*/

function getJam(tm){    
	const today = new Date(tm);
	return today.toLocaleTimeString('en-GB'); // "15:57:36"
}

async function waOrderHandle(msg, waSrc) {
	//hapus order lama
	wa_order.item = [];
	wa_order.totalTagihan = 0;
	wa_order.totalItem = 0;
	//cek data pelanggan
	loadTransaksiJualCount();
	wa_order.id = bikinIdTransaksiWa();
	let newPelanggan = true;
	let plg = {
		id: 'P' + msg.telp,
		nama: msg.nama,
		telp: msg.telp,
		map: '0,0',
		alamat: '-'
	};
	dataPelanggan.forEach((pelanggan) => {
		if (pelanggan.nama === plg.nama && pelanggan.id === plg.id) {
			newPelanggan = false;
			wa_order.pelanggan = pelanggan
		}
	});
	if (newPelanggan) {
		console.log('waOrderHandle ', 'simpan pelanggan baru');
		simpanPelanggan(plg);
		wa_order.pelanggan = plg
	}

	let jmlItem = 0;

	wa_order.pelanggan = plg;
	wa_order.waktuOrder = Date.now()


	let itemNow = {
		time: getJam(Date.now()),
		itemDetil: []
	};
	//                '-------------------------------'
	let waResponse = '              Pesanan Anda\n';
	waResponse += 'No.pesanan________: ';
	waResponse += wa_order.id;
	waResponse += '\nNama______________: ';
	waResponse += plg.nama;
	waResponse += '\nNomer Antrian_____: ';
	waResponse += transaksiJualCountNow
	waResponse += '\nAntrian sekarang__: \n';
	waResponse += '-------------------------------------------------\n';

	let stokHabis = false;
	let stokResp = '  Persediaan menu kami Habis:\n';
	stokResp += '-------------------------------------------------\n';

	dataMenu.forEach(async (menu, index) => {
		msg.order.forEach((order, index) => {
			if (menu.waId === order.id) {
				let odr = {
					id: menu.id,
					nama: menu.nama,
					harga: menu.harga,
					jml: order.quantity
					//catatan: $dataMenuStore[i].catatan
				};
				//if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
				if (menu.stok === 0) {
					stokHabis = true;
				} else {
					itemNow.itemDetil.push(odr);
					wa_order.totalTagihan += odr.jml * odr.harga;
					wa_order.totalItem += odr.jml;

					waResponse += odr.nama;
					waResponse += ' (';
					waResponse += odr.jml;
					waResponse += ')\n';
				}
			}
		});
		if (menu.stok === 0) {
			stokResp += menu.nama + ' habis,\n';
		}
	});

	if (stokHabis) {
		stokResp += '-------------------------------------------------';
		stokResp += '\nSilahkan Ulangi pesanan anda \n ';
		stokResp += 'Pilih menu yang masih tersedia';
		//kirimResponseWa(waSrc.from, stokResp);
		return stokResp
	} else {
		wa_order.item.push(itemNow);
		simpanTransaksiJual(wa_order);
		//simpanTransaksiJualCount(transaksiJualCountNow);

		//const invoice = await generateInvoice(wa_order._id, wa_order.totalTagihan);
		//console.log('wa_order', wa_order)
		waResponse += '-------------------------------------------------';
		waResponse += '\nTotal                     : ';
		waResponse += rupiah(wa_order.totalTagihan);
		waResponse += '\nSilahkan lakukan pembayaran,klik link dibawah\n';
		waResponse += "---"//invoice.paymentLink;
		waResponse += '\n\n\n    Pesanan Anda Segera kami proses\n';
		waResponse += '                 TerimaKasih\n';
		//kirimResponseWa(waSrc.from, waResponse);
		return waResponse
	}
}

function rupiah(number) {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(number);
}

function bikinIdTransaksiWa(){
	
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
	
		if ( transaksiJualCountNow < 100) tr += '0';
		if (transaksiJualCountNow < 10) tr += '0';
		tr += transaksiJualCountNow;
		//console.log(tr);
	
		return tr;
}

function kirimResponseWa(dest, msg) {
	waClient.sendMessage(dest, msg);
}

const ioServer = new Server(server, {
	cors: {
		//origin: "http://192.168.0.110:3000",
		origin: '*',
		methods: ['GET', 'POST']
	}
});
/*
app.use(cors({0.110:3000",
	methods: ["GET", "POST"]
  }));
	origin: "http://192.168.
  */

client = new MongoClient(uri, options);
clientPromise = client.connect();

ioServer.on('connection', (socket) => {
	socket.on('fromClient', (msg) => {
		//console.log('ini dari client: ' + msg)
		if (msg === 'getMenu') {
			loadMenu();
		} else if (msg === 'getMenuPesenan') {
			loadMenuPesenan();
		} else if (msg === 'getTransaksiJual') {
			loadTransaksiJual();
		} else if (msg === 'getTransaksiJualOpen') {
			loadTransaksiJualOpen();
		} else if (msg === 'getTransaksiJualCount') {
			loadTransaksiJualCount();
		} else if (msg === 'getBahan') {
			loadBahan();
		} else if (msg === 'getTransaksiBeli') {
			loadTransaksiBeli();
		} else if (msg === 'getTransaksiBeliCount') {
			loadTransaksiBeliCount();
		} else if (msg === 'getSuplier') {
			loadSuplier();
		} else if (msg === 'getPelanggan') {
			loadPelanggan();
		} else if (msg === 'getCloseTransaksiNow') {
			loadCloseTransaksiNow();
		}
	});

	socket.on('simpanTransaksiJual', (msg) => {
		simpanTransaksiJual(msg);
	});

	socket.on('simpanTransaksiBeli', (msg) => {
		simpanTransaksiBeli(msg);
	});

	//socket.on('simpanTransaksiJualCount', (msg) => {
	//	simpanTransaksiJualCount(msg);
	//});

	socket.on('simpanTransaksiBeliCount', (msg) => {
		simpanTransaksiBeliCount(msg);
	});

	socket.on('updateTransaksiJual', (msg) => {
		updateTransaksiJual(msg);
	});

	socket.on('closeTransaksiJual', (msg) => {
		closeTransaksiJual(msg);
	});

	socket.on('simpanBahan', (msg) => {
		simpanBahan(msg);
	});

	socket.on('tambahStok', (msg) => {
		tambahStok(msg);
	});

	socket.on('hapusItemLama', (msg) => {
		hapusItemLama(msg);
	});


});

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);

function getTanggal(tm) {
	const today = new Date(tm);
	return today.toLocaleDateString('en-GB'); // "14/6/2020"
}


async function loadMenu() {
	try {
		if (typeof dataMenu !== 'undefined' && dataMenu.length > 0) {
			ioServer.emit('myMenu', dataMenu);
		} else {
			const client = await clientPromise;
			const db = client.db('abadipos');

			dta = await db.collection('dataMenu').find().toArray();
			if (dta) {
				dataMenu = dta;
				//console.log("load_dataMenu",dataMenu)
				ioServer.emit('myMenu', dta);
			}
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadBahan() {
	try {

		if (typeof dataBahan !== 'undefined' && dataBahan.length > 0) {
			ioServer.emit('myBahan', dataBahan);
		} else {
			const client = await clientPromise;
			const db = client.db('abadipos');

			dta = await db.collection('dataBahan').find().toArray();
			
			if (dta) {
				dataBahan = dta
				ioServer.emit('myBahan', dta);
			}
		}

		//
	} catch (err) {
		console.log(err);
	}
}

async function loadSuplier() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataSuplier').find().toArray();
		if (dta) {
			ioServer.emit('mySuplier', dta);
		}

		//
	} catch (err) {
		console.log(err);
	}
}

async function loadPelanggan() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataPelanggan').find().toArray();
		if (dta) {
			dataPelanggan = dta;
			ioServer.emit('myPelanggan', dta);
		}

		//
	} catch (err) {
		console.log(err);
	}
}

async function loadMenuPesenan() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataMenuPesenan').find().toArray();
		if (dta) {
			ioServer.emit('myMenuPesenan', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiJual() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiJual').find({ status: 'open' }).toArray();
		if (dta) {
			ioServer.emit('myTransaksiJual', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiJualOpen() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		const dataNew = await db.collection('transaksiJual').find({ status: 'open' }).toArray();
		if (dataNew) {
			ioServer.emit('myTransaksiJualOpen', dataNew);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiBeli() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiBeli').find({ status: 'open' }).toArray();
		if (dta) {
			ioServer.emit('myTransaksiBeli', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

function getTimeNow(){
	const d = new Date();
	const text = d.toDateString();
	const h = new Date(text)
	return h.getTime()
}


async function loadCloseTransaksiNow() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		
		const hariIni = getTanggal(Date.now())
		const timeNow = getTimeNow()
		//console.log("tanggal sekarang" + tanggal)
		const dataNow = await db
			.collection('transaksiJual')
			.find({ waktuOrder:{$gt:timeNow},status:"close" })
			.toArray();
		if (dataNow) {
			//sortir close order
			//let hariIni = getTanggal(Date.now())
			let dataHariIni = []
			dataNow.forEach((dt) => {
				let wto = getTanggal(dt.waktuOrder)
				if (hariIni === wto) {
					dataHariIni.push(dt)
				}
			})
			ioServer.emit('myCloseTransaksiNow', dataHariIni);
			console.log(dataNow)
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiJualCount() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiCount').find().toArray();
		const timeElapsed = Date.now();
		const today = new Date(timeElapsed);
		const tc = today.toLocaleDateString('en-GB'); // "14/6/2020"
		//console.log(dta[0])
		//console.log("timedb",dta[0].timeCode)
		//console.log("timeNow" ,tc)
		if (dta) {
			//console.log(dta.timeCode)			

			if (tc !== dta[0].timeCode) {
				await db
					.collection('transaksiCount')
					.updateOne({ dayCount: "base" }, { $set: { transaksiBeliCount: 0 } });
				await db
					.collection('transaksiCount')
					.updateOne({ dayCount: "base" }, { $set: { transaksiJualCount: 0 } });
				await db
					.collection('transaksiCount')
					.updateOne({ dayCount: "base" }, { $set: { timeCode: tc } });
				dta[0].transaksiJualCount = 0;
				dta[0].transaksiBeliCount = 0;
				//console.log('reset transaksi count ' + tc);
			}

			transaksiJualCountNow = dta[0].transaksiJualCount + 1
			transaksiBeliCountNow = dta[0].transaksiBeliCount + 1
			//wa_order.id = bikinIdTransaksiWa();
			ioServer.emit('myTransaksiJualCount', transaksiJualCountNow);
			ioServer.emit('myTransaksiBeliCount', transaksiBeliCountNow);
			console.log("transaksiJualCount now: ", transaksiJualCountNow)
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiBeliCount() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiCount').findOne({ dayCount: 'base' });
		//console.log(dta)
		if (dta) {
			ioServer.emit('myTransaksiBeliCount', dta.transaksiBeliCount + 1);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function simpanTransaksiJual(data) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('transaksiJual').insertOne(data);
		//update stok
		//console.log("Simpan transaksi jual ", JSON.stringify(data))
		data.item.forEach((item, idx) => {
			item.itemDetil.forEach((itemDetil) => {
				dataMenu.forEach((menu, index) => {
					if (menu.stok !== -1) {
						if (menu.id === itemDetil.id) {
							//update stok

							let st = {
								id: menu.id,
								stokId: menu.stokId,
								newStok: (menu.stok - itemDetil.jml)
							}
							console.log("updateStok: " + st.id + " newStok:" + st.newStok)
							updateStok(st)
						}
					}
				})
			})
		})
		//loadStok()
		//update menu & stok
		loadNewStok()

		//loadTransaksiJual();
		simpanTransaksiJualCount(transaksiJualCountNow)
		////
	} catch (err) {
		console.log(err);
	}
}
async function loadNewStok() {
	const client = await clientPromise;
	const db = client.db('abadipos');

	dta = await db.collection('dataMenu').find().toArray();
	if (dta) {
		dataMenu = dta;
		//console.log("load_dataMenu",dataMenu)
		ioServer.emit('myMenu', dta);
	}
}

async function simpanHutang(newData) {
	let newHutang = {
		idTransaksi: newData.id,
		suplier: newData.suplier,
		waktu: newData.waktuBeli,
		totalTagihan: newData.totalTagihan,
		status: "open",
		Pembayaran: []
	}

	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('transaksiHutang').insertOne(newHutang);
	} catch (err) {
		console.log(err);
	}


}

async function updateStokBahan(newData) {
	newData.item.forEach((item) => {
		dataMenu.forEach((menu, index) => {
			if (item.stokId === menu.stokId) {
				let st = {
					id: menu.id,
					stokId: menu.stokId,
					newStok: (menu.stok + (item.belanjaCount * item.isi))
				}
				console.log("updateStok: " + st.id + " newStok:" + st.newStok)
				updateStok(st)
			}
		})
	})
}

async function simpanTransaksiBeli(data) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('transaksiBeli').insertOne(data);
		//console.log(JSON.stringify(data));
		simpanHutang(data)
		//update stok bahan
		updateStokBahan(data)
		//loadTransaksiBeli();
		loadNewStok()

		simpanTransaksiBeliCount(transaksiBeliCountNow)

		////
	} catch (err) {
		console.log(err);
	}
}

async function updateTransaksiJual(data) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('transaksiJual').updateOne(
			{ id: data.id },
			{
				$set: {

					pelanggan: data.pelanggan,
					jenisOrder: data.jenisOrder,
					totalTagihan: data.totalTagihan,
					totalBayar: data.totalBayar,
					item: data.item
				}
			}
		);
		//update stok disini

		loadTransaksiJualOpen();
		////
	} catch (err) {
		console.log(err);
	}
}

async function simpanTransaksiJualCount(count) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db
			.collection('transaksiCount')
			.updateOne({ dayCount: 'base' }, { $set: { transaksiJualCount: count } });
		console.log('transaksi jual count: ' + count);
		loadTransaksiJualCount();
		//
	} catch (err) {
		console.log(err);
	}
}

async function simpanTransaksiBeliCount(count) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db
			.collection('transaksiCount')
			.updateOne({ dayCount: 'base' }, { $set: { transaksiBeliCount: count } });
		console.log('transaksi Beli count: ' + count);
		loadTransaksiBeliCount();
		////
	} catch (err) {
		console.log(err);
	}
}

async function simpanPelanggan(dataPlg) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('dataPelanggan').insertOne(dataPlg);
		loadPelanggan();
		////
	} catch (err) {
		console.log(err);
	}
}
async function closeTransaksiJual(data) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		const tes = await db.collection('transaksiJual').updateOne(
			{ id: data.id },
			{
				$set: {
					pelanggan: data.pelanggan,
					jenisOrder: data.jenisOrder,
					status: 'close',
					totalTagihan: data.totalTagihan,
					totalBayar: data.totalBayar,
					item: data.item
				}
			}
		);
		console.log('close transaksi');
		loadTransaksiJual();
		////
	} catch (err) {
		console.log(err);
	}
}
async function tambahStok(newStok) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		const menu = await db.collection('dataMenu').find().toArray();
		//console.log(newData)

		let jml = 0;
		let stok_id = [];
		newStok.forEach((item) => {
			menu.forEach((mn) => {
				if (mn.id === item.id) {
					db.collection('dataMenu').updateOne({ id: item.id }, { $set: { stok: item.jml } });
					//console.log('update stok: ' + item.nama)
				}

				//cek resepId
			});
		});
		loadMenu();
		//
	} catch (err) {
		console.log(err);
	}
}

async function hapusItemLama(id) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		let itm = [];
		console.log('hapus item ' + id);
		const tes = await db
			.collection('dataTransaksiJual')
			.updateOne({ _id: id }, { $set: { item: itm, totalTagihan: 0 } });
	} catch (err) {
		console.log(err);
	}
}


async function updateStok(newData) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		const tes = await db
			.collection('dataMenu')
			.updateMany({ stokId: newData.stokId }, { $set: { stok: newData.newStok } });
		//
	} catch (err) {
		console.log(err);
	}
	loadMenu()
}

async function simpanBahan(newData) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('dataBahan').insertOne(newData);
		//loadBahan();
		dta = await db.collection('dataBahan').find().toArray();
			
			if (dta) {
				dataBahan = dta
				ioServer.emit('myBahan', dta);
			}
		//
	} catch (err) {
		console.log(err);
	}
}


