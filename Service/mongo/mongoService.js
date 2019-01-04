const path = require('path');
var mongoose = require('mongoose');
const resolve = path.resolve;
const checkValueShouldBeInArray = require('../utility/utilityService').checkValueShouldBeInArray;
const utility = require('../utility/utilityService');
let mongoService = require('./mongoService');
let findKey = require('../config/config').findVariableAvaiableInConfiguration;
let closeDbConnection = require('./mongoService').mongoDbConnectionClose;
const debug = require('../debug/debugService').debugConsole(__dirname, __filename);
let mongoConnection = mongoose.createConnection();


//#region model finding and mongo connection 

/**
 * @method mongoDbConnectionCreate
 * @returns It will create mongo connection
 * @description it will create connection to mongo database.
 */
exports.mongoDbConnectionCreate = async () => {
    try {
    
        debug("In mongo Db Connection Create function !!!!");
        let mongo = findKey('mongo_connection');
        let urlForDB = `mongodb://${mongo.URI}:${mongo.Port}/${mongo.dbName}`;
        debug(`Trying to connect to Mongo db on:- ${urlForDB}`);
        //mongodb://localhost:27017/myapp
        //   127.0.0.1

        mongoConnection = await mongoose.connect(`${urlForDB}`, { useNewUrlParser: true });
        var db = mongoose.connection;
        //Bind connection to error event (to get notification of connection errors)
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
        // db.once("open", function(callback){
        //          console.log("Connection Succeeded."); /* Once the database connection has succeeded, the code in db.once is executed. */
        //     });
        debug("Mongo db is connected.");
        debug(`out from mongo Db Connection Create function !!!!`);
        return mongoConnection;
    }
    catch (err) {
        debug(`Mongo db connection is not established because of ${JSON.stringify(err)}!!!!!!`);
        debug(`out from mongo Db Connection Create function !!!!`);
        throw err;
    }
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
                    if(doc!=null){
                        let data = await mongoService.filterAttributes(doc._doc, customHeaders.requiredFields);
                        deletedData.push(data);
                        return resolve(deletedData);
                    }
                    else{
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



