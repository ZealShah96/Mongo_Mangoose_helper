/**Intialization of most common used package. */
let fs = require('fs');
let path = require('path');
let mongoService = require('../Service/mongo/mongoService');
let guid = require('guid');
let blueBird = require("bluebird");
let _ = require("lodash");
let assert = require("assert");
let expect = require('chai').expect;
/**Mongo Connection Model */

let PromiseArray = [];
let listOfPassingData = [];
/**Intialization of database table file folder. */
let config = require("../Service/config/index").module;
let configPerameterfetch = config.findConfigPerameter;


let listofPassingData = [];
describe('Testing Mongo Service', function () {
    it('Testing API for Table', async function () {
        return new Promise(async (resolve, reject) => {
            let listofPassingData = await configPerameterfetch("tests");
            //  expect(value).equal(1);
            if(_.isUndefined(listofPassingData)){
                console.log("    Test cases are not avaiable.");
                expect(_.isUndefined(listofPassingData)).equal(true);
                resolve();
            }
            else if(listofPassingData.length==0){
                console.log("    There is no test cases avaiable.");
                expect(listofPassingData.length).equal(0);
                resolve();
            }
            else{
                expect(listofPassingData).not.equal(null);
                resolve();
                blueBird.each(listofPassingData, (passeddataElement) => {
                    return new Promise(resolve => {
                        describe('Testing Create Table Mongo Service', async function () {
                            let nameOfTableEntry = passeddataElement.locationOfModel.split('/')[passeddataElement.locationOfModel.split('/').length - 1];
                            let shouldFail=passeddataElement.failed;
                            let dataGoingToAdd=passeddataElement.objectToPassIntoFunction;
                            it(`Should add ${JSON.stringify(dataGoingToAdd)} in to table name:"${nameOfTableEntry}"`, async () => {
                                let data = await mongoService.module.mongoOperationExceution(passeddataElement);
                                checkValue(typeof (data.val), "object", `response is array in creation api response of ${nameOfTableEntry}`,shouldFail);
                                checkValue(data.val.length, 1, `response created multiple entries or no entries in creation api response of ${nameOfTableEntry}`,shouldFail);
                                resolve(true);
                            });
                        });
                    });
                }).then(res => {
                    describe('Testing drop Table Mongo Service', async function () {
                        it("Should Clear db", () => {
                            return clearDB().then(data => {
                                let shouldFail=false;
                                checkValue(data.success, true, "Data addition success is true",shouldFail);
                                checkValue(typeof (data.val), "string", "Db drop respose is string",shouldFail);
                                checkValue(data.val, "DB is droped.", "response is db dropped as we expect.",shouldFail);
                                resolve();
                            });
                        });
                    });
                }).catch(e => {
                    resolve();
                });
            }
           
        });
    });
});

function checkValue(actual, expected, message,failed,errorMessage) {
    describe(`          ${actual}==${expected} ${failed?"with fail expected":"with success expected"} `, () => {
        it(`${message} ${failed?"with fail expected":""}`, () => {
            if(_.isBoolean(failed)){
                if(failed){
                    expect(actual).not.equal(expected);
                }
                else{
                    expect(actual).equal(expected);
                }
            }
            else{
                expect(actual).equal(expected);
            }
        });
    });
}

async function clearDB() {
    let passeddata = {};
    passeddata["functioName"] = "removeWholeDb";
    passeddata["locationOfModel"] = "./model/table";
    passeddata["objectToPassIntoFunction"] = { "bvbnvnbvnb": "nbcbvnbbn" };
    return new Promise(resolve => {
        mongoService.module.mongoOperationExceution(passeddata).then(data => {
            // console.log(data);
            resolve(data);
        });
    });
}