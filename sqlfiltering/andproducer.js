function createAndFilter (lib, BooleanFilter) {
  'use strict';

  function AndFilter (descriptor) {
    BooleanFilter.call(this, descriptor);
  }
  lib.inherit(AndFilter, BooleanFilter);
  AndFilter.prototype.booleanKeyword = 'AND';
  AndFilter.prototype.addToCreateObject = function (obj) {
    this.subfilters.forEach(function (sf) {sf.addToCreateObject(obj)});
    obj = null;
  };

  return AndFilter;
}
module.exports = createAndFilter;