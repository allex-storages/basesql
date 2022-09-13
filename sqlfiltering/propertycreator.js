function createPropertyFilter (lib, BaseFilter){
  'use strict';

  function PropertyFilter (descriptor) {
    BaseFilter.call(this, descriptor);
    this.field = descriptor.field;
    this.value = descriptor.value;
  }
  lib.inherit(PropertyFilter, BaseFilter);
  PropertyFilter.prototype.destroy = function () {
    this.value = null;
    this.field = null;
    BaseFilter.prototype.destroy.call(this);
  };

  return PropertyFilter;
}
module.exports = createPropertyFilter;