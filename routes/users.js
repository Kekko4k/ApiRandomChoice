var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const MongoClient = require("mongodb").MongoClient
const uri = "mongodb+srv://kekko4000:Francesco.2000@kekko4000.svazekq.mongodb.net/?retryWrites=true&w=majority";

var database


function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (error, salt) => {
      if (error) {
        reject(error);
      }
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) {
          reject(error);
        }
        resolve(hash);
      });
    });
  });
}

async function connect() {
  try {
    MongoClient.connect(uri, { useNewUrlParser: true }, (error, result) => {
      if (error) throw error
      database = result.db("Users")

    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch {
    console.log("error");
  }
}

connect();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send(["123", "456", "789"]);
});


router.post('/register', function (req, res, next) {
  const { username, password } = req.body;
  const email = req.body.email.toLowerCase();
  console.log(email);
  
  // Ottieni la collezione "user" dal database
  const collection = database.collection("user");

  // Verifica se l'email esiste già nella collezione
  collection.findOne({ email: email }, (error, existingUser) => {
    if (error) {
      res.status(500).json({ error: "Si è verificato un errore durante la registrazione dell'utente." });
    } else if (existingUser) {
      res.status(409).json({ error: "L'email è già registrata. Si prega di utilizzare un'email diversa." });
    } else {
      hashPassword(password)
        .then((hash) => {
          // Crea un nuovo documento da inserire nel database
          const newUser = {
            username,
            email,
            password: hash
          };

          // Inserisci il nuovo documento nella collezione
          collection.insertOne(newUser, (error, result) => {
            if (error) {
              res.status(500).json({ error: "Si è verificato un errore durante la registrazione dell'utente." });
            } else {
              res.status(200).json({ message: "Utente registrato con successo!" });
            }
          });
        });
    }
  });
});

//collection.findOne({ $and: [{ email: email }] }, 


router.post('/login', function (req, res, next) {
  const { password } = req.body;
  const email=req.body.email.toLowerCase()
  const collection = database.collection("user");
  collection.findOne({ email: email }, function (err, user) {
    if (err) {
   } else {
      if (user) {
        bcrypt.compare(password, user.password, function(err, resp) {
          if (err){
            res.status(500).json({ error: "Si è verificato un errore durante la ricerca dell'utente." });
          }
          if (resp) {
            res.status(200).send(user);
          } else {
            // response is OutgoingMessage object that server response http request
            res.status(404).json({ message: "E-mail o passaword errati" });
          }
        }); 
        // Utente trovato
      } else {
        // Nessun utente trovato con l'email specificata
        res.status(404).json({ message: "Nessun utente trovato con l'email specificata." });
      }
    }
  });
});

router.post('/ammin', async function (req, res, next) {
  const { id }= req.body;
  const collection = database.collection("Administrators");
  collection.findOne({ nick_amm: id }, function (err, user) {
    if (err) {

    }else{

      if (user) {
        res.status(200).send(user)
      }else{
        res.status(404)
      }
    }
  });
});



module.exports = router;

