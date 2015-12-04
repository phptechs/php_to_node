var express = require('express');
var router = express.Router();

var mylib = require('./mylib');

router.route('*')
    .all(function (req, res, next) {
        //console.log('preconfig');
        req.app.locals.$_GET = mylib.getGetParamsPhp(req);
        req.app.locals.$_POST = mylib.getPostParamsPhp(req);
        next();
    });



module.exports = router;