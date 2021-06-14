const express = require("express");
const pool = require("../db/index").pool;
const routes = express.Router();
const uuid = require("uuid");
const mysql = require("../db/index.js");

// uzmi racune sa JMBG-om klijenta ili PIB firme BEZ STAVKI
routes.get("/:jmbgIliPib", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select r.sifra_racuna,r.datum,r.ukupno_sa_pdv,r.ukupno_bez_pdv,k.id_klijenta,k.ime_prezime_klijenta,k.ime_firme,zotp.id_broj,sd.reg_oznaka,v.broj_sasije from racun r join zapisnik_o_tehnickom_pregledu zotp on(r.id_zapisnika=zotp.id_broj) join saobracajna_dozvola sd on(zotp.reg_oznaka=sd.reg_oznaka) join vozilo v on(sd.broj_sasije=v.broj_sasije) join klijent k on(v.id_klijenta=k.id_klijenta) where k.jmbg=? or k.pib=?",
          [req.params.jmbgIliPib,req.params.jmbgIliPib],
          (err, results) => {
            console.log(err);
            console.log(results);
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

// uzmi stavke za racun
routes.get("/stavke/:sifra_racuna", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from stavka_racuna s join racun r on (s.sifra_racuna=r.sifra_racuna) where r.sifra_racuna=?",
          [req.params.sifra_racuna],
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

// obrisi racun
routes.delete("/obrisi", async (req, res) => {
  try {
    const connection = await mysql.connection();
    try {
      console.log("at obrisiRacun...");
      await connection.query("START TRANSACTION");

      for (let index = 0; index < req.body.racun.nizStavki.length; index++) {
        await connection.query(
          "delete from stavka_racuna where sifra_racuna=? && redni_broj=?",
          [
            req.body.racun.sifra_racuna,
            req.body.racun.nizStavki[index].redni_broj,
          ]
        );
      }

      //izbrisane sve stavke za dati racun

      

      await connection.query("delete from racun where sifra_racuna=?", [
        req.body.racun.sifra_racuna,
      ]);

      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at obrisiRacun", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

// kreiraj racun
routes.post("/", async (req, res) => {
  try {
    for (let index = 0; index < req.body.racun.nizStavki.length; index++) {
      req.body.racun.nizStavki[index].redni_broj = index + 1;
    }

    const connection = await mysql.connection();
    try {
      console.log("at sacuvajRacun...");
      await connection.query("START TRANSACTION");
      let sifraRacuna = uuid.v4();

      //let datumString = req.body.racun.datum.toString().split("T")[0];

      await connection.query(
        "insert into racun (sifra_racuna, datum, ukupno_sa_pdv, ukupno_bez_pdv, id_klijenta, id_zapisnika) values (?,?,?,?,?,?)",
        [
          sifraRacuna,
          req.body.racun.datum,
          req.body.racun.ukupno_sa_pdv,
          req.body.racun.ukupno_bez_pdv,
          req.body.racun.klijent.id_klijenta,
          req.body.racun.zapisnik.id_broj
          
        ]
      );

      for (let index = 0; index < req.body.racun.nizStavki.length; index++) {
        await connection.query(
          "insert into stavka_racuna(sifra_racuna, redni_broj, naziv, kolicina, cena_sa_pdv, cena_bez_pdv) values (?,?,?,?,?,?)",
          [
            sifraRacuna,
            req.body.racun.nizStavki[index].redni_broj,
            req.body.racun.nizStavki[index].naziv,
            req.body.racun.nizStavki[index].kolicina,
            req.body.racun.nizStavki[index].cena_sa_pdv,
            req.body.racun.nizStavki[index].cena_bez_pdv
          ]
        );
      }
      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at sacuvajRacun", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

// izmeni racun
routes.put("/izmena", async (req, res) => {
  try {
    const connection = await mysql.connection();
    try {
      console.log("at izmeniRacun...");
      await connection.query("START TRANSACTION");

      for (let index = 0; index < req.body.racun.nizStavki.length; index++) {
        if (req.body.racun.nizStavki[index].kreiranje) {
          let maxRB = await connection.query(
            "select max(redni_broj) from stavka_racuna where sifra_racuna=?",
            [req.body.racun.sifra_racuna]
          );
          let noviRB = maxRB[0]["max(redni_broj)"];
          await connection.query(
            "insert into stavka_racuna(sifra_racuna, redni_broj, naziv, kolicina, cena_sa_pdv, cena_bez_pdv) values (?,?,?,?,?,?)",
            [
              req.body.racun.sifra_racuna,
              noviRB + 1,
              req.body.racun.nizStavki[index].naziv,
              req.body.racun.nizStavki[index].kolicina,
              req.body.racun.nizStavki[index].cena_sa_pdv,
              req.body.racun.nizStavki[index].cena_bez_pdv
            ]
          );
        } else if (req.body.racun.nizStavki[index].izmena) {
          await connection.query(
            "update stavka_racuna set naziv=?, kolicina=?, cena_sa_pdv=?, cena_bez_pdv=? where sifra_racuna=? && redni_broj=?",
            [
              req.body.racun.nizStavki[index].naziv,
              req.body.racun.nizStavki[index].kolicina,
              req.body.racun.nizStavki[index].cena_sa_pdv,
              req.body.racun.nizStavki[index].cena_bez_pdv,
              req.body.racun.sifra_racuna,
              req.body.racun.nizStavki[index].redni_broj

            ]
          );
          

        } else if (req.body.racun.nizStavki[index].brisanje) {
          await connection.query(
            "delete from stavka_racuna where sifra_racuna=? && redni_broj=?",
            [
              req.body.racun.sifra_racuna,
              req.body.racun.nizStavki[index].redni_broj
            ]
          );

          
        }
      }
      //ovo sam dodala jer ne azurira ukupne vrednosti u racunu kad se izmeni racun
      await connection.query(
        "update racun set ukupno_sa_pdv=?, ukupno_bez_pdv=? where sifra_racuna=? ",
        [
          req.body.racun.ukupno_sa_pdv,
          req.body.racun.ukupno_bez_pdv,
          req.body.racun.sifra_racuna

        ]
      );
      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at izmeniRacun", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

module.exports = routes;