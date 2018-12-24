let assert = require('assert');
let expect = require('chai').expect;
let utility=require('./../Service/utility/utilityService');

//,"notUndefindedandnotNull","notEmptyStringandnotEmptyObject"   ,   "notNull","notUndefind",
let object={"notNull":null,"notUndefind":undefined,"notEmptyString":"","notEmptyObject":{}}

describe('checking not null function is working.',function (){
["notNull","notUndefind","notEmptyString","notEmptyObject"].forEach(elementString=>{
    [null,"zeal","1",1,undefined,"",{}].forEach(element=>{
        it(`Expect:Success ||Expect_Value:${element===object[elementString]}|| value is ${element} and checking condition is ${elementString} `,function (){
            let notNull=utility.checkValueShouldBeInArray(element,elementString);
            expect(notNull).to.deep.equal(element===object[elementString]);
        });
    });
    });
});






