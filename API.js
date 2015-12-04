var _ = require('lodash');
var mylib = require('./lib/mylib');
var qs = require('querystring');


function API (req, res, requestVal) {
    
    // original vars
    this.method = '';
    this.endpoint = '';
    this.table = '';
	this.ts = '';
	this.debug = '';
    this.md5 = '';
	this.page = 0;
    this.args = [];
    this.file = null;
    
    this.request = null;
    
    this.req = req;
    this.res = res;
    
    this.requestVal = requestVal;
    
    this.$_GET = this.req.app.locals.$_GET;
    this.$_POST = this.req.app.locals.$_POST;
    
    
//this.__construct = function($request) {
    
    this.res.setHeader("Access-Control-Allow-Origin", "*");
    //header("Access-Control-Allow-Orgin: http://www.orleanmedia.com");
    this.res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    //header("Access-Control-Allow-Headers: X-PINGOTHER");
    this.res.setHeader("Content-Type", "text/plain"); // Set Content-Type globally for every method.
    this.res.setHeader("Access-Control-Max-Age", "1728000");
    
    // Disable caching for GET requests.
    //this.res.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
    //this.res.setHeader("Expires", "Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
    //this.res.setHeader("Pragma", "no-cache");
    

    this.args = _.trimRight(this.requestVal, '/').split('/');
    this.args.shift();
    this.$_GET['request'] = requestVal;
    
    for (var i = 0; i < this.args.length; i++) {
        this.args[i] = qs.unescape(this.args[i]);
    }
    console.log('this.args:', this.args);
    
    this.endpoint = this.args.shift();
    
    console.log('this.endpoint:', this.endpoint);
    
    if ((0 in this.args)) {
        this.table = this.args.shift();
        console.log('this.table:', this.table);
    }

    if ((0 in this.args)) {
        this.md5 = this.args.shift();
        console.log('this.md5:', this.md5);
    }
    
    if ((0 in this.args) && this.endpoint == "put") {
        this.debug = this.args.shift();
        console.log('this.debug:', this.debug);
    }
    
    if ((0 in this.args) && this.endpoint == "get") {
        this.ts = this.args.shift();
        this.ts = Number(this.ts);
        console.log('this.ts:', this.ts);
    }	
    
    if ((0 in this.args) && this.endpoint == "getlookup") {
        this.ts = this.args.shift();
        this.ts = Number(this.ts);
        console.log('this.ts:', this.ts);
    }	
    
    if ((0 in this.args) && this.endpoint == "getlookup") {
        this.page = this.args.shift();
        console.log('this.page:', this.page);
    }	
    
    if ((0 in this.args) && this.endpoint == "getlookup") {
        this.clientID = this.args.shift();
        console.log('this.clientID:', this.clientID);
    }
    
    if ((0 in this.args) && this.endpoint == "map") {
        this.page = this.args.shift();
        console.log('this.page:', this.page);
    }
    
    if ((0 in this.args) && this.endpoint == "map") {
        this.clients = this.args.shift();
        console.log('this.clients:', this.clients);
    }
    
    if ((0 in this.args) && this.endpoint == "getdata") {
        this.page = this.args.shift();
        console.log('this.page:', this.page);
    }
    
    if ((0 in this.args) && this.endpoint == "getdata") {
        this.clients = this.args.shift();
        console.log('this.clients:', this.clients);
    }
    
    if ((0 in this.args) && this.endpoint == "getdata") {
        this.lastTS = this.args.shift();
        console.log('this.lastTS:', this.lastTS);
    }
    
    if ((0 in this.args) && this.endpoint == "devput") {
        this.debug = this.args.shift();
        console.log('this.debug:', this.debug);
    }
    
    if ((0 in this.args) && this.endpoint == "devget") {
        this.debug = this.args.shift();
        console.log('this.debug:', this.debug);
    }	
    
    if ((0 in this.args) && this.endpoint == "putlocalupdates") {
        this.ts = this.args.shift();
        this.ts = Number(this.ts);
        console.log('this.ts:', this.ts);
    }	
    
    if ((0 in this.args) && this.endpoint == "getremoteupdates") {
        this.ts = this.args.shift();
        console.log('this.ts:', this.ts);
    }	
            
    this.method = this.req.method;
    console.log('this.method:', this.method);
    /*if (this.method == 'POST' && array_key_exists('HTTP_X_HTTP_METHOD', $_SERVER)) {
        if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'DELETE') {
            this.method = 'DELETE';
        } else if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'PUT') {
            this.method = 'PUT';
        } else {
            throw new Error("Unexpected Header");
        }
    }*/

    switch(this.method) {
    case 'DELETE':
    case 'POST':
        this.request = this._cleanInputs(this.$_GET);
        break;
    case 'GET':
        this.request = this._cleanInputs(this.$_GET);
        console.log('this.request:', this.request);
        break;
    case 'PUT':
        this.request = this._cleanInputs(this.$_GET);
        //*this.file = file_get_contents("php://input");
        break;
    default:
        this._response('Invalid Method', 405);
        break;
    }
//}    

}


// done
API.prototype.processAPI = function() {
    if (this.endpoint in this) {
        return this._response(this[this.endpoint](this.args));
    }
    return this._response('', 400);
};

API.prototype._response = function(data, status) {
    status = status || 200;
    //*header("HTTP/1.1 " . status + " " + this._requestStatus(status));
    //return json_encode($data);
    return data;

};

// done
API.prototype._cleanInputs = function(data) {
    var clean_input = mylib.traverseObject(data, function (n, key, thisArg) {
        return mylib.strip_tags(n).trim();      
    });
    return clean_input;
};

// done
API.prototype._requestStatus = function(code) {
    var status = {
        100: 'Continue',   
        101: 'Switching Protocols',   
        200: 'OK', 
        201: 'Created',   
        202: 'Accepted',   
        203: 'Non-Authoritative Information',   
        204: 'No Content',   
        205: 'Reset Content',   
        206: 'Partial Content',   
        300: 'Multiple Choices',   
        301: 'Moved Permanently',   
        302: 'Found',   
        303: 'See Other',   
        304: 'Not Modified',   
        305: 'Use Proxy',   
        306: '(Unused)',   
        307: 'Temporary Redirect',   
        400: 'Bad Request',   
        401: 'Unauthorized',   
        402: 'Payment Required',   
        403: 'Forbidden',   
        404: 'Not Found',   
        405: 'Method Not Allowed',   
        406: 'Not Acceptable',   
        407: 'Proxy Authentication Required',   
        408: 'Request Timeout',   
        409: 'Conflict',   
        410: 'Gone',   
        411: 'Length Required',   
        412: 'Precondition Failed',   
        413: 'Request Entity Too Large',   
        414: 'Request-URI Too Long',   
        415: 'Unsupported Media Type',   
        416: 'Requested Range Not Satisfiable',   
        417: 'Expectation Failed',   
        500: 'Internal Server Error',   
        501: 'Not Implemented',   
        502: 'Bad Gateway',   
        503: 'Service Unavailable',   
        504: 'Gateway Timeout',   
        505: 'HTTP Version Not Supported'};
    return (status[code])?status[code]:status[500]; 
};

module.exports = API;