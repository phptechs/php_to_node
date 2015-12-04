var msgArr = [];
var errorsArr = [];
var autoHandler = null;
var shouldCallAutoResolve = false;
var debugMode = false;

function addMessage(msg) {
    if (!debugMode) return false;
    if (msgArr.length >= 50) {
        msgArr.shift();
    }
    msgArr.push(msg);
}

function addError(err) {
    if (errorsArr.length >= 50) {
        errorsArr.shift();
    }
    errorsArr.push(err);
}

function getMessageStack() {
    if (!debugMode) return '';
    var tMsgArr = msgArr;
    msgArr = [];
    
    return '\n-----------------------------------------\nDebug info:\n\n\n' + tMsgArr.join("\n\n") + '\n\n\nEnd of Debug info.\n-----------------------------------------\n';
}

function getErrorStack() {
    var tErrorsArr = errorsArr;
    errorsArr = [];
    return (tErrorsArr.length) ? '\n-----------------------------------------\nError info:\n\n\n' + tErrorsArr.join("\n\n") + '\n\n\nEnd of Error info.\n-----------------------------------------\n' : '';
}

function setAutoResolve(resolve, delayTime) {
    delayTime = delayTime || 3;
    shouldCallAutoResolve = true;
    autoHandler = setTimeout(function() {
        if (shouldCallAutoResolve) {
            //console.log('Auto resolve:');
            resolve('Auto resolve:\n\n' + getErrorStack());
            shouldCallAutoResolve = false;
        }
    }, delayTime * 1000);
}

function clearAutoResolve() {
    //console.log('clearAutoResolve');
    clearTimeout(autoHandler);
    autoHandler = null;
}

function enableDebugMode() {
    debugMode = true;
}

function disableDebugMode() {
    debugMode = true;
}



module.exports = {
    setAutoResolve: setAutoResolve,
    clearAutoResolve: clearAutoResolve,
    addMessage: addMessage,
    addError: addError,
    getMessageStack: getMessageStack,
    getErrorStack: getErrorStack,
    enableDebugMode: enableDebugMode,
    disableDebugMode: disableDebugMode
};