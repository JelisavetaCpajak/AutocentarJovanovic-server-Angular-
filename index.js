const express = require('express');
const cors = require('cors');

const klijenti = require('./api/klijent');
const zaposleni = require('./api/zaposleni.js');
const vozilo = require('./api/vozilo.js');
const predmet = require('./api/predmet.js');
const racun = require('./api/racun.js');
const polisa = require('./api/polisa.js');
const saobracajna = require('./api/saobracajna.js');
const regList = require('./api/regList.js');
const regNalepnica = require('./api/regNalepnica.js');
const ovlascenje = require('./api/ovlascenje.js');
const kaskoPolisa = require('./api/kaskoPolisa.js');
const zahtevZaKasko = require('./api/zahtevZaKasko.js');
const zapisnikOTehnickomPregledu = require('./api/zapisnik.OTehnickomPregledu.js');

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/api/klijent', klijenti);
app.use('/api/zaposleni', zaposleni);
app.use('/api/vozilo', vozilo);
app.use('/api/predmet', predmet);
app.use('/api/racun', racun);
app.use('/api/polisa', polisa);
app.use('/api/saobracajna', saobracajna);
app.use('/api/regList', regList);
app.use('/api/regNalepnica', regNalepnica);
app.use('/api/ovlascenje', ovlascenje);
app.use('/api/kaskoPolisa', kaskoPolisa);
app.use('/api/zahtevZaKasko', zahtevZaKasko);
app.use('/api/zapisnik.OTehnickomPregledu', zapisnikOTehnickomPregledu);


const PORT = process.env.PORT | 6499;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
