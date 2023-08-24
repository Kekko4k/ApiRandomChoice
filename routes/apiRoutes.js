const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { handleUpload, handleGetFiles, handleLastBuild, handleCerca, handleCercaFavoriti, handleAdd, handleFavoriteAdd, handleFavoriteRemove, handlePreferiti, handleImmobile} = require('./handlers');

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

router.post('/files', upload.array('files'), handleUpload);
router.get('/files', handleGetFiles);
router.get('/last_build', handleLastBuild);
router.get('/cerca', handleCerca);
router.get('/cercaFavoriti', handleCercaFavoriti);
router.post('/add', handleAdd);
router.post('/favoriteAdd', handleFavoriteAdd);
router.post('/favoriteRemove', handleFavoriteRemove);
router.get('/preferiti', handlePreferiti);
router.get('/immobile/', handleImmobile);


module.exports = router;