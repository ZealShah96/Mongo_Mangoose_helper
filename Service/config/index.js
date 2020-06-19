/**Intialization of most common used package. */
let _ = require('lodash');
let path = require('path');

/**Intialization main methods*/
module.findConfigPerameter = (perameterName) => {
    return new Promise((resolve, reject) => {
        try {
            console.log(process.argv[3]);
            // if(_.isUndefined(process.argv[3])){ console.log(`Config file is undefined which is not allowed`); return reject(`Config file is undefined which is not allowed`); }
            if (!_.isEmpty(perameterName)) return resolve(require(path.resolve(`./config/${process.argv[3]}`))[perameterName]);
            else if (_.isEmpty(perameterName)) { console.log(`Perameter name is not passed in function so add something in perameter name.`); return reject(`Perameter name is not passed in function so add something in perameter name.`) };
            return reject("undefined error");
        }
        catch (e) {
            return reject(e);
        }
    });
}

exports.module = module;