const { ObjectId } = require('mongodb'); //serve per handlePreferiti

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

const handleUpload = async (req, res) => {
    const id_app = req.body.Id_app[0];
    if (!req.files) {
        console.log("No file upload");
    } else {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
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
                client.close();
            }
        });
    }
};

const handleGetFiles = async (req, res) => {
    try {
        const { ids } = req.query;
        const idArray = ids.split(",");
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
        const collection = database.collection("ImagesBuildings");
        const images = await collection.find({ id_app: { $in: idArray } }).toArray();
        res.json(images);
        client.close();
    } catch (error) {
        res.status(500).json({ error: "Si è verificato un errore durante la ricerca delle immagini." });
    }
};


const handleLastBuild = async (req, res) => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
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
                        client.close();
                    } catch (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Errore nel recupero dei dati' });
                    }
                }
            });
    } catch (error) {
        res.status(500).json({ error: "Errore nella ricerca digli ultimi immobili" });
    }
};

const handleCerca = async (req, res) => {
    const { locali, bagni, prezzoMin, prezzoMax, tipologia, superficieMin, superficieMax } = req.query;
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
        const collection = database.collection("buildings");
        const query = {
            tipologia: tipologia
        };

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

        collection.find(query).sort({ dataInserimento: -1 }).toArray((error, results) => {
            if (error) {
                res.status(500).json({ error: "Si è verificato un errore durante la ricerca nella collezione." });
            } else {
                res.status(200).json(results);
                client.close();
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Si è verificato un errore durante il recupero dei dati" });
    }
};

const handleCercaFavoriti = async (req, res) => {
    const { id } = req.query;

    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
        const collection = database.collection("Favorites");
        collection.findOne({ id_user: id }, (error, result) => {
            if (error) {
                res.status(500).json({ error: "Si è verificato un errore durante la ricerca dei favoriti." });
            } else {
                if (result) {
                    const idBuilds = result.id_builds || [];
                    res.status(200).send({ idBuilds });
                    client.close();
                } else {
                    res.status(404).json({ message: "Nessun favorito trovato per l'id specificato." });
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Errore nella ricerca dei favoriti" });
    }
};

const handleAdd = async (req, res) => {
    const { body } = req;
    try {
        const database = await connect();
        const collection = database.collection("buildings");
        collection.insertOne(body, (error, result) => {
            if (error) {
                res.status(500).json({ error: "Si è verificato un errore durante la registrazione dell'utente." });
            } else {
                const insertedId = result.insertedId;
                res.status(200).json({ message: "Immobile aggiunto con successo!", insertedId });
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Errore nell'aggiunta degli immobili" });
    }
};

const handleFavoriteAdd = async (req, res) => {
    const { id_build, id_user } = req.body;


    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
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
                    client.close();
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Errore nell'aggiunta dei favoriti" });
    }
};

const handleFavoriteRemove = async (req, res) => {
    const { id_build, id_user } = req.body;

    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
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
                        client.close();
                    } else {
                        res.status(404).json({ message: "Nessun favorito trovato per l'id utente specificato." });
                    }
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Errore nella rimozione dei favoriti" });
    }
};

const handlePreferiti = async (req, res) => {
    const { id } = req.query;

    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
        const collection = database.collection("buildings");
        const favoritesCollection = database.collection("Favorites");
        favoritesCollection.findOne({ id_user: id }, (error, favoriteUser) => {
            if (error) {
                res.status(500).json({ error: "Si è verificato un errore durante la ricerca nella collezione Favorites." });
            } else if (!favoriteUser) {
                res.status(404).json({ error: "Utente non trovato nei preferiti." });
            } else {
                const builds = favoriteUser.id_builds;

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
                        client.close();
                    }
                });
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Errore ricerca dei favoriti" });
    }
};


const handleImmobile = async (req, res) => {
    let id = req.query.id;
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });
        const database = client.db("Users");
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
                        client.close();
                    }
                });
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Errore nella ricerca ddell'immobile" });
    }
};

module.exports = { handleUpload, handleGetFiles, handleLastBuild, handleCerca, handleCercaFavoriti, handleAdd, handleFavoriteAdd, handleFavoriteRemove, handlePreferiti, handleImmobile };
