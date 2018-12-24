const utility = require('./../utility/utilityService');
const config = require('./config');
const requireEmitter = require('./../event/eventService');
const debug = require('./../debug/debugService').debugConsole(__dirname, __filename);

/**
 * @description it will call event binding create function of require in file.
 */
requireEmitter.requireEvent.onRequire();


/**
 * @method convertToOriginalPath
 * @param  {string} path file path.
 * @return {string} returns original path of passed relative path.
 * @description it will convert relative path in to original path so we can use for any purpose.
 */
exports.convertToOriginalPath = (path) => {
    let pathModule = require('path');
    // require('./../event/eventService');
    let originalPath = pathModule.join(pathModule.resolve('./config_jsons'), path);
    return originalPath;
}

/**
 * @method findVariableAvaiableInConfiguration
 * @param  {string} keyName String of value which you need to find from configuration file.
 * @returns {any} it will send original value fetched from config file.
 * @description It is used for fetching configured value from configuration file for different enviroment. 
 */
exports.findVariableAvaiableInConfiguration = (keyName) => {
    let originalPath = config.findPathOfConfigFile();
    let originalfullPath = config.convertToOriginalPath(originalPath);
    let readJson = config.readJsonFile(originalfullPath);
    debug(`We read this file from this location ${originalPath}`);
    return readJson[keyName];
}


/**
 * @method readJsonFile
 * @param  {string} filePath it will read data from file path 
 * @returns {data} it will return data of that json file.
 * @description it will give data and also uncached json file and it will call require event.
 */
exports.readJsonFile = (filePath) => {
    requireEmitter.requireEvent.emitRequire(filePath);
    debug("require event call");
    return require(filePath);
}

/**
 * @method findPathOfConfigFile
 * @param {string} filepath fileName .
 * @returns {string} it will return file location.
 * @description It is used for fetching configuration file based on node_env
 */
exports.findPathOfConfigFile = () => {
    let enviromentAvaiable = config.currentEnviromentFind();
    fileLocationPath = require('./currentRunningEnviroment.json')[enviromentAvaiable];
    return fileLocationPath;
}


/**
 * @method currentEnviromentFind
 * @returns {string} it will return node enviroment.
 * @description return node enviroment.
 */
exports.currentEnviromentFind = () => {
    nodeEnviroment = utility.checkValueShouldBeInArray(process.env.NODE_ENV, "notUndefindedandnotNull") ? process.env.NODE_ENV : "dev";
    return nodeEnviroment;
}