const express = require("express");
const pool = require("../db/index").pool;
const routes = express.Router();
const uuid = require("uuid");

// kreiraj zaposlenog
routes.post("/", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        let zaposleniID = uuid.v4();
        pool.query(
          "insert into zaposleni (id_zaposlenog, ime, prezime, korisnicko_ime, sifra) values (?,?,?,?,?)",
          [
            zaposleniID,
            req.body.ime,
            req.body.prezime,
            req.body.korisnickoIme,
            req.body.sifra,
          ],
          (err, results) => {
            if (err) {
              return reject(err);
            } else {
              return resolve({ zaposleniID });
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

// prijavi zaposlenog
routes.get("/:kIme/:sifra", async (req, res) => {

  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from zaposleni where korisnicko_ime=? && sifra=?",
          [req.params.kIme, req.params.sifra],
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
module.exports = routes;
