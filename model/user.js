var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = new Schema({
  name: {type:String,default:"testuser123"}, 
  username:{type:String,default:"userid123"},
  password:{type:String,default:"P@ssword123"},
  date: { type: Date, default: Date.now },
});

var model = mongoose.model("user", user);
module.exports={model};