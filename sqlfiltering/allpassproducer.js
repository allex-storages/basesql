function createAllPassFilter (lib, BaseFilter) {
  'use strict';

  function AllPassFilter () {
    BaseFilter.call(this);
  }
  lib.inherit(AllPassFilter, BaseFilter);
  AllPassFilter.prototype.getQueryConditional = function (clause) {
    return '';
  };

  return AllPassFilter;
}
module.exports = createAllPassFilter;