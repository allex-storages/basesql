function createLtFilter (lib, PropertyFilter, sqlsentencinglib) {
  'use strict';

  function LtFilter (descriptor){
    PropertyFilter.call(this, descriptor);
  }
  lib.inherit(LtFilter, PropertyFilter);
  LtFilter.prototype.generateQueryConditional = function () {
    return sqlsentencinglib.entityNameOf(this.field)+' <= '+sqlsentencinglib.toSqlValue(this.value);
  };

  return LtFilter;
}
module.exports = createLtFilter;