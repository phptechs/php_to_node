var util = require('util');
var _ = require('lodash');
var moment = require('moment');
var conn = require('./lib/mymysql');
var mylib = require('./lib/mylib');
var func = require('./lib/func');
var errorStack = require('./lib/errorstack');
var co = require('co');


// load base class
var API = require('./API');

function FDAAPI (req, res, requestVal) {   
    FDAAPI.super_.call(this, req, res, requestVal);
    
    this.allowed_tables = [
            "reports_sbs",
            "reports_reopen_sbs",
            "activities_sbs",
            "pics_sbs",
            "report_servicelines",
            "activity_servicelines",
            "eq_servicelines"
    ];
    
    this.User = requestVal;
}

util.inherits(FDAAPI, API);


// done
FDAAPI.prototype.processAPI = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        
        if (self.endpoint in self) {
            
            errorStack.setAutoResolve(resolve, 3);
            
            self[self.endpoint](self.args)
                .then(function(result) {
                    var msgStack = errorStack.getMessageStack();
                    resolve(msgStack + self._response(result));
                    errorStack.clearAutoResolve();
                },
                function(e) {
                    resolve('Error: ' + e.message);
                });
        }
        else {
            //return self._response('', 400); 
            resolve('result=ERROR no method ' + self.endpoint);
        }
    });
    
};

FDAAPI.prototype._response = function(data, status) {
    status = status || 200;
    //*header("HTTP/1.1 " . $status . " " . this._requestStatus($status));
    //return json_encode($data);
    return data;
};


FDAAPI.prototype.getdata = function() {
    console.log('\ngetdata method');
    var self = this;
    return co(function*() {
        
        if (!mylib.isset(self.md5) || !mylib.isset(self.md5) || !mylib.isset(self.clients) || !mylib.isset(self.lastTS) || !mylib.isset(self.table)) return '{"result":"ERROR"}';
		if (!mylib.in_array (self.table, self.allowed_tables)) return '{"result":"ERROR"}';
        
        var ID = '';
        switch (self.table) {
            case 'reports_sbs':
            case 'reports_reopen_sbs':
                ID = "fdaID";
                break;
            case 'activities_sbs':
                ID = "actID";
                break;
            case 'pics_sbs':
                ID = "picID";
                break;
            case 'report_servicelines':
                ID = "reportServiceLineID";
                break;
            case 'activity_servicelines':
                ID = "activityServiceLineID";
                break;
            case 'eq_servicelines':
                ID = "eqServiceLineID";
                break;
        }
        //date_default_timezone_set('Africa/Lagos');
		var getQuery = func.getDataQuery(ID,self.table,self.page,self.clients,self.lastTS);
		//var result = yield conn.queryPromise(getQuery);
		//var resultRows = "";
		var separator = "";
        
		var rows = yield conn.queryPromise(getQuery);
            var numRows = rows.length;
            var tArr = [];
            
            rows.forEach(function(resultRow) {
                resultRow = mylib.numToStr(resultRow);
                tArr.push(JSON.stringify(resultRow));
            });
            
            var resultRows = tArr.join(',');
            
            if (numRows) {
                return "[" + resultRows + "]";
            }    
            else {
                return "[]";
            }
    
    });   
        
};


FDAAPI.prototype.getlookup = function() {
    console.log('\ngetlookup method');
    var self = this;
    return co(function*() {
        
        // TS check
     	//if (!mylib.empty(self.ts) && !mylib.is_numeric(self.ts)) return "result=ERROR";
		// method and MD5 check
        if (!(self.method == 'GET' && func.check_md5(self.md5))) return "result=ERROR";
		// tables check
		//if (self.table != "clients" && self.table != "clients") return "result=ERROR";
		
		//date_default_timezone_set('Africa/Lagos');
		if (mylib.empty(self.clientID)) self.clientID = null;
		//if (self.ts) lastTS = date('Y-m-d H:i:s',self.ts);
		//else lastTS = "1970-01-01 01:00:00";        
        var lastTS = (self.ts) ? moment(new Date(self.ts * 1000).getTime()).format(mylib.time.DATETIME) : "1970-01-01 01:00:00";
        
		var lookupRecords = func.getLookupRecords(self.table,lastTS,self.page,self.clientID);
		//var result = yield conn.queryPromise(lookupRecords);
		//var resultRows = "";
		var separator = "";
        
		var rows = yield conn.queryPromise(lookupRecords);
        var numRows = rows.length;
        var tArr = [];
        
        rows.forEach(function(resultRow) {
            resultRow = mylib.numToStr(resultRow);
            tArr.push(JSON.stringify(resultRow));
        });
        
        var resultRows = tArr.join(',');
        
        if (numRows) {
            return "[" + resultRows + "]";
        }    
        else {
            return "[]";
        }
    
    });  
};


FDAAPI.prototype.send_info = function() {
    console.log('\nsend_info method');
    var self = this;
    return co(function*() {
        
        //var json_data = JSON.parse(self.$_POST["data"]);
        // ricavo le informazioni già presenti
		var result = yield conn.queryRowPromise("SELECT * FROM devices WHERE deviceID = '" + self.$_POST["uuid"] + "'");
		//if (conn.error) {
        if (false) {    
			//error_log(conn.error);
		} else if (result) {
			var res = result;
			var apps = JSON.parse(res['apps']);
			if (!apps) {
				apps = {};
			}
            
			apps[self.$_POST['appID']] = {
				'cordova'   : ('cordova' in self.$_POST) ? self.$_POST['cordova'] : null,
				'swID'      : ('swID' in self.$_POST) ? self.$_POST['swID'] : null,
				'swVersion' : ('swVersion' in self.$_POST) ? self.$_POST['swVersion'] : null
            };
            
            //return JSON.stringify(apps, null, 4);
            
			yield conn.queryPromise ("UPDATE devices SET "
				 + "model    = '" + self.$_POST['model'] + "', "
				 + "platform = '" + self.$_POST['platform'] + "', "
				 + "apps     = '" + JSON.stringify(apps) + "' "
				 + "WHERE deviceID = '" + self.$_POST["uuid"] + "'");
			/*if (conn.error) {
				error_log('errore nell\'update delle app info');
				error_log(conn.error);
			}*/
		}

		return '{"result":"OK"}';
    
    });
}


FDAAPI.prototype.send_activities = function() {
    console.log('\nsend_activities method');
    var self = this;
    self.res.setHeader("Content-Type", "application/json");
    return co(function*() {

        //var json_data = JSON.parse(self.$_POST["data"]);
        // check dati in arrivo
		if (!Array.isArray (self.$_POST['ids'])) return "result=ERROR";

		//var response = {'0': [], '1': []};
        var response = [[], []];
        var query = 'CALL Activities_FromPCC_ToSBS("' + self.$_POST['ids'].join (';') + '", 0);';
        //return query;
		var result = yield conn.queryPromise (query);
		//if (conn.error) {
        if (false) {
			//error_log('errore nel send delle activity al PCC');
			//error_log(conn.error);
		} else {
            _.forEach(result[0], function(row, key) {
                if (!Array.isArray(response[row['closed']])) {
                    response[row['closed']] = [];
                }
			    response[row['closed']].push(row['joJn']);	
			});
		}

		return JSON.stringify (response);
    
    });
}


FDAAPI.prototype.putlocalupdates = function() {    
    console.log('\nputlocalupdates method');
    var self = this;	
	return co(function*() {        
        
        if (!mylib.in_array (self.table, self.allowed_tables)) return "result=ERROR";
		
    	//echo "data=" + _POST["data"] + "<br/>";
		//dataLog(self.conn,_POST["data"]);
    	//json_data = json_decode(_POST["data"],true);
        var json_data = JSON.parse(self.$_POST["data"]);
        //json_data = mylib.nullToEmpty(json_data);
		//metaQuery = updateMeta('getTS_' + self.table,date('Y-m-d H:i:s'));
		//result = self.conn.query(metaQuery);
        var ret = "";
        var keys = Object.keys(json_data);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var jsonArray = json_data[key];
            var pic = '';
            key = '';
            
			switch (self.table) {
				case 'reports_sbs':
				case 'reports_reopen_sbs':
					key = "fdaID";
					break;
				case 'activities_sbs':
					key = "actID";
					break;
				case 'pics_sbs':
					key = "picID";
					pic = jsonArray["pic"];
					jsonArray["pic"] = mylib.str_replace(' ', '+', pic);
					var picThumb = jsonArray["picThumb"];
					jsonArray["picThumb"] = mylib.str_replace(' ', '+', picThumb);
					break;
				case 'report_servicelines':
					key = "reportServiceLineID";
					break;
				case 'activity_servicelines':
					key = "activityServiceLineID";
					break;
				case 'eq_servicelines':
					key = "eqServiceLineID";
					break;
			}
            
            var value = jsonArray[key];
			var oldRec = yield func.sql2array(conn,key,value,self.table);
			if (mylib.is_null(oldRec))
				yield func.insertArray(conn,jsonArray,self.table);
			else
				yield func.updateArray(conn,key,value,jsonArray,oldRec,self.table);
                
		}
        //if (ret == "")
        //else return '{"result":"ERROR"}';
            return '{"result":"OK"}';
    
    });
};

module.exports = FDAAPI;