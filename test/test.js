let assert = require('assert');
let expect = require('chai').expect;
let utility=require('./../Service/utility/utilityService');

//,"notUndefindedandnotNull","notEmptyStringandnotEmptyObject"   ,   "notNull","notUndefind",
let object={"notNull":null,"notUndefind":undefined,"notEmptyString":"","notEmptyObject":{}}

describe('checking not null function is working.',function (){
["notNull","notUndefind","notEmptyString",].forEach(elementString=>{
    [null,"zeal","1",1,undefined,"",{}].forEach(element=>{
        it(`Success ||Expect_Value:${!(element===object[elementString])}|| value is ${element} and checking condition is ${elementString} `,function (){
            let notNull=utility.checkValueShouldBeInArray(element,elementString);
            expect(notNull).to.deep.equal(!(element===object[elementString]));
        });
    });
    });
    //null,"zeal","1",1,undefined,"",
    [null,"zeal","1",1,undefined,"",{}].forEach(element=>{
        let elementString="notEmptyObject";
        let testResult=!(JSON.stringify(element) === JSON.stringify({}));
        it(`Success ||Expect_Value:${testResult}|| value is ${element} and checking condition is ${elementString} `,function (){
            let outputValue=utility.checkValueShouldBeInArray(element,elementString);
            expect(outputValue).to.deep.equal(testResult);
        });
    });

}).beforeAll(() => {
    console.log("====================================Checking check should be in array Test===========================");
}).afterAll(() => {
    console.log("====================================End Checking check should be in array Test============================");
});






