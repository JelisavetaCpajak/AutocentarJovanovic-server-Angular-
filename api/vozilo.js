const express = require('express');
const pool = require('../db/index').pool;
const routes = express.Router();
const uuid = require('uuid');

// kreiraj vozilo
routes.post('/', async(req, res) => {
    try {
        res.json(await new Promise((resolve, reject) => {
            pool.query("insert into vozilo (broj_sasije, masa, snaga_motora, zapremina_motora, broj_motora, kategorija, marka, model, pogonsko_gorivo, boja, max_masa, broj_osovina, godina_proizvodnje, br_mesta_za_sedenje, datum_prve_registracije, id_klijenta) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [req.body.brojSasije, req.body.masa, req.body.snagaMotora, req.body.zapreminaMotora, req.body.brojMotora, req.body.kategorija, req.body.marka, req.body.model, req.body.pogonskoGorivo, req.body.boja,req.body.maxMasa, req.body.brojOsovina, req.body.godinaProizvodnje, req.body.brojMestaZaSedenje, req.body.datumPrveRegistracije, req.body.klijent], (err, results) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(results);
                }
            });
        }));
    } catch (e){
        console.log(e);
        res.sendStatus(500);
    }
});

// pretrazi vozilo
routes.get('/:imePrezimeIliNaziv', async (req, res) => {
    
    try {
        res.json(await new Promise((resolve, reject) => {
            pool.query('select * from vozilo v join klijent k on(v.id_klijenta = k.id_klijenta) where k.ime_prezime_klijenta=? or k.ime_firme=?', [req.params.imePrezimeIliNaziv, req.params.imePrezimeIliNaziv], (err, results) => {
            
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


