const express = require("express");
const pool = require("../db/index").pool;
const routes = express.Router();
const uuid = require("uuid");
const mysql = require("../db/index.js");

// uzmi kasko polise sa JMBG-om klijenta ili PIB firme BEZ STAVKI
routes.get("/:jmbgIliPib", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select kp.sifra_kasko, kp.ugovarac, kp.premija, kp.porez, kp.ukupna_premija, kp.datum_od, kp.datum_do, kp.id_zahteva, kp.broj_sasije, k.broj_lk, k.ime_prezime_klijenta, k.ime_firme, k.pib from kasko_polisa kp join zahtev_za_kasko_osiguranjem zk on(kp.id_zahteva=zk.id_zahteva) join zahtev z on(zk.id_zahteva=z.id_zahteva) join klijent k on(k.id_klijenta=z.id_klijenta) where k.jmbg=? or k.pib=?",
          [req.params.jmbgIliPib, req.params.jmbgIliPib],
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

// uzmi stavke za kasko polisu
routes.get("/stavke/:sifra_kasko", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from kasko_stavka where sifra_kasko=?",
          [req.params.sifra_kasko],
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

// kreiraj kasko polisu
routes.post("/", async (req, res) => {
  try {
    for (let index = 0; index < req.body.kasko.nizStavki.length; index++) {
      req.body.kasko.nizStavki[index].rb_stavke = index + 1;
    }

    const connection = await mysql.connection();
    try {
      console.log("at sacuvajKaskoPolisu...");
      await connection.query("START TRANSACTION");
      let sifraKasko = uuid.v4();

      let datumString = req.body.kasko.datum_do.toString().split("T")[0];

      await connection.query(
        "insert into kasko_polisa (sifra_kasko, ugovarac, premija, porez, ukupna_premija, datum_od, datum_do, broj_sasije, id_zahteva) values (?,?,?,?,?,?,?,?,?)",
        [
          sifraKasko,
          req.body.kasko.ugovarac,
          req.body.kasko.premija,
          req.body.kasko.porez,
          req.body.kasko.ukupna_premija,
          req.body.kasko.datum_od,
          datumString,
          req.body.kasko.vozilo.broj_sasije,
          req.body.kasko.zahtevZaKaskoOsiguranjem.id_zahteva,
        ]
      );

      for (let index = 0; index < req.body.kasko.nizStavki.length; index++) {
        await connection.query(
          "insert into kasko_stavka(sifra_kasko, rb_stavke, ugovoreno_pokrice, suma_osiguranja, ucesce_osiguranika) values (?,?,?,?,?)",
          [
            sifraKasko,
            req.body.kasko.nizStavki[index].rb_stavke,
            req.body.kasko.nizStavki[index].ugovoreno_pokrice,
            req.body.kasko.nizStavki[index].suma_osiguranja,
            req.body.kasko.nizStavki[index].ucesce_osiguranika,
          ]
        );
      }
      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at sacuvajKaskoPolisu", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

// obrisi kasko polisu
routes.delete("/obrisi", async (req, res) => {
  try {
    const connection = await mysql.connection();
    try {
      console.log("at obrisiKaskoPolisu...");
      await connection.query("START TRANSACTION");

      for (let index = 0; index < req.body.kasko.nizStavki.length; index++) {
        await connection.query(
          "delete from kasko_stavka where sifra_kasko=? && rb_stavke=?",
          [
            req.body.kasko.sifra_kasko,
            req.body.kasko.nizStavki[index].rb_stavke,
          ]
        );
      }

      await connection.query("delete from kasko_polisa where sifra_kasko=?", [
        req.body.kasko.sifra_kasko,
      ]);

      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at obrisiKaskoPolisu", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

// izmeni kasko polisu
routes.put("/izmena", async (req, res) => {
  try {
    const connection = await mysql.connection();
    try {
      console.log("at izmeniKaskoPolisu...");
      await connection.query("START TRANSACTION");

      for (let index = 0; index < req.body.kasko.nizStavki.length; index++) {
        if (req.body.kasko.nizStavki[index].kreiranje) {
          let maxRB = await connection.query(
            "select max(rb_stavke) from kasko_stavka where sifra_kasko=?",
            [req.body.kasko.sifra_kasko]
          );
          let noviRB = maxRB[0]["max(rb_stavke)"];
          await connection.query(
            "insert into kasko_stavka(sifra_kasko, rb_stavke, ugovoreno_pokrice, suma_osiguranja, ucesce_osiguranika) values (?,?,?,?,?)",
            [
              req.body.kasko.sifra_kasko,
              noviRB + 1,
              req.body.kasko.nizStavki[index].ugovoreno_pokrice,
              req.body.kasko.nizStavki[index].suma_osiguranja,
              req.body.kasko.nizStavki[index].ucesce_osiguranika,
            ]
          );
        } else if (req.body.kasko.nizStavki[index].izmena) {
          await connection.query(
            "update kasko_stavka set ugovoreno_pokrice=?, suma_osiguranja=?, ucesce_osiguranika=? where sifra_kasko=? && rb_stavke=?",
            [
              req.body.kasko.nizStavki[index].ugovoreno_pokrice,
              req.body.kasko.nizStavki[index].suma_osiguranja,
              req.body.kasko.nizStavki[index].ucesce_osiguranika,
              req.body.kasko.sifra_kasko,
              req.body.kasko.nizStavki[index].rb_stavke,
            ]
          );
        } else if (req.body.kasko.nizStavki[index].brisanje) {
          await connection.query(
            "delete from kasko_stavka where sifra_kasko=? && rb_stavke=?",
            [
              req.body.kasko.sifra_kasko,
              req.body.kasko.nizStavki[index].rb_stavke,
            ]
          );
        }
      }
      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at izmeniKaskoPolisu", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

module.exports = routes;
