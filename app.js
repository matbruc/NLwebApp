var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var server = require('http').createServer(app);

var multer = require('multer');
var upload = multer({
  dest: 'uploads'
});


var csv = require('ya-csv');
var iconv = require('iconv-lite');
var debug = require('debug')('NLwebapp:server');
var https = require('http-debug').https
https.debug = 0;
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


var csvResponse = [];
var csvLength = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.render('index', {
    title: 'Newsletter Web App'
  });
});


app.post('/upload', upload.single('file'), function(req, res) {
  var reader = csv.createCsvFileReader(req.file.path);

  reader.addListener('data', function(data) {
    var emails = encodeURIComponent(data);
    var post_data = 'email=' + emails;
    console.log(emails);
    var emailState = {
      status: '',
      email: ''
    };

    // An object of options to indicate where to post to
    var post_options = {
      host: "www.avenida.com.ar",
      path: "/api/user/newsletter",
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    // Set up the request
    var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function() {
          emailState.email = decodeURIComponent(emails);
          switch (res.statusCode) {
            case 409:
              emailState.status = 'Repetido';
              break;
            case 500:
              emailState.status = 'Error';
              break;
            default:
              emailState.status = 'Ok';
          }
          io.emit('csvParsing', emailState);
      });
      res.on('end', function () {
        csvResponse.push(emailState);
        io.emit('csvProgress', {current: (csvResponse.length/csvLength)*100});
        if (csvResponse.length == csvLength) {
          io.emit('csvParsed', csvLength);
          csvResponse = [];
          csvLength = 0;
        }
      })
    });

    csvLength++;
    post_req.write(post_data);
    post_req.end();
  });

  reader.addListener('end', function (data) {
    console.log(csvLength);

  })

  res.end('Se esta procesando el archivo');
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
