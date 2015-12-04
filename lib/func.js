var _ = require('lodash');
var mylib = require('./mylib');
var moment = require('moment');
var errorStack = require('./errorstack');

var self = null;


function check_md5($md5) {
	return true;
}

// get records ***************************************************************************************************


function getRecords(table,TS) {
	switch (table) {
		case 'reports':
			var query = "SELECT * FROM reports WHERE TS > '" + TS + "' AND endDate IS NOT NULL AND active=1";
			break;
		case 'activities':
			query = "SELECT * FROM activities WHERE fdaID IN (SELECT fdaID FROM reports WHERE TS > '" + TS + "' AND endDate IS NOT NULL AND active=1) AND active=1";
			break;
		default:
			query = "SELECT * FROM " + table + " WHERE TS > '" + TS + "';";
			break;
	}
	return query;
}

function getDataQuery(ID,table,page,clients,lastUpdate) {
    clients = clients || "";
    lastUpdate = lastUpdate || '1970-01-01 01:00:00';
    //var servLimit = date('Y-m-d H:i:s',time() - 30 * 24 * 60 * 60);
    var servLimit = moment(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).format(mylib.time.DATETIME);
    if (table == "reports_sbs")
        var query = "SELECT * FROM " + table + " WHERE servDate >= '" + servLimit + "' AND TS > '" + lastUpdate + "' AND clientID IN (" + clients + ") ORDER BY TS ASC LIMIT " + (page*50) + ",50;";
    else if (table == "activities_sbs")
        query = "SELECT a.* FROM " + table + " a LEFT JOIN reports_sbs r ON a.fdaID = r.fdaID WHERE r.servDate >= '" + servLimit + "' AND a.TS > '" + lastUpdate + "' AND clientID IN (" + clients + ") ORDER BY a.TS ASC LIMIT " + (page*50) + ",50;";
    else if (table == "report_servicelines")
        query = "SELECT * FROM " + table + " WHERE TS > '" + lastUpdate + "' AND joJn IN (SELECT joJn FROM reports_sbs WHERE clientID IN (" + clients + ")) ORDER BY TS ASC LIMIT " + (page*50) + ",50;";
    else if (table == "activity_servicelines")
        query = "SELECT * FROM " + table + " WHERE TS > '" + lastUpdate + "' AND actID IN (SELECT actID FROM activities_sbs INNER JOIN reports_sbs USING(fdaID) WHERE servDate >= '" + servLimit + "' AND clientID IN (" + clients + ")) ORDER BY TS ASC LIMIT " + (page*50) + ",50;";
    else if (table == "eq_servicelines")
        query = "SELECT * FROM " + table + " WHERE TS > '" + lastUpdate + "' AND activityServiceLineID IN (SELECT activityServiceLineID FROM activity_servicelines INNER JOIN activities_sbs USING(actID) INNER JOIN reports_sbs USING(fdaID) WHERE servDate >= '" + servLimit + "' AND clientID IN (" + clients + ")) ORDER BY TS ASC LIMIT " + (page*50) + ",50;";
    else query = "SELECT * FROM " + table + " WHERE TS > '" + lastUpdate + "' ORDER BY TS ASC LIMIT " + (page*50) + ",50;";
	return query;
}

function safeEncode(str) {
	if (str == null) {return null;}
    if (typeof str !== 'string') {return str;}
    str = str.replace(/'/g, "#039;");
    str = str.replace(/&/g, '#038;');
    str = str.replace(/"/g, '#034;');
    str = str.replace(/\\/g, '#092;');
    return str;
}


function safeDecode(str) {
    if (str == null) {return null;}
    if (typeof str !== 'string') {return str;}
    str = str.replace(/#039;/g, "'");
    str = str.replace(/#038;/g, '&');
    str = str.replace(/#034;/g, '"');
    str = str.replace(/#092;/g, '\\');
    return str;
}

function checkTableName(tableName) {
	//removed "activities" and "pics"
	var tableArray = ["reports","clients","bases","repTypes", "suppliers", "custProjs","ccc", "cargo", "users", "eqTypes", "tpsp","projs","locations","actTypes","cargoStatus","suppliers","containers","vessels","origDest","entities","ActivityValue"];
	if (mylib.in_array(tableName, tableArray)) return true; else return false;
}

function get_db_data(what, table, where,conn) {
    return new Promise(function(resolve, reject) {                            

        if (where == null) {
            where = 1;
        }
        var query  = "SELECT " + what + " FROM " + table + "	WHERE " + where;
        //console.log(query);
        console.log('get_db_data');
        conn.queryValuePromise(query)
            .then(function(rows) {
                console.log('rows', rows);
                resolve(rows);
            },
            function(rows) {
                console.log(rows);
            })
    });        
}

function valueToString(value) {
	var typestr = typeof value;
	if (typestr == "number") return value + "";
    if (typestr == "boolean") return (value) ? '1' : '';
	if (mylib.is_null(value)) return "NULL";
	if (mylib.strtoupper(value) == "NULL") return "NULL";
	if (value == "0001-01-01 00:00:00" || value == "0000-00-00 00:00:00" || value == "0001-01-01T00:00:00Z" || value == "0000-00-00T00:00:00Z") return "NULL";
	if (typestr != "number") return "'" + value + "'";
	return value;
}

//fetches a record and converts it to array 

function sql2array(conn,key,value,table) {
    
    return new Promise(function(resolve, reject) {  
                                  
        var query  = "SELECT * FROM " + table + " WHERE " + key + " = '" + value + "'";
        //console.log(query);
        console.log('sql2array');
        conn.queryRowPromise(query)
            .then(function(rows) {
                //console.log('rows', rows);
                var resultRow = rows;
                if (!resultRow) {
                    resultRow = null;
                }
                resolve(resultRow);
            },
            function(rows) {
                console.log(rows);
            })
    }); 
    
}

function keepField(field) {
        var keys = [
                'fdaID',
                'actID',
                'picID',
                'axID',
                'actAXID',
                'toRev',
                'TS',
		// campi per SBS
                'reportServiceLineID',
                'activityServiceLineID',
                'eqServiceLineID',
                //'AssistID', // for consistency
                'CallID',
                'BookingID',
                'SisMasterAssistID'
        ];
	if (mylib.in_array (field, keys) || field.substr(field, field.length-2, 2) == "TS") return false;
	else return true;
}

function convertValueType(first, second) {
    var firstType = typeof first;
    
    switch(firstType) {
        case 'string':
            return (second != null) ? String(second) : '';
            break;
        case 'number':
            return (second != null) ? Number(second) : 0;
            break;
        case 'boolean':
            return (second != null) ? Boolean(second) : false;
            break;    
        }
        return second;
}

function newValue(key,newArray,oldArray) {
    var newVal = newArray[key + "TS"];
    var oldVal = oldArray[key + "TS"];
    
    oldVal = convertValueType(newVal, oldVal);
    
    var newValClean = (typeof newVal === 'string') ? newVal.replace(/\D+/g, '') : newVal;
    var oldValClean = (typeof oldVal === 'string') ? oldVal.replace(/\D+/g, '') : oldVal;
            
    if (mylib.isset(newArray[key + "TS"]) && newValClean > oldValClean) return true;
	else return false;
}

//insert array

function insertArray(conn,jsonArray,table) {
	var separator = "";
	var labels = "";
	var values = "";
    
	//foreach (jsonArray as key => value) {
    var keys = Object.keys(jsonArray);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = jsonArray[key];
            
		labels +=  separator + key;
		values +=  separator + valueToString(value);
   		//if (mylib.is_null(value) || mylib.strtoupper(value) == "NULL") values +=  separator + "NULL";
		//else values +=  separator + "\"" + value + "\"";
   		separator = ",";
	}
	return conn.queryPromise("INSERT INTO " + table + " (" + labels + ") VALUES (" + values + ");");
	//if (conn.error) return conn.error; else return "";
}

function updateArray(conn,key,value,jsonArray,oldRec,table) {
	var separator = "";
	var couples = "";
	var where = key + "=" + valueToString(value);
	//if (value == "0001-01-01 00:00:00" || value == "0000-00-00 00:00:00") where = key + "=NULL";
	//else where = key + "=\"" + value + "\"";
	var keys = Object.keys(jsonArray);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = jsonArray[key];
		// necessario per la sincronia delle attivita' spostate da un report all'altro (fdaID non ha TS)
		if (table == 'activities_sbs' && key == 'fdaID') {
			couples +=  separator + key + "=" + valueToString(value);
  			separator = ",";
		}
		else if (keepField(key) && newValue(key,jsonArray,oldRec)) {
			//couples +=  separator + key + "=\"" + value + "\"";
			couples +=  separator + key + "=" + valueToString(value);
  			separator = ",";
			couples +=  separator + key + "TS=\"" + jsonArray[key + "TS"] + "\"";
		}
	}
	if (couples) return conn.queryPromise("UPDATE " + table + " SET " + couples + " WHERE " + where + ";");
    else return Promise.resolve(0);
    //else return "";
    //if (conn.error) return conn.error; else return "";
	/*if (conn.error) {
		error_log('Error in updateArray for table ' + table + ': ' + conn.error);
		error_log("UPDATE " + table + " SET " + couples + " WHERE " + where + ";");
	}*/
}

/*function getLookupRecords(table,TS,page,clientID) {

    // in futuro rimuovere fdaexxonviewer che era un vecchio errore (ora fdaviewer)
    if (table == 'datacenterUsers') {
        var query = "SELECT * FROM datacenterUsers WHERE ( userRoles LIKE '%fdatallyclerk%' OR userRoles LIKE '%fdasupervisor%' OR userRoles LIKE '%fdabasesuperintendent%' OR userRoles LIKE '%fdabaseclient%' OR userRoles LIKE '%fdaexxonviewer%' OR userRoles LIKE '%fdaviewer%' OR userRoles LIKE '%fdasuperadmin%' ) AND TS > '" + TS + "' OR TS IS NULL LIMIT " + (page*100) + ",100";
    }
	else if (!mylib.empty(clientID))
        query = "SELECT * FROM " + table + " WHERE clientID IN (" + clientID + ") AND TS > '" + TS + "' OR TS IS NULL LIMIT " + (page*100) + ",100";
	else
		query = "SELECT * FROM " + table + " WHERE TS > '" + TS + "' OR TS IS NULL LIMIT " + (page*100) + ",100";
	return query;
}*/

function getLookupRecords(table,TS,page,clientID) {

    // in futuro rimuovere fdaexxonviewer che era un vecchio errore (ora fdaviewer)
    if (table == 'datacenterUsers') {
        var query = "SELECT * FROM datacenterUsers WHERE ( userRoles LIKE '%sbstallyclerk%' OR userRoles LIKE '%sbssupervisor%' OR userRoles LIKE '%sbsbasesuperintendent%' OR userRoles LIKE '%sbsbaseclient%' OR userRoles LIKE '%sbsexxonviewer%' OR userRoles LIKE '%sbsviewer%' OR userRoles LIKE '%sbssuperadmin%' ) AND TS > '" + TS + "' OR TS IS NULL LIMIT " + (page*100) + ",100";
    }
	else if (!mylib.empty(clientID))
        query = "SELECT * FROM " + table + " WHERE clientID IN (" + clientID + ") AND TS > '" + TS + "' OR TS IS NULL LIMIT " + (page*100) + ",100";
	else
		query = "SELECT * FROM " + table + " WHERE TS > '" + TS + "' OR TS IS NULL LIMIT " + (page*100) + ",100";
	return query;
}


self = {
    check_md5: check_md5,
    getRecords: getRecords,
    safeDecode: safeDecode,
    safeEncode: safeEncode,
    checkTableName: checkTableName,
    valueToString: valueToString,
    sql2array: sql2array,
    insertArray: insertArray,
    updateArray: updateArray,
    getDataQuery: getDataQuery,
    getLookupRecords: getLookupRecords,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
    //getDataQuery: getDataQuery,
};


module.exports = self;