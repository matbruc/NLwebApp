var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Newsletter Web App' });
});

router.get('/upload/file', function(req, res, next){
	res.render('file-uploaded', { title: 'Newsletter Web App'});
});

module.exports = router;
