var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mongoConnection = new Schema({
  title:  String, // String is shorthand for {type: String}
  author: String,
  date: { type: Date, default: Date.now },
});

var model = mongoose.model("mongoConnection", mongoConnection);
module.exports={model};