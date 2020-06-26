let assert = require('assert');
let expect = require('chai').expect;
let utility = require('./../Service/utility/utilityService');
let mongoService = require('./../Service/mongo/mongoService');
const config = require('./../Service/config/config');
const debug = require('./../Service/debug/debugService').debugConsole(__dirname, __filename);
process.env.NODE_ENV = 'dev_test_api';
const testService = require('./api_success_test');
var Promise = require("bluebird");

exports.executingTest = async (modelName, data, expectedData, description, customDataPassed, methodName, ExpectedTotestcase, condition) => {
    // describe(`Checking ${modelName}'s API`, function () {
    it(`${description}`, function (done) {
        let output;
        if (customDataPassed.applyCondition) {
            mongoService[methodName](modelName, condition, data, customDataPassed).then((data) => {

                output = data;
                debug(JSON.stringify(output));
                expect(testService.matchObject(output, expectedData)).to.deep.equal(ExpectedTotestcase);
                done();
            }).catch((err) => {

                let expexctedValue = false;
                if (ExpectedTotestcase) {
                    done(err);
                }
                else {
                    done();
                }

                // console.log(err);

            }, done);
        }
        else if (customDataPassed.findWithCondition) {
            mongoService[methodName](modelName, condition, customDataPassed).then((data) => {

                output = data;
                debug(JSON.stringify(output));
                if (["deleteAll"].indexOf(methodName) == -1) {
                    expect(testService.matchObject({ "0": output }, expectedData)).to.deep.equal(ExpectedTotestcase);
                    done();
                }
                else {
                    expect(testService.matchObject(output, expectedData)).to.deep.equal(ExpectedTotestcase);
                    done();
                }
            }).catch((err) => {

                let expexctedValue = false;
                if (ExpectedTotestcase) {
                    done(err);
                }
                else {
                    done();
                }
            }, done);
        }
        else {
            mongoService[methodName](modelName, data, customDataPassed).then((data) => {

                output = data;
                debug(JSON.stringify(output));
                expect(testService.matchObject(output, expectedData)).to.deep.equal(ExpectedTotestcase);
                done();
            }).catch((err) => {

                let expexctedValue = false;
                if (ExpectedTotestcase) {
                    done(err);
                }
                else {
                    done();
                }

            }, done);
        }
    });
}

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


const testModule = require('./api_success_test').executingTest;




describe('Checking Create API', async function (modelName, condition, data, expectedData, description, customDataPassed, done) {
    // describe("Performing API testing",async ()=>{
    var tests = [];

    //#region find/FindAll
    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { [0]: [] }, "Success || finding all data from db", { "requiredFields": ["name", "age"], "findWithCondition": true }, "findAll", true, { "is_deleted": false }));

    //#endregion

    //#region create a users test
    //#region success
    tests.push(testModule("user", { "name": "zeal", "age": 23 }, { "name": "zeal", "age": 23 }, "Success || checking create data function of mongo db", { "requiredFields": [] }, "create", true));

    tests.push(testModule("user", { "id": 1, "name": "zeal", "age": 23 }, { "name": "zeal", "age": 23 }, "success || checking create data function with passing id also which is not required", { "requiredFields": ["age", "name"] }, "create", true));
    //#endregion

    //#region failed
    tests.push(testModule("user", { "name": "zeal", "age": 23 }, { "name": "zeal", "age": 23 }, "Failed || checking create data function with required fields mongo db", { "requiredFields": ["Name"] }, "create", false));
    //#endregion

    //#region executing find all functionality after creation 

    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { [0]: [{ "name": "zeal", "age": 23, "is_deleted": true }] }, "Success || finding one condition should be working", { "requiredFields": ["name", "age", "is_deleted"], "findWithCondition": true }, "findAll", true, { id: "1" }));

    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { [0]: [{ "name": "zeal", "age": 23 }] }, "Failed || finding condition should be working fine so when we want to fail it then it should be send failed.", { "requiredFields": ["name", "age"], "findWithCondition": true }, "findAll", false, { id: "1" }));

    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { [0]: [{ "name": "zeal", "age": 23 }] }, "Failed || finding condition should be working fine so when we want to fail it then it should be send failed.", { "requiredFields": ["name", "age"], "findWithCondition": true }, "findAll", false, { id: 1000 }));
    //#endregion
    //#endregion

    //#region update one users test

    //#region success
    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { [0]: { "name": "zeal", "age": 24 } }, "Success || checking update one data function with required fields mongo db", { "requiredFields": ["name", "age"], "applyCondition": true }, "updateOne", true, { "id": 1 }));
    //#endregion 

    //#region failed
    tests.push(testModule("user", { "name": "zeal", "age": 23 }, { "name": "zeal", "age": 24 }, "Failed || checking update one data function with required fields mongo db", { "requiredFields": ["Name"], "applyCondition": true }, "updateOne", false, { "id": 1 }));

    tests.push(testModule("user", { "name": "zeal", "age": 23 }, { "name": "zeal", "age": 24 }, "Failed || checking update one data function with required fields mongo db", { "requiredFields": [""], "applyCondition": true }, "updateOne", false, { "id": 1 }));

    tests.push(testModule("user", { "name": "zeal", "age": "zeal" }, { "name": "zeal", "age": 24 }, "Failed || checking update one data function with passing wrong data with error Cast to number failed for value 'zeal' at path 'age'", { "requiredFields": [""], "applyCondition": true }, "updateOne", false, { "id": 1 }));

    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { "name": "zeal", "age": 24 }, "Failed || checking update one data function with condition to passed is wrong.", { "requiredFields": [""], "applyCondition": true }, "updateOne", false, { "id": 1000 }));

    tests.push(testModule("user", { "name": "zeal", "age": 24 }, { "name": "zeal", "age": 24 }, "Failed || checking update one data function with condition to passed is wrong.", { "requiredFields": [""], "applyCondition": true }, "updateOne", false, { "id": 1000 }));
    //#endregion 
    //#endregion 

    //#region Delete
    tests.push(testModule("user", { "NA": "Not required." }, { [0]: [{ "name": "zeal", "age": 23 }] }, "Success || delete one data from db", { "requiredFields": ["name", "age"], "findWithCondition": true }, "deleteOne", true, { "id": 1 }));

    tests.push(testModule("user", { "NA": "Not required." }, { "ok": 1 }, "Success || delete all data from db", { "requiredFields": ["name", "age"], "findWithCondition": true }, "deleteAll", true, {}));
    //#endregion

    Promise.all(tests).then(function () {

    });
}).beforeAll(() => {
    console.log("====================================Main File Test===========================");
}).afterAll(() => {
    console.log("====================================End Main File Test============================");
});


