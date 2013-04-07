var fs = require('fs'),
    express = require('express');

var app = express();

app.use('/', express.static(__dirname + '/public'));

app.use(function(req, res, callback){
    fs.readFile(__dirname + '/index.html', 'utf8', function(err, html){
        if (err) return callback(err);
        res.send(html);
    });
});

var port = process.env.PORT;
app.listen(port, function() {
    console.log("Listening on " + port);
});