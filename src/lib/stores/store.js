; import { io } from '$lib/realtime';
import { writable } from 'svelte/store'

export const dataBahanStore = writable()
export const dataMenuStore = writable([])
export const dataSuplier = writable([
	{
		id: "S01",
		nama: "Umum",
		telp: "08122221111",
		alamat: "ditoko"

	}
])

export const dataPelanggan = writable([
	{
		id: "P01",
		nama: "Umum",
		telp: "0820000000",
		alamat: "Jl.rumah",
		map: " "
	}
])
export const headerContent = writable({
	show: true,
	mode: "Dashboard",
	pelanggan: "Umum",
	idTransaksi: "-",
	suplier: "S00",
	totalItem: 0,
	totalTagihan: 0,
	jenisOrder: "Bungkus",
	jmlAntrian: 0,
	suplierSrc: [],
	bahanSrc: []
})
export const hapusOrderVal = writable(false)
export const prosesClickVal = writable(false)
export const simpanOrderVal = writable(false)

export const totalTagihan = writable(0);
export const totalBayar = writable(0);

export const totalItem = writable(0);
export const totalItemBelanja = writable(0)
export const totalTagihanBelanja = writable(0)
export const transaksiJualCount = writable(0);
export const transaksiBeliCount = writable(0);
export const showPembayaran = writable(false);
export const n_order = writable({
	id: ' ',
	pelanggan: {},
	jenisOrder: 'Bungkus',
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
})
export let n_beli = writable({
	id: '00',
	suplier: {},
	userId: {},
	waktuBeli: Date.now(),
	waktuTerima: Date.now(),
	status: 'Pesan',
	totalTagihan: 0,
	totalItem: 0,
	totalBayar: 0,
	item: []
})

export const newOrder = writable(true)
export const orderIdxNow = writable(0)


export const dataTransaksiJual = writable()
export const idTransaksiJual = writable()
export const transaksiBeli = writable()
export const idTransaksiBeli = writable()

/*	
	[
	{
		_id: "230112001",
		id_pelanggan: 1,
		nama_pelanggan: "jumino",
		jenis_order: "bungkus",
		waktu: "2023-01-12 16:30:45",
		status: "open",
		totalTagihan: 49000,
		totalBayar: 9000,
		item: [
			{
				id: 1,
				nama: "Lele Bakar",
				harga: 11000,
				jml: 2,
			},
			{
				id: 3,
				nama: "Ayam Bakar",
				harga: 15000,
				jml: 1,
			},
			{
				id: 9,
				nama: "Nasi Putih",
				harga: 4000,
				jml: 3,
			},
		],
	},
	{
		_id: "230112002",
		id_pelanggan: 17,
		nama_pelanggan: "Sulis",
		jenis_order: "bungkus",
		waktu: "2023-01-12 16:35:45",
		status: "open",
		totalTagihan: 30000,
		totalBayar: 0,
		item: [
			{
				id: 1,
				nama: "Lele Bakar",
				harga: 11000,
				jml: 2,
			},
			{
				id: 9,
				nama: "Nasi Putih",
				harga: 4000,
				jml: 2,
			},
		],
	},
	{
		_id: "230112005",
		id_pelanggan: 4,
		nama_pelanggan: "eni",
		jenis_order: "bungkus",
		waktu: "2023-01-12 16:40:45",
		status: "open",
		totalTagihan: 22000,
		totalBayar: 0,
		item: [
			{
				id: 1,
				nama: "Lele Bakar",
				harga: 11000,
				jml: 2,
			},
		],
	},
]);
*/
