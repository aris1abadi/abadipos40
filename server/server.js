// require('dotenv').config();
import express from 'express';

import { createServer } from 'http';
import { Server } from 'socket.io';

import { handler } from '../build/handler.js';
import { MongoClient } from 'mongodb';
//import {getTimeCode} from '$lib/myFunction'
import qrcode from 'qrcode';
import axios from 'axios';

//import {dataMenuStore,dataPelanggan,n_order} from "../src/lib/stores/store.js"
//import {getFormatJam,getFormatTanggal} from "../src/lib/myFunction"
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
const waClient = new Client({
	authStrategy: new LocalAuth(),
	puppeteer: { headless: false }
});

const uri = 'mongodb://abadinet.my.id:27017';
const options = {
	useUnifiedTopology: true,
	useNewUrlParser: true
};

let client;
let clientPromise;

let dataMenu;
let dataPelanggan;
let transaksiCountNow = 0;

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
};

let dta;

const port = 3000;
const app = express();
const server = createServer(app);

app.post('/xendit/invoice', async (req, res) => {
	const { external_id } = req.body;
	const mongo = await clientPromise;
	const db = mongo.db('abadipos');
	const transactionDb = await db.collection('dataTransaksiJual').findOne({ _id: external_id });
	if (!transactionDb) {
		res.json({ status: 'ok' });
		return;
	}
	await db.collection('dataTransaksiJual').updateOne(
		{ _id: external_id },
		{
			$set: {
				totalBayar: transactionDb.totalTagihan
			}
		}
	);
	ioServer.emit('paymentStatus', { id: external_id, status: 'success' });
	res.json({ status: 'ok' });
});

//dataload
process.nextTick(function () {
	loadMenu();
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
		const plg = await msg.getContact();

		let waOrder = {
			order: newOrder.products,
			pelanggan: plg
		};
		await waOrderHandle(waOrder, msg);

		//console.log(infoPelanggan)
		let orderConten = plg.pushname + '\n';
		orderConten += plg.number;
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
	transaksiCountNow += 1;

	if (transaksiCountNow < 100) tr += '0';
	if (transaksiCountNow < 10) tr += '0';
	tr += transaksiCountNow;
	return tr;
	//console.log(tr);

	//$idTransaksiJual = tr;
}

async function waOrderHandle(msg, waSrc) {
	//hapus order lama
	wa_order.item = [];
	wa_order.totalTagihan = 0;
	wa_order.totalItem = 0;
	//cek data pelanggan
	loadTransaksiJualCount();

	let newPelanggan = true;
	let plg = {
		_id: 'P' + msg.pelanggan.number,
		nama: msg.pelanggan.pushname,
		telp: msg.pelanggan.number,
		map: '0,0',
		alamat: '-'
	};
	dataPelanggan.forEach((pelanggan) => {
		if (pelanggan.nama === plg.nama && pelanggan._id === plg._id) {
			newPelanggan = false;
		}
	});
	if (newPelanggan) {
		console.log('waOrderHandle', 'simpan pelanggan baru');
		simpanPelanggan(plg);
	}
	let timeNow = getFormatTanggal();
	timeNow += ' ';
	timeNow += getFormatJam();
	let jmlItem = 0;

	wa_order.pelanggan = plg;
	wa_order.time = getFormatJam();
	wa_order.tgl = getFormatTanggal();

	let itemNow = {
		time: timeNow,
		itemDetil: []
	};
	//                '-------------------------------'
	let waResponse = '              Pesanan Anda\n';
	waResponse += 'No.pesanan......: ';
	waResponse += wa_order._id;
	waResponse += '\nNama...........: ';
	waResponse += plg.nama;
	waResponse += '\nNomer Antrian..: \n';
	waResponse += 'Antrian sekarang: \n';
	waResponse += '-------------------------------------------------\n';

	let stokHabis = false;
	let stokResp = '  Persediaan menu kami Habis:\n';
	stokResp += '-------------------------------------------------\n';

	dataMenu.forEach((menu, index) => {
		msg.order.forEach((order, index) => {
			if (menu.id_wa === order.id) {
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
		kirimResponseWa(waSrc.from, stokResp);
	} else {
		wa_order.item.push(itemNow);
		simpanTransaksiJual(wa_order);
		simpanTransaksiJualCount(transaksiCountNow);

		const invoice = await generateInvoice(wa_order._id, wa_order.totalTagihan);
		//console.log('wa_order', wa_order)
		waResponse += '-------------------------------------------------';
		waResponse += '\nTotal                     : ';
		waResponse += rupiah(wa_order.totalTagihan);
		waResponse += 'Silahkan melakukan pembayaran pada Link tersebut\n';
		waResponse += invoice.paymentLink;
		waResponse += '\n\n\n    Pesanan Anda Segera kami proses\n';
		waResponse += '                 TerimaKasih\n';
		kirimResponseWa(waSrc.from, waResponse);
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

	socket.on('simpanTransaksiJualCount', (msg) => {
		simpanTransaksiJualCount(msg);
	});

	socket.on('simpanTransaksiBeliCount', (msg) => {
		simpanTransaksiBeliCount(msg);
	});

	socket.on('updateTransaksiJual', (msg) => {
		updateTransaksiJual(msg);
	});

	socket.on('closeTransaksiJual', (msg) => {
		closeTransaksiJual(msg);
	});

	socket.on('updateStok', (msg) => {
		updateStok(msg);
	});

	socket.on('tambahStok', (msg) => {
		tambahStok(msg);
	});

	socket.on('hapusItemLama', (msg) => {
		hapusItemLama(msg);
	});

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
app.use(handler);

server.listen(port);

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
	return tr;
}

async function loadMenu() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataMenu').find().toArray();
		if (dta) {
			dataMenu = dta;
			//console.log("load_dataMenu",dataMenu)
			ioServer.emit('myMenu', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadBahan() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataBahan').find().toArray();
		if (dta) {
			ioServer.emit('myBahan', dta);
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

		dta = await db.collection('dataTransaksiJual').find({ status: 'open' }).toArray();
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

		const dataNew = await db.collection('dataTransaksiJual').find({ status: 'open' }).toArray();
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

		dta = await db.collection('dataTransaksiBeli').find({ status: 'open' }).toArray();
		if (dta) {
			ioServer.emit('myTransaksiBeli', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

function getFormatJam() {
	let tm = new Date();

	let temp;

	let tr = String(tm.getHours());
	tr += ':';
	tr += String(tm.getMinutes());
	tr += ':';
	tr += String(tm.getSeconds());
	return tr;
}

function getFormatTanggal() {
	let tm = new Date();

	let tr = String(tm.getDate());
	tr += '/';
	tr += String(tm.getMonth() + 1);
	tr += '/';
	tr += String(tm.getFullYear());
	return tr;
}

async function loadCloseTransaksiNow() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		let tanggal = getFormatTanggal();
		//console.log("tanggal sekarang" + tanggal)
		const dataNow = await db
			.collection('dataTransaksiJual')
			.find({ $and: [{ tgl: tanggal }, { status: 'close' }] })
			.toArray();
		if (dataNow) {
			ioServer.emit('myCloseTransaksiNow', dataNow);
			//console.log(dataNow)
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

		dta = await db.collection('dataTransaksiCount').findOne({ name: 'transaksiCount' });
		if (dta) {
			//console.log(dta.timeCode)
			let tc = getTimeCode();
			if (tc !== dta.timeCode) {
				await db
					.collection('dataTransaksiCount')
					.updateOne({ name: 'transaksiCount' }, { $set: { transaksiBeliCount: 0 } });
				await db
					.collection('dataTransaksiCount')
					.updateOne({ name: 'transaksiCount' }, { $set: { transaksiJualCount: 0 } });
				await db
					.collection('dataTransaksiCount')
					.updateOne({ name: 'transaksiCount' }, { $set: { timeCode: tc } });
				dta.transaksiJualCount = 0;
				console.log('reset transaksi count');
			}
			transaksiCountNow = dta.transaksiJualCount;
			wa_order._id = bikinIdTransaksiWa();
			ioServer.emit('myTransaksiJualCount', dta.transaksiJualCount);
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

		dta = await db.collection('dataTransaksiCount').findOne({ name: 'transaksiCount' });
		if (dta) {
			ioServer.emit('myTransaksiBeliCount', dta.transaksiBeliCount);
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
		const tes = await db.collection('dataTransaksiJual').insertOne(data);

		loadTransaksiJual();

		////
	} catch (err) {
		console.log(err);
	}
}

async function simpanTransaksiBeli(data) {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		const tes = await db.collection('dataTransaksiBeli').insertOne(data);
		console.log(JSON.stringify(data));
		loadTransaksiBeli();

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
		const tes = await db.collection('dataTransaksiJual').updateOne(
			{ _id: data._id },
			{
				$set: {
					id_pelanggan: data.id_pelanggan,
					nama_pelanggan: data.nama_pelanggan,
					jenis_order: data.jenis_order,
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
			.collection('dataTransaksiCount')
			.updateOne({ name: 'transaksiCount' }, { $set: { transaksiJualCount: count } });
		console.log('transaksi jual count: ' + count);
		loadTransaksiJualCount();
		////
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
			.collection('dataTransaksiCount')
			.updateOne({ name: 'transaksiCount' }, { $set: { transaksiBeliCount: count } });
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
		const client = await clientPromise;
		const db = client.db('abadipos');
		const tes = await db.collection('dataTransaksiJual').updateOne(
			{ _id: data._id },
			{
				$set: {
					id_pelanggan: data.id_pelanggan,
					nama_pelanggan: data.nama_pelanggan,
					jenis_order: data.jenis_order,
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
	//client.close()
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
			.updateOne({ id: newData.id }, { $set: { stok: newData.newStok } });

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
		loadStok();
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadStok() {
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');
		const st = await db.collection('dataMenu').find().toArray();

		let stokNow = [];

		st.forEach((mn, index) => {
			stokNow.push(mn.stok);
		});
		ioServer.emit('myStok', stokNow);
		//console.log(stokNow)
	} catch (err) {
		console.log(err);
	}
}

function getXenditToken() {
	const token =
		'eG5kX2RldmVsb3BtZW50X1VKTmFhellOVXNaR2FQR3FiTzIwdTYySzdITWxQWXo5eDZadkJSN05EUnBqV3dYaHpoZGp2YUdKSkVDMU9YYjo=';
	if (!token) throw 'Xendit Token Invalid';
	return token;
}

async function generateInvoice(transactionId, price) {
	try {
		const xenditToken = getXenditToken();
		const response = await axios.post(
			'https://api.xendit.co/v2/invoices',
			{
				external_id: transactionId,
				amount: price,
				currency: 'IDR',
				payment_methods: [
					'BCA',
					'BNI',
					'BSI',
					'BRI',
					'MANDIRI',
					'PERMATA',
					'ALFAMART',
					'INDOMARET',
					'OVO',
					'DANA',
					'SHOPEEPAY',
					'LINKAJA',
					'QRIS'
				]
			},
			{ headers: { Authorization: `Basic ${xenditToken}` } }
		);
		console.log(response.data);
		return {
			invoiceId: response.data.id,
			paymentLink: response.data.invoice_url,
			expiryDate: response.data.expiry_date,
			status: response.data.status
		};
	} catch (err) {
		console.log(err);
	}
}
