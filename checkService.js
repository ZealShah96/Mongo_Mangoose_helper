const express = require('express')
const utilityService = require('./Service/utility/utilityService');
const config = require('./Service/config/config');
const debug = require('./Service/debug/debugService').debugConsole(__dirname, __filename);
const mongoOperations=require('./Service/mongo/mongoService');
const app = express();
let port = config.findVariableAvaiableInConfiguration('port');
debug(`Server will be start on this port:- ${port}`);
let url = config.findVariableAvaiableInConfiguration('url');
debug(`Server will be start on this url:- ${url}`);


app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, url, async () => { 
    //console.log(app);
    try{
        debug(`Example app listening on port ${port}!`) 
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.create("user",{"id":1,"name":"zeal"},{"requiredFields":[]})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.findOne("user",{"id":1},{"skip":2,"limit":9,"requiredFields":[]})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.findOne("user",{"id":1},{"skip":2,"limit":9,"requiredFields":["id"]})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.findAll("user",{"id":1},{"skip":0,"limit":2,"requiredFields":["id","name"]})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.findAll("user",{"id":1},{"skip":0,"limit":2,"requiredFields":[]})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.findAll("user",{"id":1},{"skip":0,"limit":2})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.updateOne("user",{"id":1},{"id":2,"name":"zeal you!!!!"})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.updateAll("user",{"id":1},{"id":2,"name":"Prizea"})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.deleteOne("user",{"id":1},{})));
        debug("============================================================================");
        debug(JSON.stringify(await mongoOperations.deleteAll("user",{"id":1},{})));
        debug("============================================================================");
    }
   catch(err){
       console.log(err);
   }
});


