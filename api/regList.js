const express = require('express');
const pool = require('../db/index').pool;
const routes = express.Router();
const uuid = require('uuid');

// ucitaj sve reg. listove
routes.get('/', async (req, res) => {
    try {
        res.json(await new Promise((resolve, reject) => {
            pool.query("select * from registracioni_list", (err, results) => {
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