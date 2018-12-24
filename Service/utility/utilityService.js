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
            if (notNull.indexOf(value) != -1) {
                valueFollowedCondition = true;
            }
            break;
        case "notUndefind":
            if (notUndefinded.indexOf(value) != -1) {
                valueFollowedCondition = true;
            }
            break;
        case "notUndefindedandnotNull":
            if (utility.checkValueShouldBeInArray(value, "notNull") && utility.checkValueShouldBeInArray(value, "notUndefind")) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyString":
            if (notEmptyString.indexOf(value) != -1) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyObject":
            if (typeof (notEmptyObject) === typeof (value)) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyStringandnotEmptyObject":
            if (utility.checkValueShouldBeInArray(value, "notEmptyString") && utility.checkValueShouldBeInArray(value, "notEmptyObject")) {
                valueFollowedCondition = true;
            }
            break;
        case "notEmptyArray":
            if (value.length>0) {
                valueFollowedCondition = true;
            }
            break;
    }
    return valueFollowedCondition;
};
