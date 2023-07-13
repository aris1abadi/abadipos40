import pkg from 'whatsapp-web.js';
const { Client,  Location, List, Buttons,LocalAuth } = pkg;
//const { Client, Location, List, Buttons, LocalAuth } = require('./index');
import ioClient from 'socket.io-client';

import qrcode from "qrcode-terminal"

//const endpoint = 'http://192.168.100.119:3000/';
const endpoint = 'http://localhost:3000/';
//const endpoint = 'https://api.abadinet.my.id/';

const socket = ioClient(endpoint);

const io = socket;

let transaksiJualCountNow = 0

let wa_order = {
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




const waClient = new Client({
    authStrategy: new LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: { 
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        headless: true
    }
});

let dataMenu = []
let dataPelanggan = []


process.nextTick(function () {

kirimKeServer("getMenu")
kirimKeServer('getPelanggan');
kirimKeServer("getTransaksiJualCount")
})

io.on('myMenu', (msg) => {
    dataMenu = msg
    //console.log(dataMenu)
})

io.on('myPelanggan', (msg) => {
    dataPelanggan = msg
})

io.on('myTransaksiJualCount', (msg) => {
    
    wa_order.id = bikinIdTransaksi('W', msg);
    transaksiJualCountNow = msg
   
    //console.log('id transaksi jual: ' + $n_order.id);
});

waClient.initialize();

waClient.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

waClient.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
    io.emit("waQR",qr)
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

waClient.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

waClient.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

waClient.on('ready', () => {
    console.log('READY');
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
		waClient.sendMessage(msg.from,respMsg.resp)
		if(respMsg.statusSimpan){			
			io.emit('simpanTransaksiJual', respMsg.data)
		}
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


waClient.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

function kirimKeServer(msg = '') {
    io.emit('fromClient', msg);
}


async function waOrderHandle(msg, waSrc) {
	//hapus order lama
	wa_order.item = [];
	wa_order.totalTagihan = 0;
	wa_order.totalItem = 0;
	//cek data pelanggan
	//await loadTransaksiJualCount();
    kirimKeServer("getTransaksiJualCount")
	
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
		//await simpanPelanggan(plg);
        io.emit('simpanPelanggan', plg);
		wa_order.pelanggan = plg
	}

	let jmlItem = 0;

	wa_order.pelanggan = plg;
	wa_order.waktuOrder = Date.now()
	let outData={
		resp:"",
		statusSimpan:false,
		data:{}
	}

	let itemNow = {
		time: Date.now(),
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
		outData.resp = stokResp;
		
	} else {
		wa_order.item.push(itemNow);
		//simpanTransaksiJual(wa_order);
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
		outData.data = wa_order
		outData.resp = waResponse
		outData.statusSimpan = true
		//return waResponse
	}

	return outData
}

function bikinIdTransaksi(kode = 'J',count = 0) {
    let tr = kode;
    let temp = 0;
    let tm = new Date();

    tr += String(tm.getFullYear());
    temp = tm.getMonth() + 1;
    if (temp < 10) tr += '0';
    tr += temp;

    temp = tm.getDate();
    if (temp < 10) tr += '0';
    tr += temp;

    if (count < 100) tr += '0';
    if (count < 10) tr += '0';
    tr += count;
    //console.log(tr);

    return tr;
}

function rupiah(number = 0) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

