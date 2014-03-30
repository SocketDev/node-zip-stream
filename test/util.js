/*global before,describe,it */
var fs = require('fs');
var assert = require('chai').assert;

var helpers = require('./helpers');
var utils = require('../lib/util');

var BinaryStream = helpers.BinaryStream;
var ChecksumStream = require('../lib/util/ChecksumStream');
var DeadEndStream = helpers.DeadEndStream;
var DeflateRawChecksum = require('../lib/util/DeflateRawChecksum');

var testDateString = 'Jan 03 2013 14:26:38 GMT';
var testDate = new Date(testDateString);
var testDateDosUTC = 1109619539;
var testTimezoneOffset = testDate.getTimezoneOffset();

var testDateOverflow = new Date('Jan 1 2044 00:00:00 GMT');
var testDateOverflowDosUTC = 2141175677;

var testDateUnderflow = new Date('Dec 30 1979 23:59:58 GMT');
var testDateUnderflowDosUTC = 2162688;

describe('utils', function() {

  describe('ChecksumStream', function() {
    it('should checksum data while transforming data', function(done) {
      var binary = new BinaryStream(20000);
      var checksum = new ChecksumStream();
      var deadend = new DeadEndStream();

      checksum.on('end', function() {
        assert.equal(checksum.digest, 4024292205);

        done();
      });

      checksum.pipe(deadend);
      binary.pipe(checksum);
    });

    it('should calculate data size while transforming data', function(done) {
      var binary = new BinaryStream(20000);
      var checksum = new ChecksumStream();
      var deadend = new DeadEndStream();

      checksum.on('end', function() {
        assert.equal(checksum.rawSize, 20000);

        done();
      });

      checksum.pipe(deadend);
      binary.pipe(checksum);
    });
  });

  describe('convertDateTimeDos(input)', function() {
    it('should convert DOS input into an instance of Date', function() {
      var actual = helpers.adjustDateByOffset(utils.convertDateTimeDos(testDateDosUTC), testTimezoneOffset);

      assert.deepEqual(actual, testDate);
    });
  });

  describe('dateify(dateish)', function() {
    it('should return an instance of Date', function() {
      assert.instanceOf(utils.dateify(testDate), Date);
      assert.instanceOf(utils.dateify(testDateString), Date);
      assert.instanceOf(utils.dateify(null), Date);
    });

    it('should passthrough an instance of Date', function() {
      assert.deepEqual(utils.dateify(testDate), testDate);
    });

    it('should convert dateish string to an instance of Date', function() {
      assert.deepEqual(utils.dateify(testDateString), testDate);
    });
  });

  describe('defaults(object, source, guard)', function() {
    it('should default when object key is missing', function() {
      var actual = utils.defaults({ value1: true }, {
        value2: true
      });

      assert.deepEqual(actual, {
        value1: true,
        value2: true
      });
    });
  });

  describe('dosDateTime(date, utc)', function() {
    it('should convert date into its DOS representation', function() {
      assert.equal(utils.dosDateTime(testDate, true), testDateDosUTC);
    });

    it('should prevent UInt32 underflow', function () {
      assert.equal(utils.dosDateTime(testDateUnderflow, true), testDateUnderflowDosUTC);
    });

    it('should prevent UInt32 overflow', function () {
      assert.equal(utils.dosDateTime(testDateOverflow, true), testDateOverflowDosUTC);
    });
  });

  describe('isStream(source)', function() {
    it('should return true if source is a stream', function() {
      assert.ok(utils.isStream(new DeadEndStream()));
    });
  });

  describe('sanitizePath(filepath)', function() {
    it('should sanitize filepath', function() {
      assert.equal(utils.sanitizePath('\\this/path//file.txt'), 'this/path/file.txt');
      assert.equal(utils.sanitizePath('/this/path/file.txt'), 'this/path/file.txt');
      assert.equal(utils.sanitizePath('c:\\this\\path\\file.txt'), 'c/this/path/file.txt');
    });
  });

  describe('unixifyPath(filepath)', function() {
    it('should unixify filepath', function() {
      assert.equal(utils.unixifyPath('this\\path\\file.txt'), 'this/path/file.txt');
    });
  });

});