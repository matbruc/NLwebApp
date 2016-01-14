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
    console.log(req.file);
    console.log('File name is ' + req.file.name);
    console.log('File size is ' + req.file.size);
    console.log('File path is ' + req.file.path);
    var reader = csv.createCsvFileReader(req.file.path, {
        'separator': '\t',
        'quote': '"',
        'escape': '"',
        'comment': ''
    });
    reader.addListener('data', function(data) {
        var dataConverted = iconv.decode(data, 'utf8');
        console.log(dataConverted);
    });

    reader.addListener('end', function() {
        res.render('file-uploaded', {
            message: "Successfully consumed the CSV file"
        });
    });
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