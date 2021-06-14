const express = require("express");
const pool = require("../db/index").pool;
const routes = express.Router();
const uuid = require("uuid");



// uzmi klijente sa imenomPrezimenom ili nazivomFirme
routes.get("/ime/:imeKlijentaIliFirme", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from klijent where ime_prezime_klijenta=? || ime_firme=?",
          [req.params.imeKlijentaIliFirme, req.params.imeKlijentaIliFirme],
          (err, results) => {
            if (err) {
              return reject(err);
            } else {
              return resolve(results);
            }
          }
        );
      })
    );
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

// uzmi sve klijente 
routes.get("/", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from klijent ",
          (err, results) => {
            if (err) {
              return reject(err);
            } else {
              return resolve(results);
            }
          }
        );
      })
    );
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

// pretrazi klijenta po id-u
routes.get("/id/:idKlijenta", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from klijent where id_klijenta=?",
          [req.params.idKlijenta],
          (err, results) => {
            if (err) {
              return reject(err);
            } else {
              return resolve(results);
            }
          }
        );
      })
    );
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

// vrati klijenta za vozilo (po broju sasije)
routes.get("/brojSasije/:brojSasije", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from klijent k join vozilo v on(k.id_klijenta=v.id_klijenta) where v.broj_sasije=?",
          [req.params.brojSasije],
          (err, result) => {
            if (err) {
              return reject(err);
            } else {
        
              return resolve({
                id_klijenta: result[0].id_klijenta,
                jmbg: result[0].jmbg,
                broj_lk: result[0].broj_lk,
                datum_vazenja_lk_klijenta: result[0].datum_vazenja_lk_klijenta,
                ime_prezime_klijenta: result[0].ime_prezime_klijenta,
                adresa_klijenta: result[0].adresa_klijenta,
                ime_firme: result[0].ime_firme,
                pib: result[0].pib,
                adresa_firme: result[0].adresa_firme
              });
            }
            
          }
        );
      })
    );
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

// kreiraj klijenta
routes.post("/", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        let klijentID = uuid.v4();
        pool.query(
          "insert into klijent (id_klijenta, jmbg, broj_lk, datum_vazenja_lk_klijenta, ime_prezime_klijenta, adresa_klijenta, ime_firme, pib, adresa_firme) values (?,?,?,?,?,?,?,?,?)",
          [
            klijentID,
            req.body.jmbg,
            req.body.broj_lk,
            req.body.datum_vazenja_lk_klijenta,
            req.body.ime_prezime_klijenta,
            req.body.adresa_klijenta,
            req.body.ime_firme,
            req.body.pib,
            req.body.adresa_firme,
          ],
          (err, results) => {
            if (err) {
              return reject(err);
            } else {
              return resolve({ idKlijenta: klijentID });
            }
          }
        );
      })
    );
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = routes;
