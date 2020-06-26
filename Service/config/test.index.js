var assert = require('assert');
describe('testing config functions', function() {
  describe('#findConfigPerameter()', function() {
    let returnValue=4000;
    it(`should return ${returnValue} when the process is present`, function() {
      require('./index').findConfigPerameter("port").then((value) => {
        console.log(value);
        assert.equal(value,returnValue);
      });
    });
   let returnValue1=`Perameter name is not passed in function so add something in perameter name.`;
    it(`should return "${returnValue1}" when the perameterValue isnot present`, function() {
      require('./index').findConfigPerameter().catch((value) => {
        assert.equal(value,returnValue1);
      });
    });
  });
});