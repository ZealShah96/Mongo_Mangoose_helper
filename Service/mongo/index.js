
/**Intialization of most common used package. */
let fs = require('fs');
let path = require('path');
let mongoService = require(path.resolve('./Service/mongo/mongoService'));

/**Mongo Connection Model */


/**Intialization of database table file folder. */
let configPerameterfetch = require(path.resolve('./service/config')).findConfigPerameter;
configPerameterfetch("models").then((value) => {
    value.forEach((passeddataElement, index, array) => {
        let passeddata = {};
        passeddata["functioName"] = "createNewEntry";
        passeddata["locationOfModel"] = "./model/table";
        passeddata["objectToPassIntoFunction"] = passeddataElement;
        passeddata["operationsContext"] = {
            "notAllowedSameValueAddition": {
                "functioName": "findCount", "locationOfModel": "./model/table", "objectToPassIntoFunction": { "primaryKey": "name", "passParentFunctionData": true, "reAssigning": true }
            }
        };
        mongoService.module.mongoOperationExceution(passeddata);
    });
});
let passeddata = {};
passeddata["functioName"] = "findAll";
passeddata["locationOfModel"] = "./model/table";
passeddata["objectToPassIntoFunction"] = { "filterCondition": { 'name': 'table' } };
mongoService.module.mongoOperationExceution(passeddata);


/**
 * , "operationsContext": { "notAllowedSameValueAddition": { "functioName": "findCount", "locationOfModel": "./model/table", "objectToPassIntoFunction": { "primaryKey": "name", "passParentFunctionData": true, "reAssigning": true } } }
 */