var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//const port = 3000;

var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, '/')))
//app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


const apiKey = "AIzaSyCkA6lmPa0eATWDgBS4FYDSD0CPMaL60nI";

const {Translate} = require('@google-cloud/translate').v2;

// Creates a client
const translate = new Translate({key: apiKey});


async function listLanguages(io) {
    // Lists available translation language with their names in English (the default).
    const [languages] = await translate.getLanguages();
  io.emit('chat message', 'Idioma - Codigo');
    languages.forEach(language => {
      io.emit('chat message', language.name + ' - ' + language.code);
    });

}

async function translateText(text, target, io) {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.

  let translations = await translate.translate(text, target);
  io.emit('chat message', text + '-' + target + ' => ' + translations[0]);
}

io.on('connection', (socket) => {
  io.emit('chat message', '* * * Bienvenidos al chat traductor * * *');
  io.emit('chat message', 'Para conocer idiomas de soporte escriba: -help');
  io.emit('chat message', 'Para traducir escriba: texto a traducir -codigo_destino');

  socket.on('chat message', msg => {
    if (msg === '-help'){
      listLanguages(io).then(r => { return r });
    }
    else if (msg.split('-').length === 2){
      let l = msg.split('-')

      let target = l[l.length - 1]
      let text = l[0]

      translateText(text, target, io).then(r => { return r });
    }
    else {
      io.emit('chat message', 'No te comprendemos !!');
      io.emit('chat message', 'Para conocer idiomas de soporte escriba: -help');
      io.emit('chat message', 'Para traducir escriba: texto a traducir -codigo_destino');
    }


  });

});

server.listen(3000);

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
