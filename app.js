var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var multer = require('multer');
var upload = multer({
  dest: 'uploads'
});
var csv = require('ya-csv');
var iconv = require('iconv-lite');
var https = require('http-debug').https
https.debug = 0;


var csvResponse = [];

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
    title: 'Express'
  });
});


app.post('/upload', upload.single('file'), function(req, res) {
  var reader = csv.createCsvFileReader(req.file.path, {
    separator: '\t',
    quote: '"',
    escape: '"',
    columns: true,
    comment: '#',
  });


  reader.addListener('data', function(data) {
    var dataConverted = iconv.decode(data, 'utf8');
    var dataConvertedSplitted = dataConverted.split(',');
    var emails = encodeURIComponent(dataConvertedSplitted[6]);
    var post_data = 'email=' + emails;
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
      });
      res.on('end', function () {
        csvResponse.push(emailState);
        io.emit('csvResponse', csvResponse);
      })
    });

    post_req.write(post_data);
    post_req.end();
  });

  res.end('Se esta procesando el archivo');
});

io.on('connection', function(socket) {
  socket.emit('csvResponse', csvResponse);
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
