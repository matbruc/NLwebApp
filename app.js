'use strict';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var csv = require('ya-csv');
var multer = require('multer');
var upload = multer({
    dest: 'uploads/'
});
var iconv = require('iconv-lite');
var post = require('./post/post.js');
var request = require('request');
var querystring = require('querystring');
var https = require('http-debug').https
https.debug = 0;

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

app.use('/', routes);

app.post('/upload/file', upload.single('file'), function(req, res) {
    var emailsOK = [];
    var emailsRepetidos = [];
    var emailsError = [];
    console.log(req.file);
    console.log('File name is ' + req.file.name);
    console.log('File size is ' + req.file.size);
    console.log('File path is ' + req.file.path);
    var reader = csv.createCsvFileReader(req.file.path, {
        separator: '\t',
        quote: '"',
        escape: '"',
        comment: '',
        columns: true,
        comment: '#',
    });

    reader.addListener('data', function(data) {
        var dataConverted = iconv.decode(data, 'utf8');
        var dataConvertedSplitted = dataConverted.split(',');
        console.log(dataConvertedSplitted[6]);
        var emails = encodeURIComponent(dataConvertedSplitted[6]);
        console.log(emails);
        var post_data = 'email=' + emails;

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
            console.log('statusCode: ', res.statusCode);
            if (res.statusCode == 200) {
                emailsOK.push(emails);
                var messageFront = "El email " + emails + " fué suscripto correctamente" + emailsOK[0];
                res.render('file-uploaded', {
            message1: "Estos OK " + emailsOK[0]
            
        });
            } else if (res.statusCode == 409) {
                emailsRepetidos.push(emails);
                var messageFront = "El email " + emails + " ya se encuentra suscripto";
            } else if (res.statusCode == 500) {
                emailsError.push(emails);
                var messageFront = "El email " + emails + " tiene un error";
            }
            console.log(messageFront);
            res.on('data', function(chunk) {
                console.log('Response: ' + chunk);
            });
        });
        post_req.write(post_data);
        post_req.end();
    });

    reader.addListener('end', function(emailsOK) {
        res.render('file-uploaded', {
            message1: "Estos OK ",// + emailsOK[0],
            message2: "Estos Repetidos " ,//+ emailsRepetidos[0],
            message3: "Estos Error "// + emailsError[0]
        });
    });
});

//catch 404 and forward to error handler
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