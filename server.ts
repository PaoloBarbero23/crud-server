"use strict"

import https from "https"
import http from 'http'
import url from 'url'
import fs from 'fs'
import { MongoClient, ObjectId } from "mongodb"
import express from "express"
import dotenv from "dotenv";
import cors from "cors";


/* ********************** */
//config
dotenv.config({ "path": ".env" })
const HTTP_PORT = process.env.PORT || 1337;
const HTTPS_PORT = 1338
const privateKey = fs.readFileSync("keys/privateKey.pem", "utf8");
const certificate = fs.readFileSync("keys/certificate.crt", "utf8");
const credentials = { "key": privateKey, "cert": certificate };
const app = express();
const DB_NAME: string = "5b";
const connectionString: any = process.env.connectionString;
const whitelist = ["https://crudserver-paolobarbero.onrender.com", "https://localhost:1338", "http://localhost:1337", "https://cordovaapp"]
const corsOption = {
    origin: function (origin: any, callback: any) {

        return callback(null, true);
    },

    credentials: true
};

let server = http.createServer(app);


let paginaErrore: string;//strinag che contiene la pagina di errore
//avvio del server
server.listen(HTTP_PORT, () => {
    init()
});

let httpsServer = https.createServer(credentials, app);
httpsServer.listen(HTTPS_PORT, function () {
    console.log("Server in ascolto sulle porte HTTP:" + HTTP_PORT + ", HTTPS:" + HTTPS_PORT);
});

function init() {
    fs.readFile("./static/error.html", (err: any, data: any) => {
        if (err)
            paginaErrore = "<h3><b>Risorsa non trovata</b></h3>";
        else
            paginaErrore = data.toString();
    })
}


/************MIDDLEWARE************/
//1 request log
app.use("/", (req: any, res: any, next: any) => {
    console.log("---> " + req.method + ": " + req.originalUrl);
    next();
})


//2 
app.use("/", express.static("./static"))//cerca le risorse nella cartella static

//3 
app.use("/", express.json({ "limit": "50mb" }))//permette la lettura dei parametri post

app.use("/", express.urlencoded({ limit: "50mb", extended: true }))

//4 log parametri get e post
app.use("/", (req: any, res: any, next: any) => {
    if (Object.keys(req.query).length != 0)//req.query contiene parametri GET
    {
        console.log("---> Parametri GET: " + JSON.stringify(req.query))
    }
    if (Object.keys(req.body).length != 0)
        console.log("---> PARAMETRI BODY: " + JSON.stringify(req.body))
    console.log("---> " + req.method + ": " + req.originalUrl);
    next();
})


//5 apertura della connessione

app.use("/api/", (req: any, res: any, next: any) => {
    let connessione = new MongoClient(connectionString)
    connessione.connect()
        .catch((err: any) => {
            res.status(503);
            res.send("Errore connessione database")
        })
        .then((client: any) => {
            req["connessione"] = client;
            next();
        })

})

app.use("/", cors(corsOption))


/************USER LISTENER************/
app.get("/api/getCollections", (req: any, res: any, next: any) => {

    let collection = req.connessione.db(DB_NAME);
    collection.listCollections().toArray((err: any, data: any) => {
        if (err) {
            res.status(500)
            res.send("Errore esecuzione query")
        }
        else
            res.send(data)
    })


})

app.get("/api/:Collection", (req: any, res: any, next: any) => {
    let collezione = req.params.Collection;
    let param = req.query;
    let collection = req.connessione.db(DB_NAME).collection(collezione)
    collection.find(param).toArray((err: any, data: any) => {
        if (err) {
            res.status(500);
            res.send("Errore esecuzione query")
        }
        else {
            let response = [];
            for (const item of data) {
                let key = Object.keys(item)[1]
                response.push({ "_id": item["_id"], "val": item[key] })
            }

            res.send(data);
        }
        req.connessione.close();
    })
})



app.get("/api/:nomeCollezione/:id", (req: any, res: any) => {
    let nome_collezione = req.params.nomeCollezione;
    let id = req.params.id;
    let collection = req.connessione.db(DB_NAME).collection(nome_collezione)
    collection.findOne({ "_id": new ObjectId(id) }, (err: any, data: any) => {
        if (err) {
            res.status(500);
            res.send("Errore esecuzione query")
        }
        else
            res.send(data);
    })
})

app.post("/api/:nome_collezione/:id", (req: any, res: any) => {
    let nome_collezione = req.params.nome_collezione;
    let params = req.body;
    let collection = req.connessione.db(DB_NAME).collection(nome_collezione)
    collection.insertOne(params, (err: any, data: any) => {
        if (err) {
            res.status(500);
            res.send("Errore esecuzione query");
        }
        else {
            res.send(data);
        }
    })
})
app.patch("/api/:nome_collezione/:id", (req: any, res: any) => {
    let nome_collezione = req.params.nome_collezione;
    let id = req.params.id
    let collection = req.connessione.db(DB_NAME).collection(nome_collezione)
    collection.updateOne({ "_id": new ObjectId(id) }, { $set: req.body }, (err: any, data: any) => {
        if (err) {
            res.status(500);
            res.send("Errore esecuzione query");
        }
        else {
            res.send(data);
        }
    })
})
app.put("/api/:nome_collezione/:id", (req: any, res: any) => {
    let nome_collezione = req.params.nome_collezione;
    let id = req.params.id
    let collection = req.connessione.db(DB_NAME).collection(nome_collezione)
    collection.replaceOne({ "_id": new ObjectId(id) }, req.body, (err: any, data: any) => {
        if (err) {
            res.status(500);
            res.send("Errore esecuzione query");
        }
        else {
            res.send(data);
        }
    })
})

app.delete("/api/:nome_collezione/:id", (req: any, res: any) => {
    let nomeCollection = req.params.nome_collezione;
    let id = new ObjectId(req.params.id)
    let collection = req.connessione.db(DB_NAME).collection(nomeCollection)
    collection.deleteOne({ "_id": id }, (err: any, data: any) => {
        if (err) {
            res.status(500);
            res.send("Errore esecuzione query");
        }
        else {
            res.send(data);
        }
    })
})



/************DEFAULT ROOT************/


app.use("/", (req: any, res: any) => {//viene fatta se non vien trovata la risorsa, sia statica che dinamica
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        res.send("API non disponibile")
        req.client.close()

    }
    else
        res.send(paginaErrore);
})

app.use("/", (err: any, req: any, res: any, next: any) => {//viene fatta se non vien trovata la risorsa, sia statica che dinamica
    if (req.client)
        req.client.close();
    console.log("ERRORE SERVER: " + err.stack);
    res.status(500)
    res.send(err.message)
})








