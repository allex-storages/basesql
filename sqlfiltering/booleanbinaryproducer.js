function createBooleanBinaryFilter (lib, BooleanFilter, factory) {
  'use strict';

  function BooleanBinaryFilter (descriptor) {
    BooleanFilter.call(this, descriptor);
    this.subfilters = descriptor.filters.map(factory);
  }
  lib.inherit(BooleanBinaryFilter, BooleanFilter);
  BooleanBinaryFilter.prototype.destroy = function () {
    this.subfilters = null;
    BooleanFilter.prototype.destroy.call(this);
  };
  BooleanBinaryFilter.prototype.getQueryConditional = function (clause) {
    return clause + '('+ this.subfilters.map(
      function (f) {
        return '('+f.getQueryConditional('')+')';
      }).join(' '+this.booleanKeyword+' ')+')';
  };

  return BooleanBinaryFilter;
}
module.exports = createBooleanBinaryFilter;