function createOrFilter (lib, BooleanFilter) {
  'use strict';

  function OrFilter (descriptor) {
    BooleanFilter.call(this, descriptor);
  }
  lib.inherit(OrFilter, BooleanFilter);
  OrFilter.prototype.booleanKeyword = 'OR';

  return OrFilter;
}
module.exports = createOrFilter;