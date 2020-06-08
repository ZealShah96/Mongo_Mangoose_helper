var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var socialLink = new Schema({
  name:  String, 
  connectedUser:String,
  socialLinksContext: Object,
  specialityContext:Object,
  date: { type: Date, default: Date.now },
});

var model = mongoose.model("socialLink", socialLink);
module.exports={model};