var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = new Schema({
  name:  String, 
  username: String,
  password:String,
  date: { type: Date, default: Date.now },
});

var model = mongoose.model("user", user);
module.exports={model};