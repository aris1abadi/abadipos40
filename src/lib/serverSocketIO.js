import { Server } from 'socket.io'
import clientPromise from './db'
import  { getFormatJam,getFormatTanggal,getTimeCode}from './myFunction';


let ioServer;
let dta
export const sveltekitSocketIo = async () => {
    return {
        name: 'sveltekit-socket-io',
        /**
         * @param {{ httpServer: Partial<import("socket.io").ServerOptions> | undefined; }} server
         */
        configureServer(server) {
            ioServer = new Server(server.httpServer);

            ioServer.on('connection', (socket) => {
                // generate a random username and send it to the client to display it
                //tes db
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
        }
    }
}

async function loadMenu() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')

        dta = await db.collection('dataMenu').find().toArray()
        if (dta) {
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



async function loadCloseTransaksiNow() {
    try {
        const client = await clientPromise
        const db = client.db('abadipos')       


       let tanggal = getFormatTanggal()
        console.log("tanggal sekarang" + tanggal)
        const dataNow = await db.collection('dataTransaksiJual').find({ $and: [{ tgl: tanggal}, { status: 'close' }] }).toArray()
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
        const tes = await db.collection('dataTransaksiJual').updateOne({ _id: data._id }, { $set: { pelanggan: data.pelanggan, jenis_order: data.jenis_order, totalTagihan: data.totalTagihan, totalDp: data.totalDp,totalItem:data.totalItem, item: data.item } })
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
        const tes = await db.collection('dataTransaksiJual').updateOne({ _id: data._id }, { $set: { pelanggan: data.pelanggan, jenis_order: data.jenis_order, status: 'close', totalTagihan: data.totalTagihan, totalDp: data.totalDp,totalItem:data.totalItem, item: data.item } })
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