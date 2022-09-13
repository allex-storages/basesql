function createSqlFiltering (execlib, sqlsentencinglib) {
  'use strict';

  var lib = execlib.lib;

  var mylib = {};
  var map = new lib.Map();


  mylib.Factory = function(descriptor) {
    if (!descriptor) {
      return new AllPassFilter();
    }
    var filterctor = map.get(descriptor.op);
    if (!filterctor) {
      console.error('MSSQL Storage filter factory does not support', descriptor.op);
      filterctor = BaseFilter;
    }
    return new filterctor(descriptor);
  };

  var BaseFilter = require('./baseproducer')(lib);
  var AllPassFilter = require('./allpassproducer')(lib, BaseFilter);
  var PropertyFilter = require('./propertycreator')(lib, BaseFilter);
  var EqFilter = require('./eqproducer')(lib, PropertyFilter, sqlsentencinglib);
  var LtFilter = require('./ltproducer')(lib, PropertyFilter, sqlsentencinglib);

  var BooleanFilter = require('./booleanproducer')(lib, BaseFilter, mylib.Factory);
  var BooleanBinaryFilter = require('./booleanbinaryproducer')(lib, BooleanFilter, mylib.Factory);
  var AndFilter = require('./andproducer')(lib, BooleanBinaryFilter);
  map.add('eq', EqFilter);
  map.add('lt', LtFilter);
  map.add('and', AndFilter);

  return mylib;
}
module.exports = createSqlFiltering;