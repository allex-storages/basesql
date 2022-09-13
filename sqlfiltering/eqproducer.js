function createEqFilter (lib, PropertyFilter, sqlsentencinglib) {
  'use strict';

  function EqFilter (descriptor){
    PropertyFilter.call(this, descriptor);
  }
  lib.inherit(EqFilter, PropertyFilter);
  EqFilter.prototype.generateQueryConditional = function () {
    return sqlsentencinglib.entityNameOf(this.field)+' = '+sqlsentencinglib.toSqlValue(this.value);
  };
  EqFilter.prototype.addToCreateObject = function (obj) {
    obj[this.field] = this.value;
  };

  return EqFilter;
}
module.exports = createEqFilter;