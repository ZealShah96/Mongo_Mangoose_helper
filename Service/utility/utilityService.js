let checkValueShouldBeInArray = require('./utilityService').checkValueShouldBeInArray;
let utility = require('./utilityService');
const debug = require('./../debug/debugService').debugConsole(__dirname, __filename);
const notNull = [null];
const notUndefinded = [undefined];
const notEmptyString = [""];
const notEmptyObject = {};



/**
 * @method checkValueShouldBeInArray
 * @param {any} value value to be passed to check 
 * @param {string} condition condition in string format to check that value is it or not.
 * @returns {boolean} value is following that condition or not.(true or false)
 */
exports.checkValueShouldBeInArray = function (value, condition) {
    var valueFollowedCondition = false;
    debug("called.....!!!!!");
    switch (condition) {
        case "notNull":
            if (notNull.indexOf(value) == -1) {
                valueFollowedCondition = true;
            }
            break;
        case "notUndefind":
            if (notUndefinded.indexOf(value) == -1) {
                valueFollowedCondition = true;
            }
            break;
        case "notUndefindedandnotNull":
            if (utility.checkValueShouldBeInArray(value, "notNull") && utility.checkValueShouldBeInArray(value, "notUndefind")) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyString":
            if (notEmptyString.indexOf(value) == -1) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyObject":
            if (JSON.stringify(notEmptyObject) != JSON.stringify(value)) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyStringandnotEmptyObject":
            if (utility.checkValueShouldBeInArray(value, "notEmptyString") && utility.checkValueShouldBeInArray(value, "notEmptyObject")) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyArray":
            if (value.length > 0) {
                valueFollowedCondition = true;
            }
            break;
    }
    return valueFollowedCondition;
};



/**
 * @description it will return headers required fields from req perameters
 */
exports.findRequiredFieldsFromHeaders = async (req, defaultValues) => {
    let headersRequiredFields = [];
    try {
        headersRequiredFields = req.headers.requiredfields.split(',');
    }
    catch (err) {
        debug("we passed empty arrray so we can fetched default fields.")
    }
    let requiredFields = utility.checkValueShouldBeInArray(headersRequiredFields, "notEmptyArray")
        && utility.checkValueShouldBeInArray(headersRequiredFields, "notUndefindedandnotNull")
        ? headersRequiredFields
        : defaultValues;
    return requiredFields;
}



/**
 * @description it will return response to request.
 */
exports.response = async (res, response) => {
    let finalResponse = {};
    res.status(response.statusCode);
    delete response.statusCode;
    Object.keys(response).forEach(element => {
        if (utility.checkValueShouldBeInArray(response[element], "notUndefindedandnotNull") && utility.checkValueShouldBeInArray(response[element], "notEmptyStringandnotEmptyObject")) {
            finalResponse[element] = response[element];
        }
    });
    res.send(finalResponse);
}

/**
 * @description it will return formatted response back. 
 */
exports.createResponseOnPassedDataOnSuccess = async (statusCode, err, data, message) => {
    if (err != null) {
        data = null;
        if (statusCode != 401) {
            message = err.message;
        }
        err = err.stack;
    }
    return { "statusCode": statusCode, "err": err, "data": data, "message": message };
}


/**
 * @description matching 2 objects.
 */

exports.matchObject = (inputObject, outputObject) => {
    let matched = true;
    Object.keys(outputObject).forEach(prop => {
        debug("property will check:" + prop);
        if (JSON.stringify(inputObject[prop]) != JSON.stringify(outputObject[prop])) {
            debug(`${inputObject[prop]} is not matching to ${outputObject[prop]}`)
            matched = false;
        }
    });
    return matched;
}
