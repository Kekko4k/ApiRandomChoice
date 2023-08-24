var express = require('express');
var router = express.Router();
const MongoClient = require("mongodb").MongoClient
const dotenv = require('dotenv');
dotenv.config(); // Carica le variabili d'ambiente da .env
const uri = "mongodb+srv://kekko4000:Francesco.2000@kekko4000.svazekq.mongodb.net/?retryWrites=true&w=majority";
const multer = require('multer');
const path = require('path');
var database


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


//Le foto caricate vengono aggiunte nella cartella public/images con il nome in base alla data
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/images/')     // './public/images/' directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

var upload = multer({
    storage: storage
});

//https://apisifim.onrender.com/images/
//http://localhost:5000/images/
//Viene caricato il percorso della foto nel database
router.post('/files', upload.array('files'), async (req, res) => {
  const id_app = req.body.Id_app[0];
  if (!req.files) {
    console.log("No file upload");
  } else {
    const collection = database.collection("ImagesBuildings");
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const imgsrc = 'https://apisifim.onrender.com/images/' + req.files[i].filename;
      images.push(imgsrc);
    }
    const imagesBuild = {
      id_app,
      images
    };
    collection.insertOne(imagesBuild, (error, result) => {
      if (error) {
        res.status(500).json({ error: "Si è verificato un errore durante il caricamento delle immagini" });
      } else {
        res.status(200).json({ message: "Immagini aggiunti" });
      }
    });
  }
});

router.get('/files', async function (req, res, next) {
  try {
    const { ids } = req.query; // Assume che gli ID siano passati come query parameter ?ids=id1,id2,id3...
    const idArray = ids.split(","); // Divide la stringa di ID in un array
    const collection = database.collection("ImagesBuildings");
    const images = await collection.find({ id_app: { $in: idArray } }).toArray();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Si è verificato un errore durante la ricerca delle immagini." });
  }
});

router.get('/last_build',  function (req, res, next) {
  const imagesCollection = database.collection("ImagesBuildings");
  const { ObjectId } = require("mongodb");
  // Effettua la query per ottenere gli ultimi 4 oggetti dalla collezione "ImagesBuildings"
  imagesCollection.find()
    .sort({ dataInserimento: -1 }) // Ordina in modo decrescente in base a dataInserimento
    .limit(4) // Limita il risultato a 4 oggetti
    .toArray(async (err, images) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nel recupero dei dati' });
      } else {
        const buildingIds = images.map(image => ObjectId(image.id_app));

        const buildingsCollection = database.collection("buildings");

        // Cerca gli oggetti nella collezione "buildings" utilizzando gli id trovati
        try {
          const buildings = await buildingsCollection.find({ _id: { $in: buildingIds } }).toArray();
    
          res.json(buildings);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Errore nel recupero dei dati' });
        }
      }
    });
});

router.get('/cerca', function (req, res, next) {
  const { locali, bagni, prezzoMin, prezzoMax, tipologia, superficieMin, superficieMax} = req.query;
  const collection = database.collection("buildings");
  console.log(collection);
  const query = {
    tipologia: tipologia
  };

  console.log(tipologia);
  if (superficieMin && superficieMax) {
    query.superficie = {
      $gte: parseInt(superficieMin),
      $lte: parseInt(superficieMax)
    };
  } else if (superficieMin) {
    query.superficie = { $gte: parseInt(superficieMin) };
  } else if (superficieMax && superficieMax !== '-1') {
    query.superficie = { $lte: parseInt(superficieMax) };
  }

  if (prezzoMin && prezzoMax) {
    query.prezzo = {
      $gte: parseInt(prezzoMin),
      $lte: parseInt(prezzoMax)
    };
  } else if (prezzoMin) {
    query.prezzo = { $gte: parseInt(prezzoMin) };
  } else if (prezzoMax && prezzoMax !== '-1') {
    query.prezzo = { $lte: parseInt(prezzoMax) };
  }
  
  if (locali && locali.length > 0) {
    const localiArray = locali.split(",");
    const localiConditions = [];

    localiArray.forEach(localiItem => {
      if (localiItem === '-1') {
        localiConditions.push({ stanze: { $gt: 5 } });
      } else {
        localiConditions.push({ stanze: parseInt(localiItem) });
      }
    });

    if (localiConditions.length === 1) {
      query.$and = localiConditions;
    } else if (localiConditions.length > 1) {
      query.$or = localiConditions;
    }
  }

  if (bagni && bagni.length > 0) {
    const bagniArray = bagni.split(",");
    const bagniConditions = [];

    bagniArray.forEach(bagniItem => {
      if (bagniItem === '-1') {
        bagniConditions.push({ bagni: { $gt: 5 } });
      } else {
        bagniConditions.push({ bagni: parseInt(bagniItem) });
      }
    });

    if (bagniConditions.length === 1) {
      query.$and = query.$and || [];
      query.$and.push(bagniConditions[0]);
    } else if (bagniConditions.length > 1) {
      query.$or = bagniConditions;
    }
  }

  collection.find(query).toArray((error, results) => {
    if (error) {
      res.status(500).json({ error: "Si è verificato un errore durante la ricerca nella collezione." });
    } else {
      res.status(200).json(results);
    }
  });
});

router.get('/cercaFavoriti', function (req, res, next) {
  const { id } = req.query;
  const collection = database.collection("Favorites");
  collection.findOne({ id_user: id }, (error, result) => {
    if (error) {
      res.status(500).json({ error: "Si è verificato un errore durante la ricerca dei favoriti." });
    } else {
      if (result) {
        const idBuilds = result.id_builds || [];
        res.status(200).send({ idBuilds });
      } else {
        res.status(404).json({ message: "Nessun favorito trovato per l'id specificato." });
      }
    }
  });
});


/* GET home page. */
router.post('/add', function (req, res, next) {
    const anno_costruzione= req.body.anno_costruzione;
    const certificazione=req.body.certificazione;
    const climatizzatore=req.body.climatizzatore;
    const dataInserimento=req.body.dataInserimento;
    const planimetria=req.body.planimetria;
    const riscaldamento=req.body.riscaldamento;
    const spese_Condominio=req.body.spese_Condominio;
    const stato=req.body.stato;
    const tipologia=req.body.tipologia;
    const altro=req.body.altro;
    const descrizione=req.body.descrizione;
    const indirizzo=req.body.indirizzo;
    const comune= req.body.comune;
    const provincia= req.body.provincia;
    const titolo= req.body.titolo;
    const stanze=parseInt(req.body.stanze);
    const superficie = parseInt(req.body.superficie);
    const piano = parseInt(req.body.piano);
    const posti_Auto = parseInt(req.body.posti_Auto);
    const totali_piano_edificio = parseInt(req.body.totali_piano_edificio);
    const prezzo = parseInt(req.body.prezzo);
    const collection = database.collection("buildings");
    const newBuild = {
        titolo,
        anno_costruzione,
        certificazione,
        climatizzatore,
        dataInserimento,
        piano,
        planimetria,
        posti_Auto,
        prezzo,
        riscaldamento,
        spese_Condominio,
        stanze,
        stato,
        superficie,
        tipologia,
        totali_piano_edificio,
        altro,
        descrizione,
        indirizzo,
        comune,
        provincia
      };
      collection.insertOne(newBuild, (error, result) => {
        if (error) {
          res.status(500).json({ error: "Si è verificato un errore durante la registrazione dell'utente." });
        } else {
          const insertedId = result.insertedId;
          res.status(200).json({ message: "Immobile aggiunto con successo!" ,insertedId} );
        }
      });

});


router.post('/favoriteAdd', function (req, res, next) {
  const { id_build, id_user } = req.body;
  const collection = database.collection("Favorites");

  collection.findOneAndUpdate(
    { id_user: id_user },
    { $push: { id_builds: id_build } },
    { upsert: true },
    (error, result) => {
      if (error) {
        res.status(500).json({ error: "Si è verificato un errore durante la registrazione dell'utente." });
      } else {
        res.status(200).json({ message: "Inserito" });
      }
    }
  );
});


router.post('/favoriteRemove', function (req, res, next) {
  const { id_build, id_user } = req.body;
  const collection = database.collection("Favorites");

  collection.updateOne(
    { id_user: id_user },
    { $pull: { id_builds: id_build } },
    (error, result) => {
      if (error) {
        res.status(500).json({ error: "Si è verificato un errore durante la rimozione del favorito." });
      } else {
        if (result.modifiedCount > 0) {
          res.status(200).json({ message: "Favorito rimosso con successo." });
        } else {
          res.status(404).json({ message: "Nessun favorito trovato per l'id utente specificato." });
        }
      }
    }
  );
});

const { ObjectId } = require('mongodb');

router.get('/preferiti', function (req, res, next) {
  const { id } = req.query;
  const collection = database.collection("buildings");
  const favoritesCollection = database.collection("Favorites");

  favoritesCollection.findOne({ id_user: id }, (error, favoriteUser) => {
    if (error) {
      res.status(500).json({ error: "Si è verificato un errore durante la ricerca nella collezione Favorites." });
    } else if (!favoriteUser) {
      res.status(404).json({ error: "Utente non trovato nei preferiti." });
    } else {
      const builds=favoriteUser.id_builds;
      
      // Converte gli ID in oggetti ObjectId di MongoDB
      const objectIdArray = builds.map(id => ObjectId(id));

      // Costruisci la query per trovare gli oggetti con gli ID corrispondenti
      const query = { _id: { $in: objectIdArray } };

      // Esegui la query sulla collezione "buildings"
      console.log(query);
      collection.find(query).toArray((error, results) => {
        if (error) {
          res.status(500).json({ error: "Si è verificato un errore durante la ricerca nella collezione buildings." });
        } else {
          res.status(200).json(results);
        }
      });
    }
  });
});

router.get('/immobile/', function (req, res, next) {
  let id = req.query.id;
  const buildingsCollection = database.collection("buildings");
  const imagesCollection = database.collection("ImagesBuildings");

  buildingsCollection.findOne({ _id: ObjectId(id) }, (error, result) => {
    if (error) {
      res.status(500).json({ error: "Si è verificato un errore durante la ricerca nellla collezione." });
    } else if (!result) {
      res.status(404).json({ error: "Nessun immobile trovato con l'ID fornito." });
    } else {
      imagesCollection.findOne({ id_app: id }, (error, imagesResult) => {
        if (error) {
          res.status(500).json({ error: "Si è verificato un errore durante la ricerca delle immagini." });
        } else {
          const imagesArray = imagesResult ? imagesResult.images : []; // Se imagesResult è null o undefined, restituirà un array vuoto
          const combinedResult = { ...result, images: imagesArray };
          res.status(200).json(combinedResult);
        }
      });
    }
  });
});




module.exports = router;
