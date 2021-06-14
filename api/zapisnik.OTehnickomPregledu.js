const express = require("express");
const pool = require("../db/index").pool;
const routes = express.Router();
const uuid = require("uuid");



// ucitaj sve zapisnike o tehnickom pregledu
routes.get('/', async (req, res) => {
  try {
      res.json(await new Promise((resolve, reject) => {
          pool.query("select zotp.id_broj,zotp.datum,zotp.vreme_pocetka,zotp.ocena_ispravnosti,zotp.kontrolor,zotp.atest_za_plin,zotp.atest_za_stakla,sd.reg_oznaka,v.broj_sasije,k.id_klijenta from zapisnik_o_tehnickom_pregledu zotp join saobracajna_dozvola sd on(zotp.reg_oznaka=sd.reg_oznaka) join vozilo v on(sd.broj_sasije=v.broj_sasije) join klijent k on(v.id_klijenta=k.id_klijenta)", (err, results) => {
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



// ucitaj  zapisnike_o_tehnickom_pregledu za idKlijenta
routes.get('/:idKlijenta', async (req, res) => {
  try {
      res.json(await new Promise((resolve, reject) => {
          pool.query("select zotp.id_broj,zotp.datum,zotp.vreme_pocetka,zotp.ocena_ispravnosti,zotp.kontrolor,zotp.atest_za_plin,zotp.atest_za_stakla,sd.reg_oznaka,v.broj_sasije,k.id_klijenta from zapisnik_o_tehnickom_pregledu zotp join saobracajna_dozvola sd on(zotp.reg_oznaka=sd.reg_oznaka) join vozilo v on(sd.broj_sasije=v.broj_sasije) join klijent k on(v.id_klijenta=k.id_klijenta) where k.id_klijenta=?",[req.params.idKlijenta], (err, results) => {
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




































