
/**Intialization of most common used package. */
let fs = require('fs');
let path = require('path');
let mongoService = require('./mongoService');
let guid = require('guid');
let blueBird = require("bluebird");
let _=require("lodash");
let assert=require("assert");
/**Mongo Connection Model */

let PromiseArray = [];
let listOfPassingData = [];
/**Intialization of database table file folder. */
let config = require("./../config/index").module;
let configPerameterfetch = config.findConfigPerameter;
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
      //  listOfPassingData.push(passeddata);
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
   // listOfPassingData.push(passeddata);
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
 //   listOfPassingData.push(passeddata1);


    let passeddata2 = {};
    passeddata2["functioName"] = "updateOne";
    passeddata2["locationOfModel"] = "./model/user";
    passeddata2["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword123" }, "updatedata": { password: "P@ssword1231" } };
    passeddata2["operationsContext"] = {
        "findValuesBeforeUpdate": {
            "functioName": "findAll", "locationOfModel": "./model/user", "objectToPassIntoFunction": { "filterCondition": { password: "P@ssword123" } }
        }
    };
    // mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`)).catch((e) => {
    //     console.log(e);
    // });;
 //   listOfPassingData.push(passeddata2);

    let passeddata3 = {};
    passeddata3["functioName"] = "updateAll";
    passeddata3["locationOfModel"] = "./model/user";
    passeddata3["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword1231" }, "updatedata": { password: "P@ssword122" } };
    passeddata3["operationsContext"] = {
        "findValuesBeforeUpdate": {
            "functioName": "findAll", "locationOfModel": "./model/user", "objectToPassIntoFunction": { "filterCondition": { password: "P@ssword1231" } }
        }
    };
    // mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`)).catch((e) => {
    //     console.log(e);
    // });;
   // listOfPassingData.push(passeddata3);

    let passeddata4 = {};
    passeddata4["functioName"] = "deleteOne";
    passeddata4["locationOfModel"] = "./model/user";
    passeddata4["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword122" } };
    // mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`)).catch((e) => {
    //     console.log(e);
    // });;
  //  listOfPassingData.push(passeddata4);
    executeAllOperation(listOfPassingData);
});

// console.log(listOfPassingData);
var id = -1;

function executeAllOperation(listOfPassingData) {
    // setInterval(executeOneRequest, 10);
    // listOfPassingData.forEach(element => {
    //     PromiseArray.push(new Promise((resolve, reject) => {
    //         mongoService.module.mongoOperationExceution(listOfPassingData[id]).then(res => {
    //             console.log(res);
    //         }).catch(e => {
    //             console.log(e);
    //         });
    //     }));
    // });
    let mainId = "";
    let Testfailed=false;
    blueBird.each(listOfPassingData, (res) => {
        return mongoService.module.mongoOperationExceution(res).then(data => {
            if (data.model_Name == "./model/user") {
                if (data.functionName == "createNewEntry") {
                    mainId = data.val;
                    console.log(`Test Success For this ${data.functionName}`);
                }
                else{
                    if(!_.isEqual(data.val,mainId)){
                        console.log("test failed");
                        console.log(`Test Failed For this ${data.functionName}`);
                        Testfailed=false;
                    }
                    else if(_.isEqual(data.val,mainId)){
                        console.log(`Test success For this ${data.functionName}`);
                        Testfailed=true;
                    }
                }
            }
           // console.log(data);
        }).catch(e => {
            console.log(e);
        });
    }).then(response => {
        console.log("All Test Is Done.");
        assert.equal(Testfailed,true,"test case passed");
    }).catch(e => {
        console.log(e);
    });
    // Promise.all(PromiseArray).then(res => {
    //     console.log("hjvnnvnbvnbv"+res);
    // }).catch((e) => {
    //     console.log(e);
    // });
}


// passeddata1["functioName"] = "deleteAll";
// passeddata1["locationOfModel"] = "./model/user";
// passeddata1["objectToPassIntoFunction"] = { "filterCondition": { password: "P@ssword1231" } };
// mongoService.module.mongoOperationExceution(passeddata1).then(val => console.log(`data:${val}`));
/**
 * , "operationsContext": { "notAllowedSameValueAddition": { "functioName": "findCount", "locationOfModel": "./model/table", "objectToPassIntoFunction": { "primaryKey": "name", "passParentFunctionData": true, "reAssigning": true } } }
 */