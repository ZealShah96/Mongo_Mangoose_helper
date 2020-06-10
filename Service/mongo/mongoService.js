const path = require('path');
var mongoose = require('mongoose');
const resolve = path.resolve;
const checkValueShouldBeInArray = require('../utility/utilityService').checkValueShouldBeInArray;
const utility = require('../utility/utilityService');
let mongoService = require('./mongoService');
let findKey = require('../config/config').findVariableAvaiableInConfiguration;
let closeDbConnection = require('./mongoService').mongoDbConnectionClose;
const debug = require('../debug/debugService').debugConsole(__dirname, __filename);
let configPerameterfetch = require(path.resolve('./service/config')).findConfigPerameter;
let mongoConnection = [];
let mongooseDefaultConnectionValues = {
    port: 4000,
    options: {
        useNewUrlParser: true
        // useUnifiedTopology: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
        // autoIndex: false, // Don't build indexes
        // poolSize: 10, // Maintain up to 10 socket connections
        // serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        // socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        // family: 4
    }
}
let _ = require('lodash');
/**Follow multiple mongo connection */
let followMultipleMongo = true;
let mongoConnectionIndex = 0;

//#region model Database connection 

module.createNewEntry = (passeddata) => {
    return new Promise((resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData } = data;
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "create"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes } = flattenObjects;
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.create(flattenObjects.objectToPassIntoFunction).then(createdData => {
                    let passingDataForGetAll={
                        data:{
                            "filterCondition":filterCondition
                        },
                        "operationsContext":operationsContext,
                        "locationOfModel":locationOfModel
                    }
                    module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                        return resolve(findAllFetchedData);
                    });
                });
            }
            else {
                console.log("I think someone try same data addition again.")
                return resolve("I think someone try same data addition again.");
            }
        });
    });
}

module.getTempModeldata = (modelLocation, data) => {
    let model = require(path.resolve(modelLocation)).model;
    let tempdata = new model(data);
    // console.log(tempdata);
    return tempdata;
}

module.flattenPromiseObject = (array) => {
    let flattenObjects = {};
    array.forEach((value, index, array) => {
        Object.keys(value).forEach((key, index, array) => {
            flattenObjects[key] = value[key];
        });
    });
    return flattenObjects;
}

module.fetchNotAllowedAttributes = (mongo_connection, operation) => {
    return new Promise((resolve, reject) => {
        module.filterAttribute(mongo_connection.modelName, operation).then(filterAttributeFetchedData => {
            filterAttributeFetchedData.notAllowedToTouch.push("isNew");
            let notAllowedAttributes = _.reduce(filterAttributeFetchedData.notAllowedToTouch, function (obj, param) {
                obj[param] = 0
                return obj;
            }, {});
            return resolve({ "notAllowedAttributes": notAllowedAttributes, "allowedAttributes": filterAttributeFetchedData.requiredFields });
        });
    });
}

module.processOperationsContextAndPassAsPromise = (operationsContext, data) => {
    let promiseArray = [];
    if (!_.isEmpty(operationsContext)) {
        Object.keys(operationsContext).forEach((element, index, array) => {
            if (!_.isEmpty(element)) {
                let dataToPassInChildFunction = {};
                dataToPassInChildFunction = _.cloneDeep(operationsContext[element]);
                if (_.isBoolean(dataToPassInChildFunction.objectToPassIntoFunction.
                    passParentFunctionData) && dataToPassInChildFunction.objectToPassIntoFunction.
                        passParentFunctionData) {
                    dataToPassInChildFunction["objectToPassIntoFunction"]["parentData"] = data;
                }
                promiseArray.push(new Promise((resolve, reject) => {
                    module.mongoOperationExceution(dataToPassInChildFunction).then(objectToPassIntoFunction => {
                        resolve({ "objectToPassIntoFunction": objectToPassIntoFunction });
                    });
                })
                )
            }
        });
    }
    else {
        promiseArray.push(new Promise((resolve, reject) => {
            resolve({ "objectToPassIntoFunction": data });
        }));
    }
    return promiseArray;
};

module.findCount = (passeddata) => {
    return new Promise((resolve, reject) => {
        try {
            var { locationOfModel, data, operationsContext } = passeddata;
            let { parentData, primaryKey, reAssigning,
                passParentFunctionData } = data;
            let filterCondition = {};
            if (_.isBoolean(passParentFunctionData) && passParentFunctionData) {
                data = parentData;
            }
            if (!_.isEmpty(primaryKey)) {
                if (!_.isEmpty(filterCondition)) {
                    filterCondition = {};
                }
                filterCondition[primaryKey] = data[primaryKey];
            }
            let mongo_connection = require(path.resolve(locationOfModel)).model;

            mongo_connection.count(filterCondition, (err, res) => {
                if (res > 0) {
                    return resolve(null);
                }
                return resolve(parentData);
            }).catch(e => {
                console.log(e);
            });
        }
        catch (e) {
            console.log(e);
        }

    });
}

module.mongoOperationExceution = (mongoOperation) => {
    return new Promise((resolve, reject) => {
        let { functioName, locationOfModel, objectToPassIntoFunction, operationsContext } = mongoOperation;
        if (!_.isEmpty(functioName) && !_.isEmpty(locationOfModel) && !_.isEmpty(objectToPassIntoFunction)) {
            configPerameterfetch("mongo_connection").then((value) => {
                console.log(value);
                mongoService.mongoDbConnectionCreate(value).then(con => {
                    let perameterToPassedInFunction = {};
                    perameterToPassedInFunction["locationOfModel"] = locationOfModel;
                    perameterToPassedInFunction["mongoConnection"] = con;
                    perameterToPassedInFunction["data"] = _.cloneDeep(objectToPassIntoFunction);
                    perameterToPassedInFunction["operationsContext"] = operationsContext;
                    module[functioName](perameterToPassedInFunction).then(val => {
                        console.log(val);
                        resolve(val);
                    });
                }).catch(e => {
                    console.log(e);
                });
            }).catch(err => {
                console.log(err);
            });
        }
        else {
            console.log("undefined error");
        }
    });
}

module.findAll = (passeddata) => {
    return new Promise((resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, filterCondition } = data;
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, data);
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "show"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes, allowedAttributes } = flattenObjects;
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.find(filterCondition, notAllowedAttributes).then((findFilterFetchedData) => {
                    console.log(findFilterFetchedData);
                    let filteredData =[];
                     findFilterFetchedData.filter(x => {
                        let y = _.omitBy(x, _.isUndefined);
                        y = _.pick(y, allowedAttributes);
                        filteredData.push(y);
                    });
                    return resolve(filteredData);
                });
            }
            else {
                console.log("I think there are some issues in to find all function.");
                return resolve("I think there are some issues in to find all function.");
            }
        });
    });
}

module.filterAttribute = (modelName, operation) => {
    return new Promise((resolve, reject) => {
        let mongo_connection = require(path.resolve("./model/table")).model;
        mongo_connection.findOne({ name: modelName }, (err, res) => {
            if (err) {
                console.log(err);
            }
            else {
                let filterdata = res.allowedOperationsContext[operation];

                return resolve(filterdata);
            }
        });
    });
}

module.updateOne = (passeddata) => {
    return new Promise((resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, updatedata, filterCondition } = data;
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "update"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.findOneAndUpdate(filterCondition, updatedata, {
                    new: true
                }).then(updatedData => {
                    if (!_.isEmpty(updatedData)) {
                        let passingDataForGetAll={
                            data:{
                                "filterCondition":filterCondition
                            },
                            "operationsContext":operationsContext,
                            "locationOfModel":locationOfModel
                        }
                        module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                            return resolve(findAllFetchedData);
                        });
                    }
                    else {
                        console.log("no data updated");
                    }
                });
            }
            else {
                console.log("I think someone try same data addition again.")
                return resolve("I think someone try same data addition again.");
            }
        });
    });
}

module.updateAll = (passeddata) => {
    return new Promise((resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, updatedata, filterCondition } = data;
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "update"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes } = flattenObjects;
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.updateMany(filterCondition, { "$set": updatedata }, {
                    multi: true,
                    new: true
                }).then(updatedData => {
                    if (!_.isEmpty(updatedData)) {
                        let passingDataForGetAll={
                            data:{
                                "filterCondition":filterCondition
                            },
                            "operationsContext":operationsContext,
                            "locationOfModel":locationOfModel
                        }
                        module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                            return resolve(findAllFetchedData);
                        });
                    }
                    else {
                        console.log("no data updated");
                    }
                });
            }
            else {
                console.log("I think someone try same data addition again.")
                return resolve("I think someone try same data addition again.");
            }
        });
    });
}


module.deleteOne=(passeddata)=>{
    return new Promise((resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, updatedata, filterCondition } = data;
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "delete"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes } = flattenObjects;
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.updateMany(filterCondition, { "$set": updatedata }, {
                    multi: true,
                    new: true
                }).then(updatedData => {
                    if (!_.isEmpty(updatedData)) {
                        let passingDataForGetAll={
                            data:{
                                "filterCondition":filterCondition
                            },
                            "operationsContext":operationsContext,
                            "locationOfModel":locationOfModel
                        }
                        module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                            return resolve(findAllFetchedData);
                        });
                    }
                    else {
                        console.log("no data updated");
                    }
                });
            }
            else {
                console.log("I think someone try same data addition again.")
                return resolve("I think someone try same data addition again.");
            }
        });
    });
}
//#endregion

//#region model finding and mongo connection 

/**
 * @method mongoDbConnectionCreate
 * @returns It will create mongo connection
 * @description it will create connection to mongo database.
 */
exports.mongoDbConnectionCreate = async (mongoOptions) => {
    return new Promise((resolve, reject) => {
        try {
            let { uri, port, dbname, options } = _.merge(mongooseDefaultConnectionValues, mongoOptions)
            debug("In mongo Db Connection Create function !!!!");
            let urlForDB = `mongodb://${uri}:${port}/${dbname}`;
            debug(`Trying to connect to Mongo db on:- ${urlForDB}`)
            mongoConnection[mongoConnectionIndex] = mongoose.connect(`${urlForDB}`, options).then(con => {
                debug("Mongo db is connected.");
                debug(`out from mongo Db Connection Create function !!!!`);
                return resolve(con);
            }).catch(e => {
                console.log(e);
                return reject(e);
            });
        }
        catch (e) {
            debug(`Mongo db connection is not established because of ${JSON.stringify(e)}!!!!!!`);
            debug(`Out from mongo Db Connection Create function !!!!`);
            return reject(e);
        }
    });
}

/**
 * @description it will close connection to database.
 */
exports.mongoDbConnectionClose = async () => {

}

/**
 * @method findModel
 * @param  {string} modelName :Name of model name
 * @returns returning obejct of mongoose model
 * @description it will find models from given path for further process.
 */

exports.findModel = async (modelName) => {
    try {
        debug("In find Model function!!!!");
        //it will find location of models 
        let modelsLocations = findKey("models_locations");
        //resolving path to it.
        let path = resolve(modelsLocations);
        //model required.
        mongoose = require(`${path}/${modelName}`).mongoose;
        //let find model from path
        let model = require(`${path}/${modelName}`).model;
        //it will create connection to provided connection link and that specific db
        let makeDbConnection = require('./mongoService').mongoDbConnectionCreate;
        debug(`model is fetched:${model.modelName} and now trying to connect to mongo db.....`)
        await makeDbConnection();
        debug(`Connection is established and returning model:${model.modelName}}`)
        debug(`out from find model function !!!!`);
        return model;
    }
    catch (err) {
        debug(`Mongo db model fetch is not possible because of ${JSON.stringify(err)}!!!!!!`);
        debug(`out from find model function !!!!`);
        throw err;
    }
}

let findModel = require('./mongoService').findModel;

//#endregion

//#region Original Process On Mongo db.

//#region create/createAll

/**
 * @description it will create one entry in database.
 */
exports.create = async (modelName, data, customHeaders = {}) => {
    let model = await findModel(modelName);
    debug("In Creating new entry !!!!");
    let operationType = "show";
    customHeaders = await mongoService.findCustomHeaders(customHeaders, modelName, operationType);
    try {
        allowedDataWhichCanUpdate = await mongoService.filterNotAllowedAttributes(data, findKey("notAllowedAttributes")[modelName]["create"]);
    }
    catch (err) {
        allowedDataWhichCanUpdate = await mongoService.filterNotAllowedAttributes(data, findKey("notAllowedAttributes")["default"]["create"]);
    }
    //  let collectionsPresent = mongoConnection.collections;
    let newEntry = new model(allowedDataWhichCanUpdate);
    return new Promise(async (resolve, reject) => {
        try {
            let createdData = await newEntry.save();
            let filteredData = await mongoService.filterAttributes(createdData._doc, customHeaders.requiredFields);
            debug(`${newEntry} is inserted in ${model.modelName.toString().toLowerCase()}!!!!!!`);
            debug(`out from create function !!!!`);
            return resolve(filteredData);
        }
        catch (err) {
            debug(`${newEntry} is not inserted in ${model.modelName.toString().toLowerCase()} because of ${JSON.stringify(err)}!!!!!!`);
            debug(`out from create function !!!!`);
            return reject(err);
        }
    });
}

/**
 * @description it will create one entry in database.
 */
exports.create = (req, res) => {

}

/**
 * @description it will create multiple entry in database.
 */
exports.createMany = async (modelName, data, customHeaders = {}) => {
    //to be written.
}

//#endregion

//#region findOne/findAll
/**
 * @description it will update entry in database.
 */
exports.findOne = async (modelName, condition, customHeaders = {}) => {
    debug("In Find One Function !!!!");
    let operationType = "show";
    customHeaders = await mongoService.findCustomHeaders(customHeaders, modelName, operationType);
    let model = await findModel(modelName);
    try {
        return new Promise((resolve, reject) => {
            ;
            model.find(condition, customHeaders.fields).populate(`${customHeaders.virtualConnections}`)
                .skip(customHeaders.skip)
                .limit(1)
                .exec(async (err, docs) => {
                    if (docs != null) {

                        let filteredData = [];
                        if (docs.length > 1) {
                            filteredData.push(await mongoService.filterAttributes(mongoService.first(docs)._doc, customHeaders.requiredFields));
                        }
                        debug(`out from Find One Function with found data:${JSON.stringify(filteredData)}`);
                        debug(`out from Find One Function !!!!`);
                        return resolve(filteredData);
                    }
                    else {
                        debug(`Find One Function with error ${JSON.stringify(err)}`);
                        debug(`out from Find One Function !!!!`);
                        return reject(err);
                    }
                });
        });
    }
    catch (err) {
        debug(`Find One Function with error ${JSON.stringify(err)}`);
        debug(`out from Find One Function !!!!`);
        throw err;
    }
}

/**
 * @description it will update entry in database.
 */
exports.findAll = async (modelName, condition, customHeaders = {}) => {
    debug("In Find All Function !!!!");
    let operationType = "show";
    customHeaders = await mongoService.findCustomHeaders(customHeaders, modelName, operationType);
    let model = await findModel(modelName);
    try {
        return new Promise((resolve, reject) => {
            ;
            model.find(condition, customHeaders.fields)
                .populate(`${customHeaders.virtualConnections}`)
                .skip(customHeaders.skip)
                .limit(customHeaders.limit)
                .exec(async (err, docs) => {
                    if (docs != null) {
                        let filteredData = [];
                        await docs.forEach(async element => {
                            let filterIndividualData = await mongoService.filterAttributes(element._doc, customHeaders.requiredFields);
                            filteredData.push(filterIndividualData);
                            // debug(filteredData);
                        });
                        debug(`out from Find All Function with found data:${JSON.stringify(docs)}`);
                        debug(`out from Find All Function !!!!`);
                        return resolve(docs);
                    }
                    else {
                        debug(`Find All Function exists with error ${JSON.stringify(err)}`);
                        debug(`out from Find All Function !!!!`);
                        return reject(err);
                    }
                });
        });
    }
    catch (err) {
        debug(`Find All Function exists with error ${JSON.stringify(err)}`);
        debug(`out from Find All Function !!!!`);
        throw err;
    }
}

//#endregion

//#region update/updateAll

/**
 * @description it will update entry in database.
 */
exports.updateOne = async (modelName, condition, data, customHeaders = {}) => {
    debug("In update One function !!!!");
    let operationType = "update";
    customHeaders = await mongoService.findCustomHeaders(customHeaders, modelName, operationType);
    let model = await findModel(modelName);
    let allowedDataWhichCanUpdate;

    try {
        allowedDataWhichCanUpdate = await mongoService.filterNotAllowedAttributes(data, findKey("notAllowedAttributes")[modelName]["update"]);
    }
    catch (err) {
        allowedDataWhichCanUpdate = await mongoService.filterNotAllowedAttributes(data, findKey("notAllowedAttributes")["default"]["update"]);
    }
    return new Promise((resolve, reject) => {
        try {
            model.findOneAndUpdate(condition, allowedDataWhichCanUpdate, { new: true }, async (err, doc) => {
                if (err != null) {
                    return reject(err);
                }
                else {
                    debug(`Update of data is performed perfectly updated data is:- ${JSON.stringify(doc)}`);
                    debug("Out from update One function !!!!");
                    let filteredData = [];
                    if (utility.checkValueShouldBeInArray(doc, "notNull")) {
                        let data = await mongoService.filterAttributes(doc._doc, customHeaders.requiredFields);
                        filteredData.push(data);
                        return resolve(filteredData);
                    }
                    else {
                        let error = new Error("There is no entry regarding this id.");
                        debug(`Update One operation is not performed successfully because of ${JSON.stringify(error)}`);
                        debug("Out from update One function !!!!");
                        return reject(error);
                    }
                }
            });
        }
        catch (err) {
            debug(`Update One operation is not performed successfully because of ${JSON.stringify(err)}`);
            debug("Out from update One function !!!!");
            return err;
        }
    });

}

/**
 * @description it will update multiple entries in database.
 */
exports.updateAll = async (modelName, condition, data, customHeaders = {}) => {
    debug("In update All function !!!!");
    let model = await findModel(modelName);
    let allowedDataWhichCanUpdate = await mongoService.filterNotAllowedAttributes(data, findKey("notAllowedAttributes")[modelName]["update"])
    try {
        return new Promise((resolve, reject) => {
            model.updateMany(condition, data, { new: true, multi: true }, (err, doc) => {
                if (err != null) {
                    return reject(err);
                }
                else {
                    debug(`Update of data is performed perfectly updated data is:- ${JSON.stringify(doc)}`);
                    debug("Out from update All function !!!!");
                    return resolve(doc);
                }
            });
        });
    }
    catch (err) {
        debug(`Update all operation is not performed successfully because of ${JSON.stringify(err)}`);
        debug("Out from update all function !!!!");
        throw err;
    }
}
//#endregion

//#region delete/deleteAll
/**
 * @description it will delete one entry in database.
 */
exports.deleteOne = async (modelName, condition, customHeaders = {}) => {
    debug("In delete One function !!!!");
    let operationType = "update";
    customHeaders = await mongoService.findCustomHeaders(customHeaders, modelName, operationType);
    let model = await findModel(modelName);
    try {
        return new Promise((resolve, reject) => {
            model.findOneAndUpdate(condition, { "is_deleted": true }, { new: true }, async (err, doc) => {
                if (err != null) {
                    return reject(err);
                }
                else {
                    debug(`delete of data is performed perfectly deleted data is:- ${JSON.stringify(doc)}`);
                    debug("Out from delete One function !!!!");
                    let deletedData = [];
                    if (doc != null) {
                        let data = await mongoService.filterAttributes(doc._doc, customHeaders.requiredFields);
                        deletedData.push(data);
                        return resolve(deletedData);
                    }
                    else {
                        let error = new Error("There is no entry regarding this id.");
                        debug(`delete One operation is not performed successfully because of ${JSON.stringify(error)}`);
                        debug("Out from delete One function !!!!");
                        return reject(error);
                    }

                }
            });
        });
    }
    catch (err) {
        debug(`delete One operation is not performed successfully because of ${JSON.stringify(err)}`);
        debug("Out from delete One function !!!!");
        throw err;
    }
}

/**
* @description it will delete All entry in database which fullfill condition.
*/
exports.deleteAll = async (modelName, condition, customHeaders = {}) => {
    debug("In update All function !!!!");
    let operationType = "update";
    customHeaders = await mongoService.findCustomHeaders(customHeaders, modelName, operationType);
    let model = await findModel(modelName);
    try {
        return new Promise((resolve, reject) => {
            model.updateMany(condition, { "is_deleted": true }, { new: true, multi: true }, (err, doc) => {
                if (err != null) {
                    return reject(err);
                }
                else {
                    debug(`delete of data is performed perfectly deleted data is:- ${JSON.stringify(doc)}`);
                    debug("Out from delete all function !!!!");
                    return resolve(doc);
                }
            });
        });
    }
    catch (err) {
        debug(`delete all operation is not performed successfully because of ${JSON.stringify(err)}`);
        debug("Out from delete all function !!!!");
        throw err;
    }
}
//#endregion

//#endregion

//#region utility for mongo fields retriving.
/**
 * @description it will filter attributes 
 */
exports.filterAttributes = async (data, arrayAttributesToFilter = []) => {
    try {
        let filteredNotAllowedAttributesData = await mongoService.filterNotAllowedAttributes(data);
        if (arrayAttributesToFilter.length > 0) {
            //finding data which are not allowed after removing fields that we want.WW
            let typeOfData = typeof (data);
            switch (typeOfData) {
                case "Array":

                    break;
                case "object":
                    var notAllowedAttributesFindAfterRemovingAllowedAttributes = Object.keys(data).filter((prop) => {
                        if (arrayAttributesToFilter.indexOf(prop) == -1) {
                            return prop;
                        }
                    });
                    break;
                case "default":
                    break;
            }
            //using same not allowed function to filter unwanted fields.
            filteredNotAllowedAttributesData = await mongoService.filterNotAllowedAttributes(filteredNotAllowedAttributesData, notAllowedAttributesFindAfterRemovingAllowedAttributes);
            // filteredNotAllowedAttributesData
        }
        return filteredNotAllowedAttributesData;
    }
    catch (err) {
        debug(`There is some error:${JSON.stringify(err)}`);
        throw err;
    }
}


/**
 * @description it will filter attributes 
 */
exports.filterNotAllowedAttributes = async (data, notAllowedAttributes = []) => {
    debug("In filter not allowed attribute function !!!!");
    //Not allowed attributes find. 
    notAllowedAttributes = checkValueShouldBeInArray(notAllowedAttributes, "notEmptyArray")
        ? notAllowedAttributes
        : findKey("notAllowedAttributes")["user"]["show"];

    //printing in console.
    debug(`not allowed attributes:${notAllowedAttributes}`);

    //finding that data is list or normal data.
    debug(`data:-${data}`);

    let typeOfData = typeof (data);
    switch (typeOfData) {
        case "Array":

            break;
        case "object":
            debug(`data will be filtered now.${JSON.stringify(data)}`);
            data = filterKeyNamesFromObject(data, "", notAllowedAttributes);
            // delete data._doc["is_deleted"];
            debug(`data will be filtered now.${JSON.stringify(data)}`);
            break;
        case "default":
            break;
    }
    debug(`filtered data ${JSON.stringify(data)}`)
    debug("out filter not allowed attribute function !!!!");
    return data;
}

/**
 * @description it will filter key names based on inputs if it arry of filter key names or normal key name.
 */
function filterKeyNamesFromObject(object, filterKeyName = "", filterKeyNames = []) {
    Object.keys(object).forEach((prop) => {
        if (filterKeyNames.length > 0) {
            if (filterKeyNames.indexOf(prop) > -1) {
                delete object[prop];
            }
        }
        else {
            if (filterKeyName == prop) {
                delete object[prop];
            }
        }
    });
    return object;
}



/**
 * @description it will find perameters for find when we need to execute skip and limit in find.
 */
exports.findCustomHeaders = async (customHeaders, modelName, operationType) => {
    let customHeadersWithDefaultfields = {};

    try {
        debug(`custom headers are going to be find with connected to ${modelName} and operation ${operationType}`);
        customHeadersWithDefaultfields = findKey("customHeaders")[modelName][operationType];
        debug(`custom headers found  with connected to ${modelName} and operation ${operationType} :-${customHeadersWithDefaultfields}`);
    }
    catch (err) {
        debug(`no default config found for ${modelName} so we will find it from default model config.`)
        debug(`custom headers are going to be find with connected to default model and operation ${operationType}`);
        customHeadersWithDefaultfields = findKey("customHeaders")["default"][operationType];
        debug(`custom headers found  with connected to ${modelName} and operation ${operationType} :-${customHeadersWithDefaultfields}`);
    }
    try {
        debug("In finding custom headers !!!!");
        // customHeadersWithDefaultfields.fields=customHeadersWithDefaultfields.fields;
        Object.keys(customHeaders).forEach(prop => {
            let typeofProp = typeof (customHeaders[prop]);
            if (typeofProp == "object" ? checkValueShouldBeInArray(customHeaders[prop], "notEmptyObject") : true) {
                customHeadersWithDefaultfields[prop] = customHeaders[prop];
            }
        });
        debug(`out from finding custom headers:-CustomHeaders is ${JSON.stringify(customHeadersWithDefaultfields)}`);
        debug("out from finding custom headers !!!!");
        return customHeadersWithDefaultfields;
    }
    catch (err) {
        debug(`finding customs headers found issue ${JSON.stringify(err)}`);
        debug(`Because error passing default fields:-${JSON.stringify(customHeadersWithDefaultfields)}`);
        debug("out from finding custom headers !!!!");
        return customHeadersWithDefaultfields;
    }

}

//#endregion

//#region find first item

/**
 * @description it will return first item of array
 */
exports.first = (listOfElement, index = 0) => {
    return listOfElement[index];
}

//#endregion



//#region removing whole db 
/**
 * @description it will remove whole db from database.
 */
exports.removeWholeDb = async () => {

    mongoose.connection.db.dropDatabase().then(() => {

        debug("DB is droped.")
    }).catch((err) => {

        debug("db is not dropped there is some error" + err.toString());
    });

}


exports.module = module;
