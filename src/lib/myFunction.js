

export function getFormatTanggal(){
    let tm = new Date();
       
        let temp

        let tr = String(tm.getDate())
        tr += '/';       
        tr += String(tm.getMonth() + 1);
        tr += '/'
        tr += String(tm.getFullYear())
        return tr
}

export function getFormatJam(){
	let tm = new Date();
       
        let temp

        let tr = String(tm.getHours())
        tr += ':';       
        tr += String(tm.getMinutes());
        tr += ':'
        tr += String(tm.getSeconds())
        return tr
}

export function getTimeCode() {
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

export function bikinIdTransaksi(kode = 'J',count = 0) {
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
