
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
passeddata["functioName"] = "createNewEntry";
passeddata["locationOfModel"] = "./model/user";
passeddata["objectToPassIntoFunction"] = { 'username': 'zealsshah123' };
passeddata["operationsContext"] = {
    "notAllowedSameValueAddition": {
        "functioName": "findCount", "locationOfModel": "./model/user", "objectToPassIntoFunction": { "primaryKey": "username", "passParentFunctionData": true, "reAssigning": true }
    }
};
mongoService.module.mongoOperationExceution(passeddata);

let passeddata1 = {};
passeddata1["functioName"] = "findAll";
passeddata1["locationOfModel"] = "./model/user";
passeddata1["objectToPassIntoFunction"] = { "filterCondition": {} };
mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));


passeddata1["functioName"] = "updateOne";
passeddata1["locationOfModel"] = "./model/user";
passeddata1["objectToPassIntoFunction"] = { "filterCondition": { name: "zealshah1" }, "updatedata": { name: "zealshah1" } };
mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));


passeddata1["functioName"] = "updateAll";
passeddata1["locationOfModel"] = "./model/user";
passeddata1["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword1231" }, "updatedata": { password: "P@ssword1231" } };
mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));


passeddata1["functioName"] = "deleteOne";
passeddata1["locationOfModel"] = "./model/user";
passeddata1["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword1231" } };
mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));

passeddata1["functioName"] = "deleteAll";
passeddata1["locationOfModel"] = "./model/user";
passeddata1["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword1231" } };
mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));
/**
 * , "operationsContext": { "notAllowedSameValueAddition": { "functioName": "findCount", "locationOfModel": "./model/table", "objectToPassIntoFunction": { "primaryKey": "name", "passParentFunctionData": true, "reAssigning": true } } }
 */