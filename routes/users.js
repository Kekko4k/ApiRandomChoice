var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt");

const { MongoClient } = require("mongodb");
const uri =  process.env.DB_URL;


async function connect() {
  try {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();
    const database = client.db("Users");
    console.log("Connected to MongoDB!");
    return database;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}



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



/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send(["123", "456", "789"]);
});


router.post('/register', async function (req, res, next) {
  const { username, password } = req.body;
  const email = req.body.email.toLowerCase();


  // Ottieni la collezione "user" dal database
  const client = await MongoClient.connect(uri, { useNewUrlParser: true });
  const database = client.db("Users");
  const collection = database.collection("user");
  try {
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
                client.close();
              }
            });
          });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Errore nella ricerca dell'amministratore" });
  }
});

//collection.findOne({ $and: [{ email: email }] }, 


router.post('/login', async function (req, res, next) {
  const { password } = req.body;
  try {
    const email = req.body.email.toLowerCase()
    const client = await MongoClient.connect(uri, { useNewUrlParser: true });
    const database = client.db("Users");
    const collection = database.collection("user");
    collection.findOne({ email: email }, function (err, user) {
      if (err) {
      } else {
        if (user) {
          bcrypt.compare(password, user.password, function (err, resp) {
            if (err) {
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
          client.close();
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'accesso" });
  }
});

router.post('/ammin', async function (req, res, next) {
  const { id } = req.body;
  try {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true });
    const database = client.db("Users");
    const collection = database.collection("Administrators");
    collection.findOne({ nick_amm: id }, function (err, user) {
      if (err) {

      } else {

        if (user) {
          res.status(200).send(user)
          client.close();
        } else {
          res.status(404)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Errore nella ricerca dell'amministratore" });
  }
});



module.exports = router;

