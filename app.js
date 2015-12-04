var express = require('express');
var app = express(); // the main app
var router = express.Router();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var moment = require('moment');
var moment = require('moment-timezone');
var conn = require('./lib/mymysql');

var errorStack = require('./lib/errorstack');
//errorStack.enableDebugMode();


//moment.tz.setDefault('Africa/Lagos');


app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '5mb'}));
app.use(cookieParser());

app.use('/', require('./lib/preconfig'));

var FDAAPI = require('./FDAAPI');



app.all('/*', function (req, res, next) {
    //console.log(app.locals);
    console.log('\n\n******************************');
    console.log(moment().format('HH:mm:ss'));
    console.log('\n');
    var fdaapi = new FDAAPI (req, res, req.url.slice(1));
    fdaapi.processAPI()
        .then(function(result) {
            res.send(result);
        });
        
    //next();
    //res.send('Ok');
    console.log('\n');
});



app.listen(1337);
