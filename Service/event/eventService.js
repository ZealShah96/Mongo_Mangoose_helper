const EventEmitter = require('events');
class MyEmitter extends EventEmitter { }
const myEmitter = new MyEmitter();
const debug = require('./../debug/debugService').debugConsole(__dirname, __filename);

/**
 * @description it is require event create a event of require.
 * 
 */
var requireEmitCreator = () => {
  myEmitter.on('require', (filePath) => {
    debug("Require Event Called....!!!!!");
    debug(`${filePath} is going to recached.`);
    try {
     // let value = require.resolve(filePath);
      delete require.cache[filePath];
      debug(`${filePath} is unchaced.`);
    }
    catch (err) {
      debug(`Uncaching is not executed for file:-${filePath}.`)
    }
  });
}

/**
 * @description it is require event create a event of require.
 * 
 */
var EmitRequireEvent = (filePath) => {
  myEmitter.emit('require',(filePath));
}



module.exports.requireEvent = { "onRequire": requireEmitCreator, "emitRequire": EmitRequireEvent };
