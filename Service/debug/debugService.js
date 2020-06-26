var fetchCurrentFileName = (dirPath, filePath) => {
    // console.log(filePath.slice(dirPath.length + 1, -3));
    return (filePath.slice(dirPath.length + 1, -3)).toString();
}

var appendExtraSpaceToShowAlignedLog = (value, maxlength) => {
    //     let diffBetweenLength=value.toString().length-maxlength;
    //     if(diffBetweenLength>0){
    // value=value.toString().pad
    //     }
    value = value.padEnd(15, ' ');
    return value;
}

exports.debugConsole = (dirPath, filepath) => {
    let fileName = fetchCurrentFileName(dirPath, filepath);
    //  console.log(`${fileName} file's Debug workspace is configured with name ${fileName}`);
    //fileName = appendExtraSpaceToShowAlignedLog(fileName, 50);
    attachedDebug = require('debug')(`${fileName}`);
    attachedDebug(`${fileName} file's Debug workspace is configured with name ${fileName}`);
    return attachedDebug;
}

exports.fetchCurrentFileName = (dirPath, filePath) => {
    return fetchCurrentFileName(dirPath, filePath).toString();
}



const debug = require('./../debug/debugService').debugConsole(__dirname, __filename);
debug(`${fetchCurrentFileName(__dirname, __filename)} is intialized.`);


