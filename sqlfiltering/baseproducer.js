function createBaseFilter (lib) {
  'use strict';

  function BaseFilter (descriptor) {

  }
  BaseFilter.prototype.destroy = function () {

  };
  BaseFilter.prototype.getQueryConditional = function (clause) {
    var qc = this.generateQueryConditional();
    //clause = clause || 'WHERE';
    return (lib.isString(qc) && qc.length>0) ? clause+' '+qc : '';
  };
  BaseFilter.prototype.generateQueryConditional = function () {
    return "";
  };
  BaseFilter.prototype.addToCreateObject = function (obj) {};

  return BaseFilter;
}
module.exports = createBaseFilter;