var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware per la gestione delle richieste CORS
const cors = require('cors');
const corsOptions = {
  origin: ['https://sifim.netlify.app', 'http://localhost:3000'],
  credentials: true,
  optionSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware per il parsing del corpo della richiesta e i cookie
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Middleware per il logging delle richieste
app.use(logger('dev'));

// Middleware per i file statici
app.use(express.static(path.join(__dirname, 'public')));


// Router per l'endpoint principale
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Router per gli utenti
const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

// Router per l'inserimento di edifici
const insertRouter = require('./routes/apiRoutes');
app.use('/inserBuild', insertRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
