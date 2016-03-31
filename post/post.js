// We need this to build our post string

var querystring = require('querystring');
var https = require('http-debug').https
var fs = require('fs');
https.debug = 0;

module.exports = {
    postData: function(emails) {
        // Build the post string from an object
        var post_data = 'email=' + emails;

        // An object of options to indicate where to post to
        var post_options = {
            host: "www.avenida.com.ar",
            path: "/api/user/newsletter",
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        };

        // Set up the request
        var post_req = https.request(post_options, function(res) {
                res.setEncoding('utf8');
                console.log('statusCode: ', res.statusCode);
                console.log('headers: ', res.headers);
                console.log('response: ', res.body);
                res.on('data', function(chunk) {
                    console.log('Response: ' + chunk);
                });
            })
            /*.on('error', (e) => {
            console.error(e);*/
            /*res.on('post_data', function(chunk) {
                console.log("body: " + chunk);
            });*/
        console.log(res.statusCode);
        console.log(post_data);
        console.log(post_options);
        post_req.write(post_data);
        post_req.end();

    }
}