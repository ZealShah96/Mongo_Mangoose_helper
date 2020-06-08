var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var table = new Schema({
  name:  String, // String is shorthand for {type: String}
  allowedOperationsContext:Object,
  createdBy: String,
  model_location:String,
  date: { type: Date, default: Date.now },
});

var model = mongoose.model("table", table);
module.exports={model};