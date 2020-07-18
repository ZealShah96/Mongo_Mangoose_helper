const path = require('path');
var mongoose = require('mongoose');
let mongoService = require('./mongoService');
const debug = require('../debug/debugService').debugConsole(__dirname, __filename);
let configPerameterfetch = require('../config/index').module.findConfigPerameter;
let mongoConnection = [];
let mongooseDefaultConnectionValues = {
    port: 4000,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        // autoIndex: false, // Don't build indexes
        poolSize: 10, // Maintain up to 10 socket connections
        // serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 5000, // Close sockets after 45 seconds of inactivity
        family: 4
    }
}
let _ = require('lodash');
const { config } = require('process');
/**Follow multiple mongo connection */
let followMultipleMongo = true;
let mongoConnectionIndex = 0;

//#region main operation part and start functionality functions

module.mongoOperationExceution = (mongoOperation) => {
    return new Promise((resolve, reject) => {
        let { functioName, locationOfModel, objectToPassIntoFunction, operationsContext } = mongoOperation;
        if (!_.isEmpty(functioName) && !_.isEmpty(locationOfModel) && !_.isEmpty(JSON.stringify(objectToPassIntoFunction))) {
            let modelName=require(path.resolve(locationOfModel)).model.modelName;
            let perameterToPassedInFunction = {};
            perameterToPassedInFunction["locationOfModel"] = locationOfModel;
            perameterToPassedInFunction["data"] = _.cloneDeep(objectToPassIntoFunction);
            perameterToPassedInFunction["operationsContext"] = operationsContext;
            module[functioName](perameterToPassedInFunction).then(val => {
                debug(val);
                resolve({ "functionName": functioName, "val": val, "model_Name": locationOfModel, "success": true });
            }).catch(e => {
                return reject(`${functioName} error Occured:${e}`);
            });
        }
        else {
            debug("undefined error");
            return reject(`undefined error`);
        }
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
                        resolve({ "objectToPassIntoFunction": objectToPassIntoFunction.val });
                    }).catch(e => {
                        return reject(`error Occured:${e}`);
                    });
                })
                )
            }
        });
    }
    else {
        let tempArray = [];
        tempArray.push(data);
        promiseArray.push(new Promise((resolve, reject) => {
            resolve({ "objectToPassIntoFunction": tempArray });
        }));
    }
    return promiseArray;
};

//#endregion

module.createNewEntry = (passeddata) => {
    return new Promise(async (resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData } = data;
        let modelName=this.fetchModelName(locationOfModel);
        let mongo_connection = await this.mongoDbSeperateConnection(modelName);
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(modelName, "create"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes } = flattenObjects;
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction) && flattenObjects.objectToPassIntoFunction!=1) {
                mongo_connection.create(flattenObjects.objectToPassIntoFunction).then(createdData => {
                    let passingDataForGetAllAfterNewEntryCreation = {
                        data: {
                            "filterCondition": { date: createdData.date }
                        },
                        "operationsContext": null,
                        "locationOfModel": locationOfModel
                    }
                    module.findAll(passingDataForGetAllAfterNewEntryCreation).then(findAllFetchedData => {
                        return resolve(findAllFetchedData);
                    }).catch(e => {
                        return reject(`error Occured:${e}`);
                    });
                }).catch(e => {
                    return reject(`error Occured:${e}`);
                });
            }
            else {
                debug("I think someone try same data addition again.")
                return resolve(`I think someone try to add this ${JSON.stringify(data)} again.`);
            }
        }).catch(e => {
            return reject(`error Occured:${e}`);
        });
    });
}

module.findCount = (passeddata) => {
    return new Promise(async (resolve, reject) => {
        try {
            var { locationOfModel, data, operationsContext } = passeddata;
            let { parentData, primaryKey, reAssigning,
                passParentFunctionData } = data;
            let filterCondition = { "isDeleted": false };
            if (_.isBoolean(passParentFunctionData) && passParentFunctionData) {
                data = parentData;
            }
            if (!_.isEmpty(primaryKey)) {
                if (!_.isEmpty(filterCondition)) {
                    filterCondition = {};
                }
                filterCondition[primaryKey] = data[primaryKey];
            }
            let modelName=this.fetchModelName(locationOfModel);
            let mongo_connection = await this.mongoDbSeperateConnection(modelName);
            let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
            allPromise.push(module.fetchNotAllowedAttributes(modelName, "show"));
            Promise.all(allPromise).then(objectToPassIntoFunction => {
                let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
                let { primaryKeyFromTable } = flattenObjects;
                if (primaryKey != primaryKeyFromTable) {
                    filterCondition[primaryKeyFromTable] = data[primaryKeyFromTable];
                }
                mongo_connection.countDocuments(filterCondition, (err, res) => {
                    if (res>0) {
                        return resolve(res);
                    }
                    return resolve(parentData);
                }).catch(e => {
                    debug(e);
                    return reject(`error Occured:${e}`);
                });
            }).catch(e => {
                return reject(`error Occured:${e}`);
            });
        }
        catch (e) {
            return reject(`error Occured:${e}`);
        }

    });
}

module.findAll = (passeddata) => {
    return new Promise(async (resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, filterCondition, skip, limit, onlyIncludeDeleted, passedAttributeContext } = data;
        filterCondition = module.filterConditionFunction(filterCondition, onlyIncludeDeleted);
        let mongo_connection = await this.mongoDbSeperateConnection(this.fetchModelName(locationOfModel));
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, data);
        allPromise.push(module.fetchNotAllowedAttributes(this.fetchModelName(locationOfModel), "show", passedAttributeContext));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes, allowedAttributes, defaultskip, defaultlimit } = flattenObjects;
            if (!(skip > 0 || limit > 0)) {
                skip = defaultskip,
                    limit = defaultlimit
            }
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.find(filterCondition, notAllowedAttributes, { "skip": skip, "limit": limit }).then((findFilterFetchedData) => {
                    debug(findFilterFetchedData);
                    let filteredData = [];
                    if (!_.isEmpty(allowedAttributes)) {
                        findFilterFetchedData.filter(x => {
                            let y = _.omitBy(x, _.isUndefined);
                            y = _.pick(y, allowedAttributes);
                            filteredData.push(y);
                        });
                        return resolve(filteredData);
                    }
                    else {
                        return resolve(findFilterFetchedData);
                    }

                }).catch(e => {
                    return reject(`error Occured:${e}`);
                });
            }
            else {
                debug("I think there are some issues in to find all function.");
                return reject("I think there are some issues in to find all function.");
            }
        }).catch(e => {
            return reject(`error Occured:${e}`);
        });;
    });
}

module.updateOne = (passeddata) => {
    return new Promise(async (resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, updatedata, filterCondition, onlyIncludeDeleted } = data;
        let modelName=this.fetchModelName(locationOfModel);
        let mongo_connection = await this.mongoDbSeperateConnection(modelName);
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(modelName, "update"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                filterCondition = module.filterConditionFunction(filterCondition, onlyIncludeDeleted);
                mongo_connection.findOneAndUpdate(filterCondition, updatedata, {
                    new: true
                }).then(updatedData => {
                    if (!_.isEmpty(updatedData)) {
                        let filterCondition = updatedata;
                        let passingDataForGetAll = {
                            data: {
                                "filterCondition": filterCondition
                            },
                            "operationsContext": null,
                            "locationOfModel": locationOfModel
                        }
                        module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                            return resolve(findAllFetchedData);
                        }).catch(e => {
                            return reject(`error Occured:${e}`);
                        });
                    }
                    else {
                        debug("no data updated");
                        return resolve("no data updated");
                    }
                }).catch(e => {
                    return reject(`error Occured:${e}`);
                });
            }
            else {
                debug("I think no data found to update one please check condition.")
                return resolve("I think no data found to update one please check condition.");
            }
        });
    });
}

module.updateAll = (passeddata) => {
    return new Promise(async (resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, updatedata, filterCondition, onlyIncludeDeleted } = data;
        let modelName=this.fetchModelName(locationOfModel);
        let mongo_connection = await this.mongoDbSeperateConnection(modelName);
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(modelName, "update"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            let { notAllowedAttributes } = flattenObjects;
            let ids = flattenObjects.objectToPassIntoFunction.map(x => x.id);
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                mongo_connection.updateMany(filterCondition, { "$set": updatedata }, {
                    multi: true,
                    new: true
                }).then(updatedData => {
                    if (updatedData.nModified > 0) {
                        filterCondition = updatedata;
                        filterCondition["_id"] = { $in: ids }
                        let passingDataForGetAll = {
                            data: {
                                "filterCondition": module.filterConditionFunction(filterCondition, onlyIncludeDeleted),
                                "onlyIncludeDeleted": onlyIncludeDeleted
                            },
                            "operationsContext": null,
                            "locationOfModel": locationOfModel
                        }

                        module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                            return resolve(findAllFetchedData);
                        }).catch(e => {
                            debug(e);
                            return reject(`error Occured:${e}`);
                        });
                    }
                    else {
                        debug("no data updated");
                        return resolve("no data updated");
                    }
                }).catch(e => {
                    debug(e);
                    return reject(`error Occured:${e}`);
                });
            }
            else {
                debug("I think no data found to update all please check condition");
                return resolve("I think no data found to update all please check condition");
            }
        });
    });
}

module.deleteOne = (passeddata) => {
    return new Promise(async (resolve, reject) => {
        var { locationOfModel, data, operationsContext } = passeddata;
        let { parentData, updatedata, filterCondition } = module.makingFilterConditionProper(data);
        let modelName=this.fetchModelName(locationOfModel);
        let mongo_connection = await this.mongoDbSeperateConnection(modelName);
        let allPromise = module.processOperationsContextAndPassAsPromise(operationsContext, module.getTempModeldata(locationOfModel, data));
        allPromise.push(module.fetchNotAllowedAttributes(modelName, "delete"));
        Promise.all(allPromise).then(objectToPassIntoFunction => {
            let flattenObjects = module.flattenPromiseObject(objectToPassIntoFunction);
            if (!_.isEmpty(flattenObjects.objectToPassIntoFunction)) {
                let passingDataForUpdateAll = {
                    data: {
                        "filterCondition": filterCondition,
                        "updatedata": { "isDeleted": true },
                        "onlyIncludeDeleted": true
                    },
                    "operationsContext": {
                        "findValuesBeforeUpdate": {
                            "functioName": "findAll", "locationOfModel": locationOfModel, "objectToPassIntoFunction": { "filterCondition": filterCondition }
                        }
                    },
                    "locationOfModel": locationOfModel
                }
                module.updateAll(passingDataForUpdateAll).then(updatedData => {
                    if (!_.isEmpty(updatedData)) {
                        let { onlyIncludeDeleted } = passingDataForUpdateAll.data;
                        let passingDataForGetAll = {
                            data: {
                                "filterCondition": module.filterConditionFunction(filterCondition, onlyIncludeDeleted)
                            },
                            "operationsContext": operationsContext,
                            "locationOfModel": locationOfModel
                        }
                        // module.findAll(passingDataForGetAll).then(findAllFetchedData => {
                        return resolve(updatedData);
                        //}).catch(e => {
                        //   debug(e);
                        // return reject(`error Occured:${e}`);
                        //  });
                    }
                    else {
                        debug("no data updated");
                        return resolve("no data updated");
                    }
                }).catch(e => {
                    debug(e);
                    return reject(`error Occured:${e}`);
                });
            }
            else {
                debug("I think someone try same data addition again.")
                return reject("I think someone try same data addition again.");
            }
        }).catch(e => {
            debug(e);
            return reject(`error Occured:${e}`);
        });
    });
}

//#region utility function for mongo filter condition

module.filterConditionFunction = (filterCondition, onlyIncludeDeleted) => {
    if (!_.isEmpty(filterCondition) && _.isBoolean(onlyIncludeDeleted) && onlyIncludeDeleted) {
        filterCondition["isDeleted"] = true;
    }
    else {
        filterCondition["isDeleted"] = false;
    }
    return filterCondition;
}

module.makingFilterConditionProper = (data) => {
    let { parentData, filterCondition, onlyIncludeDeleted } = data;
    data[filterCondition] = module.filterConditionFunction(filterCondition, onlyIncludeDeleted);
    return data;
}

module.fetchNotAllowedAttributes = (modelName, operation, passedFilterdata) => {
    return new Promise((resolve, reject) => {

        module.filterAttribute(modelName, operation).then(filterAttributeFetchedData => {
            if (!_.isEmpty(passedFilterdata)) {
                filterAttributeFetchedData = _.merge(filterAttributeFetchedData, passedFilterdata)
            }
            let { skip, limit, notAllowedToTouch, requiredFields, primaryKey } = filterAttributeFetchedData;

            filterAttributeFetchedData.notAllowedToTouch.push("isNew");
            notAllowedToTouch=_.difference(notAllowedToTouch,requiredFields);
            let notAllowedAttributes = _.reduce(notAllowedToTouch, function (obj, param) {
                obj[param] = 0
                return obj;
            }, {});
            return resolve({ "notAllowedAttributes": notAllowedAttributes, "allowedAttributes": requiredFields, "defaultskip": skip, "defaultlimit": limit, "primaryKeyFromTable": primaryKey });
        }).catch(e => {
            return reject(`error Occured:${e}`);
        });
    });
}

module.filterAttribute = (modelName, operation) => {
    return new Promise(async (resolve, reject) => {
        let mongo_connection = await this.mongoDbSeperateConnection("table");
        mongo_connection.findOne({ "name": modelName }, (err, res) => {
            if (err) {
                debug(err);
            }
            else if (res == null) {
                configPerameterfetch("defaultAllowedOperationContext").then(res => {
                    let response = _.assign({}, res[operation]);
                    response["primaryKey"] = res["primaryKey"];
                    //  response["primaryKey"]=res["primaryKey"];

                    return resolve(response);
                }).catch(e => {
                    return reject("error in finding allowed Operation")
                });
            }
            else {
                let response = _.assign({}, res.allowedOperationsContext[operation]);
                response["primaryKey"] = res.allowedOperationsContext["primaryKey"];
                if (_.isEmpty(response["primaryKey"])) {
                    response["primaryKey"] = "username";
                }
                // let filterdata = res.allowedOperationsContext[operation];
                return resolve(response);
            }
        }).catch(e => {
            return reject(`error Occured:${e}`);
        });;
    });
}

module.creatingFilterConditionBasedOnUpdatedData = (updatedData) => {
    let filterCondition = {};
    Object.keys(updateData).forEach((value, index, array) => {

    });
}

module.getTempModeldata = (modelLocation, data) => {
    let model = require(path.resolve(modelLocation)).model;
    let tempdata = new model(data);
    return tempdata._doc;
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

exports.fetchModelName=(locationOfModel)=>{
    return require(path.resolve(locationOfModel)).model.modelName;
}


//#endregion


//#region model finding and mongo connection 
exports.mongoDbSeperateConnection = (modelName) => {
    return new Promise(async (resolve, reject) => {
        try {
            let configs = await configPerameterfetch("mongo_connection");
            let { uri, port, dbname, username, password, options } = _.merge(mongooseDefaultConnectionValues, configs)
            debug("In mongo Db Connection Create function !!!!");
            //mongodb+srv://zealshah:<password>@cluster0.munlx.mongodb.net/test
            let urlForDB = `mongodb+srv://${username}:${password}@${uri}/${dbname}`;
            debug(`Trying to connect to Mongo db on:- ${urlForDB}`)
            let newConnection = mongoose.createConnection(`${urlForDB}`, options);
            let mongo_connection=newConnection.model(modelName, require(path.resolve(`./model/${modelName}`)).model.schema);
            resolve(mongo_connection);
            // .then(con => {
            //     debug("Mongo db is connected.");
            //     debug(`out from mongo Db Connection Create function !!!!`);
            //     return resolve(con);
            // });
        }
        catch (e) {
            debug(`Mongo db connection is not established because of ${JSON.stringify(e)}!!!!!!`);
            debug(`Out from mongo Db Connection Create function !!!!`);
            return reject(e);
        }
    });
}



/**
 * @method mongoDbConnectionCreate
 * @returns It will create mongo connection
 * @description it will create connection to mongo database.
 */
exports.mongoDbConnectionCreate = (mongoOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { uri, port, dbname, username, password, options } = _.merge(mongooseDefaultConnectionValues, mongoOptions)
            debug("In mongo Db Connection Create function !!!!");
            //mongodb+srv://zealshah:<password>@cluster0.munlx.mongodb.net/test
            let urlForDB = `mongodb+srv://${username}:${password}@${uri}/${dbname}`;
            debug(`Trying to connect to Mongo db on:- ${urlForDB}`)
            let con = await mongoose.connect(`${urlForDB}`, options);
            resolve(con);
            // .then(con => {
            //     debug("Mongo db is connected.");
            //     debug(`out from mongo Db Connection Create function !!!!`);
            //     return resolve(con);
            // });
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

//#endregion

//#region removing whole db 
/**
 * @description it will remove whole db from database.
 */
module.removeWholeDb =  (passeddata) => {
    return new Promise(async (resolve, reject) => {
        let configs = await configPerameterfetch("mongo_connection");
        let { uri, port, dbname, username, password, options } = _.merge(mongooseDefaultConnectionValues, configs)
        debug("In mongo Db Connection Create function !!!!");
        //mongodb+srv://zealshah:<password>@cluster0.munlx.mongodb.net/test
        let urlForDB = `mongodb+srv://${username}:${password}@${uri}/${dbname}`;
        debug(`Trying to connect to Mongo db on:- ${urlForDB}`)
        let newConnection = mongoose.createConnection(`${urlForDB}`, options);
        newConnection.dropDatabase().then(() => {
            debug("DB is droped.")
            resolve("DB is droped.");
        }).catch((err) => {
            debug("db is not dropped there is some error" + err.toString());
            reject("db is not dropped there is some error" + err.toString());
        });
    })


}
//#endregion

exports.module = module;
