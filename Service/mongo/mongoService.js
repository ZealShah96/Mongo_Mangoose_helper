const path = require('path');
var mongoose = require('mongoose');
let mongoService = require('./mongoService');
const debug = require('../debug/debugService').debugConsole(__dirname, __filename);
let configPerameterfetch = require(path.resolve('./service/config')).findConfigPerameter;
let mongoConnection = [];
let mongooseDefaultConnectionValues = {
    port: 4000,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
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
                            "filterCondition":{}
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
            let {skip,limit,notAllowedToTouch,requiredFields}=filterAttributeFetchedData;
            filterAttributeFetchedData.notAllowedToTouch.push("isNew");
            let notAllowedAttributes = _.reduce(notAllowedToTouch, function (obj, param) {
                obj[param] = 0
                return obj;
            }, {});
            return resolve({ "notAllowedAttributes": notAllowedAttributes, "allowedAttributes": requiredFields,"defaultskip":skip,"defaultlimit":limit });
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
            let filterCondition = {"isDeleted":false};
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

module.filterConditionFunction=(filterCondition,onlyIncludeDeleted)=>{
    if(!_.isEmpty(filterCondition) && _.isBoolean(onlyIncludeDeleted) && onlyIncludeDeleted){
        filterCondition["isDeleted"]=true;
    }
    return filterCondition;
}

module.makingFilterConditionProper=(data)=>{
    let { parentData, filterCondition,onlyIncludeDeleted } = data;
    data[filterCondition]=module.filterConditionFunction(filterCondition,onlyIncludeDeleted);
    return data;
}

module.findAll = (passeddata) => {
    return new Promise((resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, filterCondition,skip,limit } = data;
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, data);
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "show"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes, allowedAttributes,dafultskip,defaultlimit } = flattenObjects;
            if(!(skip>0 || limit>0)){
                skip=dafultskip,
                limit=defaultlimit
            }
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.find(filterCondition, notAllowedAttributes,{"skip":skip,"limit":limit}).then((findFilterFetchedData) => {
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
        let { parentData, updatedata, filterCondition,onlyIncludeDeleted } = data;
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
                    if (updatedData.nModified>0) {
                        let passingDataForGetAll={
                            data:{
                                "filterCondition":module.filterConditionFunction(filterCondition,onlyIncludeDeleted)
                            },
                            "operationsContext":operationsContext,
                            "locationOfModel":locationOfModel
                        }
                        module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                            return resolve(findAllFetchedData);
                        }).catch(e=>{
                            console.log(e);
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
        let { parentData, updatedata, filterCondition } = module.makingFilterConditionProper(data);
        let mongo_connection = require(path.resolve(locationOfModel)).model;
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(mongo_connection, "delete"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                let passingDataForUpdateAll={
                    data:{
                        "filterCondition":filterCondition,
                        "updatedata":{"isDeleted":true},
                        "onlyIncludeDeleted":true
                    },
                    "operationsContext":operationsContext,
                    "locationOfModel":locationOfModel
                }
                module.updateAll(passingDataForUpdateAll).then(updatedData => {
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
                }).catch(e=>{
                    console.log(e);
                });
            }
            else {
                console.log("I think someone try same data addition again.")
                return resolve("I think someone try same data addition again.");
            }
        }).catch(e=>{
            console.log(e);
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
