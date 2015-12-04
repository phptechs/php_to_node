var mysql = require('mysql');
var errorStack = require('./errorstack');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'active',
    dateStrings: true,
    //typeCast: false,
    supportBigNumbers: true,
    bigNumberStrings: true
});

var mysqlUtilities = require('./mysql-utilities');
mysqlUtilities.upgrade(connection);
mysqlUtilities.introspection(connection);
    
connection.queryPromise = function (query, values) {
    /*query, [],
        function(err, rows) {}*/
    //console.log('queryPromise');
    values = values || [];
        
    return new Promise(function(resolve, reject) { 
        
        errorStack.addMessage('\nQuery: ' + query);
        
        connection.query(
            query, values, function (err, rows) {
                
                if (!err) {
                    resolve(rows);
                }
                else {
                    errorStack.addError(err + '\nQuery: ' + query);
                    reject(err);
                }
                //!err ? resolve({query: query}) : reject({err: err, query: query});
            }
        );  
    });
};

connection.queryRowPromise = function (query, values) {
    /*query, [],
        function(err, rows) {}*/
    //console.log('queryRowPromise');
    values = values || [];
        
    return new Promise(function(resolve, reject) {
        
        errorStack.addMessage('\nQuery: ' + query);
                
        connection.queryRow(
            query, values, function (err, rows) {
                if (!err) {
                    resolve(rows);
                }
                else {
                    errorStack.addError(err + '\nQuery: ' + query);
                    reject(err);
                }
            }
        );  
    });
};

connection.queryValuePromise = function (query, values) {
    /*query, [],
        function(err, rows) {}*/
    //console.log('queryValuePromise');
    values = values || [];
        
    return new Promise(function(resolve, reject) {
        
        errorStack.addMessage('\nQuery: ' + query);
                
        connection.queryValue(
            query, values, function (err, rows) {
                if (!err) {
                    resolve(rows);
                }
                else {
                    errorStack.addError(err + '\nQuery: ' + query);
                    reject(err);
                }
            }
        );
    });
};



connection.connect();

//connection.end();


module.exports = connection;