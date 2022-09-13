function createBooleanFilter (lib, BaseFilter, factory) {
  'use strict';

  function BooleanFilter (descriptor) {
    BaseFilter.call(this, descriptor);
    this.subfilters = descriptor.filters.map(factory);
  }
  lib.inherit(BooleanFilter, BaseFilter);
  BooleanFilter.prototype.destroy = function () {
    this.subfilters = null;
    BaseFilter.prototype.destroy.call(this);
  };

  return BooleanFilter;
}
module.exports = createBooleanFilter;