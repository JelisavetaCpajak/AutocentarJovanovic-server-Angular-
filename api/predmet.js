const express = require("express");
const pool = require("../db/index").pool;
const routes = express.Router();
const uuid = require("uuid");
const mysql = require("../db/index.js");


// uzmi predmete sa JMBG-om klijenta ili PIB firme BEZ NALOGA
routes.get("/:jmbgIliPib", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select p.id_predmeta, pol.sifra_polise, sd.reg_oznaka, rl.broj_sasije, o.ime_prezime_ovlascenog, rn.kontrolni_broj, o.id_ovlascenja from predmet p join polisa_osiguranja pol on (p.sifra_polise=pol.sifra_polise) join  saobracajna_dozvola sd on (p.reg_oznaka = sd.reg_oznaka) join registracioni_list rl on(p.id_reg_lista=rl.id_reg_lista) left join predmet_ovlascenje po on(p.id_predmeta=po.id_predmeta) left join ovlascenje o on (po.id_ovlascenja=o.id_ovlascenja) join predmet_registraciona_nalepnica prn on(p.id_predmeta=prn.id_predmeta) join registraciona_nalepnica rn on(prn.kontrolni_broj=rn.kontrolni_broj) join vozilo v on(rl.broj_sasije=v.broj_sasije) join klijent k on(k.id_klijenta=v.id_klijenta) where k.jmbg=? or k.pib=?"
          ,
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

// uzmi naloge za predmet
routes.get("/nalozi/:predmetId", async (req, res) => {
  try {
    res.json(
      await new Promise((resolve, reject) => {
        pool.query(
          "select * from nalog_za_uplatu_takse n join klijent k on(n.id_klijenta=k.id_klijenta) where id_predmeta=?",
          [req.params.predmetId, req.params.jmbgIliPib],
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

// kreiraj predmet
routes.post("/", async (req, res) => {
  try {
    for (let index = 0; index < req.body.predmet.nalozi.length; index++) {
      req.body.predmet.nalozi[index].sifra_naloga = (index + 1).toString();
    }

    const connection = await mysql.connection();
    try {
      console.log("at sacuvajPredmet...");
      await connection.query("START TRANSACTION");
      let predmetID = uuid.v4();
      await connection.query(
        "insert into predmet (id_predmeta, sifra_polise, reg_oznaka, id_reg_lista) values (?,?,?,?)",
        [
          predmetID,
          req.body.predmet.polisa.sifra_polise,
          req.body.predmet.saobracajna.reg_oznaka,
          req.body.predmet.registracioni_list.id_reg_lista,
        ]
      );

      if (
        req.body.ovlascenje &&
        req.body.ovlascenje.id_ovlascenja &&
        req.body.ovlascenje.id_ovlascenja !== ""
      ) {
        await connection.query(
          "insert into predmet_ovlascenje (id_predmeta, id_ovlascenja) values (?,?)",
          [predmetID, req.body.ovlascenje.id_ovlascenja]
        );
      }

      await connection.query(
        "insert into predmet_registraciona_nalepnica (kontrolni_broj, id_predmeta) values (?,?)",
        [req.body.regNal.kontrolni_broj, predmetID]
      );

      for (let index = 0; index < req.body.predmet.nalozi.length; index++) {
        await connection.query(
          "insert into nalog_za_uplatu_takse (id_predmeta, sifra_naloga, primalac, iznos, svrha_uplate, datum, racun_primaoca, id_klijenta) values (?,?,?,?,?,?,?,?)",
          [
            predmetID,
            req.body.predmet.GRESKA.nalozi[index].sifra_naloga,
            req.body.predmet.nalozi[index].primalac,
            req.body.predmet.nalozi[index].iznos,
            req.body.predmet.nalozi[index].svrha_uplate,
            req.body.predmet.nalozi[index].datum,
            req.body.predmet.nalozi[index].racun_primaoca,
            req.body.predmet.nalozi[index].klijent.id_klijenta,
          ]
        );
      }

      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at sacuvajPredmet", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

// obrisi predmet
routes.delete("/obrisi", async (req, res) => {
  try {
    const connection = await mysql.connection();
    try {
      console.log("at obrisiPredmet...");
      await connection.query("START TRANSACTION");

      for (let index = 0; index < req.body.predmet.nalozi.length; index++) {
        await connection.query(
          "delete from nalog_za_uplatu_takse where id_predmeta=? && sifra_naloga=?",
          [
            req.body.predmet.id_predmeta,
            req.body.predmet.nalozi[index].sifra_naloga,
          ]
        );
      }

      if (
        req.body.ovlascenje &&
        req.body.ovlascenje.id_ovlascenja &&
        req.body.ovlascenje.id_ovlascenja !== ""
      ) {
        await connection.query(
          "delete from predmet_ovlascenje where id_predmeta=? && id_ovlascenja=?",
          [req.body.predmet.id_predmeta, req.body.ovlascenje.id_ovlascenja]
        );
      }

      await connection.query(
        "delete from predmet_registraciona_nalepnica where id_predmeta=? && kontrolni_broj=?",
        [req.body.predmet.id_predmeta, req.body.regNal.kontrolni_broj]
      );

      await connection.query("delete from predmet where id_predmeta=?", [
        req.body.predmet.id_predmeta,
      ]);

      res.json(await connection.query("COMMIT"));
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at obrisiPredmet", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

// izmeni predmet
routes.put("/izmena", async (req, res) => {
  try {
    const connection = await mysql.connection();
    try {
      console.log("at izmeniPredmet...");
      await connection.query("START TRANSACTION");

      for (let index = 0; index < req.body.predmet.nalozi.length; index++) {
        let datumString = req.body.predmet.nalozi[index].datum
          .toString()
          .split("T")[0];

        if (req.body.predmet.nalozi[index].kreiranje) {
          let maxRB = await connection.query(
            "select max(sifra_naloga) from nalog_za_uplatu_takse where id_predmeta=?",
            [req.body.predmet.id_predmeta]
          );
          let noviRB = maxRB[0]["max(sifra_naloga)"];
          await connection.query(
            "insert into nalog_za_uplatu_takse (id_predmeta, sifra_naloga, primalac, iznos, svrha_uplate, datum, racun_primaoca, id_klijenta) values (?,?,?,?,?,?,?,?)",
            [
              req.body.predmet.id_predmeta,
              (+noviRB + 1).toString(),
              req.body.predmet.nalozi[index].primalac,
              req.body.predmet.nalozi[index].iznos,
              req.body.predmet.nalozi[index].svrha_uplate,
              datumString,
              req.body.predmet.nalozi[index].racun_primaoca,
              req.body.predmet.nalozi[index].klijent.id_klijenta,
            ]
          );
        } else if (req.body.predmet.nalozi[index].izmena) {
          await connection.query(
            "update nalog_za_uplatu_takse set primalac=?, iznos=?, svrha_uplate=?, datum=?, racun_primaoca=? where id_predmeta=? && sifra_naloga=?",
            [
              req.body.predmet.nalozi[index].primalac,
              req.body.predmet.nalozi[index].iznos,
              req.body.predmet.nalozi[index].svrha_uplate,
              datumString,
              req.body.predmet.nalozi[index].racun_primaoca,
              req.body.predmet.id_predmeta,
              req.body.predmet.nalozi[index].sifra_naloga,
            ]
          );
        } else if (req.body.predmet.nalozi[index].brisanje) {
          await connection.query(
            "delete from nalog_za_uplatu_takse where id_predmeta=? && sifra_naloga=?",
            [
              req.body.predmet.id_predmeta,
              req.body.predmet.nalozi[index].sifra_naloga,
            ]
          );
        }
      }

      res.json(await connection.query("COMMIT"));

      return true;
    } catch (err) {
      await connection.query("ROLLBACK");
      console.log("ROLLBACK at izmeniPredmet", err);
      throw err;
    } finally {
      await connection.release();
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

module.exports = routes;
