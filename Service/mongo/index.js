
/**Intialization of most common used package. */
let fs = require('fs');
let path = require('path');
let mongoService = require(path.resolve('./Service/mongo/mongoService'));
let guid = require('guid');

/**Mongo Connection Model */

let PromiseArray = [];
let listOfPassingData = [];
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
        listOfPassingData.push(passeddata);
      
    });
    
let passeddata = {};
passeddata["functioName"] = "createNewEntry";
passeddata["locationOfModel"] = "./model/user";
passeddata["objectToPassIntoFunction"] = { 'username': `zealsshah${guid.create()}` };
passeddata["operationsContext"] = {
    "notAllowedSameValueAddition": {
        "functioName": "findCount", "locationOfModel": "./model/user", "objectToPassIntoFunction": { "primaryKey": "username", "passParentFunctionData": true, "reAssigning": true, "onlyIncludeDeleted": true }
    }
};
listOfPassingData.push(passeddata);
// PromiseArray.push(Promise.resolve(mongoService.module.mongoOperationExceution(passeddata)));
// Promise.all(PromiseArray).then(res => {
//     console.log(res);
// });
// .catch((e) => {
//     console.log(e); 
//  });

let passeddata1 = {};
passeddata1["functioName"] = "findAll";
passeddata1["locationOfModel"] = "./model/user";
passeddata1["objectToPassIntoFunction"] = { "filterCondition": {} };
// mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${JSON.stringify(val)}`)).catch((e) => {
//     console.log(e);
// });
listOfPassingData.push(passeddata1);


let passeddata2 = {};
passeddata2["functioName"] = "updateOne";
passeddata2["locationOfModel"] = "./model/user";
passeddata2["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword123" }, "updatedata": { password: "P@ssword1231" } };
// mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`)).catch((e) => {
//     console.log(e);
// });;
//listOfPassingData.push(passeddata2);
let passeddata3 = {};
passeddata3["functioName"] = "updateAll";
passeddata3["locationOfModel"] = "./model/user";
passeddata3["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword123" }, "updatedata": { password: "P@ssword122" } };
// mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`)).catch((e) => {
//     console.log(e);
// });;
listOfPassingData.push(passeddata3);
let passeddata4 = {};
passeddata4["functioName"] = "deleteOne";
passeddata4["locationOfModel"] = "./model/user";
passeddata4["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword122" } };
// mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`)).catch((e) => {
//     console.log(e);
// });;
listOfPassingData.push(passeddata4);
    executeAllOperation(listOfPassingData);
});

// console.log(listOfPassingData);


function executeAllOperation(listOfPassingData) {
    listOfPassingData.forEach(element => {
        PromiseArray.push(new Promise((resolve, reject) => {
            mongoService.module.mongoOperationExceution(element).then(res => {
                resolve(res);
            }).catch(e=>{
                console.log(e);
                reject(e);
            })
        }));
    });

    Promise.all(PromiseArray).then(res => {
        console.log("hjvnnvnbvnbv"+res);
    }).catch((e) => {
        console.log(e);
    });
}




// passeddata1["functioName"] = "deleteAll";
// passeddata1["locationOfModel"] = "./model/user";
// passeddata1["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword1231" } };
// mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));
/**
 * , "operationsContext": { "notAllowedSameValueAddition": { "functioName": "findCount", "locationOfModel": "./model/table", "objectToPassIntoFunction": { "primaryKey": "name", "passParentFunctionData": true, "reAssigning": true } } }
 */