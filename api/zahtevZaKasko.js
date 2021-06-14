const express = require('express');
const pool = require('../db/index').pool;
const routes = express.Router();

// ucitaj sve zahteve za kasko
routes.get('/', async (req, res) => {
    try {
        res.json(await new Promise((resolve, reject) => {
            pool.query("select * from zahtev_za_kasko_osiguranjem zk join zahtev z on(zk.id_zahteva=z.id_zahteva) join klijent k on(z.id_klijenta=k.id_klijenta)", (err, results) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(results);
                }
            })
        }));
    } catch (e){
        console.log(e);
        res.sendStatus(500);
    }
});  

module.exports = routes;