(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.PubNub = factory());
})(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var cbor = {exports: {}};

	/*
	 * The MIT License (MIT)
	 *
	 * Copyright (c) 2014 Patrick Gansterer <paroga@paroga.com>
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	(function (module) {
		(function(global, undefined$1) {	var POW_2_24 = Math.pow(2, -24),
		    POW_2_32 = Math.pow(2, 32),
		    POW_2_53 = Math.pow(2, 53);

		function encode(value) {
		  var data = new ArrayBuffer(256);
		  var dataView = new DataView(data);
		  var lastLength;
		  var offset = 0;

		  function ensureSpace(length) {
		    var newByteLength = data.byteLength;
		    var requiredLength = offset + length;
		    while (newByteLength < requiredLength)
		      newByteLength *= 2;
		    if (newByteLength !== data.byteLength) {
		      var oldDataView = dataView;
		      data = new ArrayBuffer(newByteLength);
		      dataView = new DataView(data);
		      var uint32count = (offset + 3) >> 2;
		      for (var i = 0; i < uint32count; ++i)
		        dataView.setUint32(i * 4, oldDataView.getUint32(i * 4));
		    }

		    lastLength = length;
		    return dataView;
		  }
		  function write() {
		    offset += lastLength;
		  }
		  function writeFloat64(value) {
		    write(ensureSpace(8).setFloat64(offset, value));
		  }
		  function writeUint8(value) {
		    write(ensureSpace(1).setUint8(offset, value));
		  }
		  function writeUint8Array(value) {
		    var dataView = ensureSpace(value.length);
		    for (var i = 0; i < value.length; ++i)
		      dataView.setUint8(offset + i, value[i]);
		    write();
		  }
		  function writeUint16(value) {
		    write(ensureSpace(2).setUint16(offset, value));
		  }
		  function writeUint32(value) {
		    write(ensureSpace(4).setUint32(offset, value));
		  }
		  function writeUint64(value) {
		    var low = value % POW_2_32;
		    var high = (value - low) / POW_2_32;
		    var dataView = ensureSpace(8);
		    dataView.setUint32(offset, high);
		    dataView.setUint32(offset + 4, low);
		    write();
		  }
		  function writeTypeAndLength(type, length) {
		    if (length < 24) {
		      writeUint8(type << 5 | length);
		    } else if (length < 0x100) {
		      writeUint8(type << 5 | 24);
		      writeUint8(length);
		    } else if (length < 0x10000) {
		      writeUint8(type << 5 | 25);
		      writeUint16(length);
		    } else if (length < 0x100000000) {
		      writeUint8(type << 5 | 26);
		      writeUint32(length);
		    } else {
		      writeUint8(type << 5 | 27);
		      writeUint64(length);
		    }
		  }
		  
		  function encodeItem(value) {
		    var i;

		    if (value === false)
		      return writeUint8(0xf4);
		    if (value === true)
		      return writeUint8(0xf5);
		    if (value === null)
		      return writeUint8(0xf6);
		    if (value === undefined$1)
		      return writeUint8(0xf7);
		  
		    switch (typeof value) {
		      case "number":
		        if (Math.floor(value) === value) {
		          if (0 <= value && value <= POW_2_53)
		            return writeTypeAndLength(0, value);
		          if (-POW_2_53 <= value && value < 0)
		            return writeTypeAndLength(1, -(value + 1));
		        }
		        writeUint8(0xfb);
		        return writeFloat64(value);

		      case "string":
		        var utf8data = [];
		        for (i = 0; i < value.length; ++i) {
		          var charCode = value.charCodeAt(i);
		          if (charCode < 0x80) {
		            utf8data.push(charCode);
		          } else if (charCode < 0x800) {
		            utf8data.push(0xc0 | charCode >> 6);
		            utf8data.push(0x80 | charCode & 0x3f);
		          } else if (charCode < 0xd800) {
		            utf8data.push(0xe0 | charCode >> 12);
		            utf8data.push(0x80 | (charCode >> 6)  & 0x3f);
		            utf8data.push(0x80 | charCode & 0x3f);
		          } else {
		            charCode = (charCode & 0x3ff) << 10;
		            charCode |= value.charCodeAt(++i) & 0x3ff;
		            charCode += 0x10000;

		            utf8data.push(0xf0 | charCode >> 18);
		            utf8data.push(0x80 | (charCode >> 12)  & 0x3f);
		            utf8data.push(0x80 | (charCode >> 6)  & 0x3f);
		            utf8data.push(0x80 | charCode & 0x3f);
		          }
		        }

		        writeTypeAndLength(3, utf8data.length);
		        return writeUint8Array(utf8data);

		      default:
		        var length;
		        if (Array.isArray(value)) {
		          length = value.length;
		          writeTypeAndLength(4, length);
		          for (i = 0; i < length; ++i)
		            encodeItem(value[i]);
		        } else if (value instanceof Uint8Array) {
		          writeTypeAndLength(2, value.length);
		          writeUint8Array(value);
		        } else {
		          var keys = Object.keys(value);
		          length = keys.length;
		          writeTypeAndLength(5, length);
		          for (i = 0; i < length; ++i) {
		            var key = keys[i];
		            encodeItem(key);
		            encodeItem(value[key]);
		          }
		        }
		    }
		  }
		  
		  encodeItem(value);

		  if ("slice" in data)
		    return data.slice(0, offset);
		  
		  var ret = new ArrayBuffer(offset);
		  var retView = new DataView(ret);
		  for (var i = 0; i < offset; ++i)
		    retView.setUint8(i, dataView.getUint8(i));
		  return ret;
		}

		function decode(data, tagger, simpleValue) {
		  var dataView = new DataView(data);
		  var offset = 0;
		  
		  if (typeof tagger !== "function")
		    tagger = function(value) { return value; };
		  if (typeof simpleValue !== "function")
		    simpleValue = function() { return undefined$1; };

		  function read(value, length) {
		    offset += length;
		    return value;
		  }
		  function readArrayBuffer(length) {
		    return read(new Uint8Array(data, offset, length), length);
		  }
		  function readFloat16() {
		    var tempArrayBuffer = new ArrayBuffer(4);
		    var tempDataView = new DataView(tempArrayBuffer);
		    var value = readUint16();

		    var sign = value & 0x8000;
		    var exponent = value & 0x7c00;
		    var fraction = value & 0x03ff;
		    
		    if (exponent === 0x7c00)
		      exponent = 0xff << 10;
		    else if (exponent !== 0)
		      exponent += (127 - 15) << 10;
		    else if (fraction !== 0)
		      return fraction * POW_2_24;
		    
		    tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);
		    return tempDataView.getFloat32(0);
		  }
		  function readFloat32() {
		    return read(dataView.getFloat32(offset), 4);
		  }
		  function readFloat64() {
		    return read(dataView.getFloat64(offset), 8);
		  }
		  function readUint8() {
		    return read(dataView.getUint8(offset), 1);
		  }
		  function readUint16() {
		    return read(dataView.getUint16(offset), 2);
		  }
		  function readUint32() {
		    return read(dataView.getUint32(offset), 4);
		  }
		  function readUint64() {
		    return readUint32() * POW_2_32 + readUint32();
		  }
		  function readBreak() {
		    if (dataView.getUint8(offset) !== 0xff)
		      return false;
		    offset += 1;
		    return true;
		  }
		  function readLength(additionalInformation) {
		    if (additionalInformation < 24)
		      return additionalInformation;
		    if (additionalInformation === 24)
		      return readUint8();
		    if (additionalInformation === 25)
		      return readUint16();
		    if (additionalInformation === 26)
		      return readUint32();
		    if (additionalInformation === 27)
		      return readUint64();
		    if (additionalInformation === 31)
		      return -1;
		    throw "Invalid length encoding";
		  }
		  function readIndefiniteStringLength(majorType) {
		    var initialByte = readUint8();
		    if (initialByte === 0xff)
		      return -1;
		    var length = readLength(initialByte & 0x1f);
		    if (length < 0 || (initialByte >> 5) !== majorType)
		      throw "Invalid indefinite length element";
		    return length;
		  }

		  function appendUtf16data(utf16data, length) {
		    for (var i = 0; i < length; ++i) {
		      var value = readUint8();
		      if (value & 0x80) {
		        if (value < 0xe0) {
		          value = (value & 0x1f) <<  6
		                | (readUint8() & 0x3f);
		          length -= 1;
		        } else if (value < 0xf0) {
		          value = (value & 0x0f) << 12
		                | (readUint8() & 0x3f) << 6
		                | (readUint8() & 0x3f);
		          length -= 2;
		        } else {
		          value = (value & 0x0f) << 18
		                | (readUint8() & 0x3f) << 12
		                | (readUint8() & 0x3f) << 6
		                | (readUint8() & 0x3f);
		          length -= 3;
		        }
		      }

		      if (value < 0x10000) {
		        utf16data.push(value);
		      } else {
		        value -= 0x10000;
		        utf16data.push(0xd800 | (value >> 10));
		        utf16data.push(0xdc00 | (value & 0x3ff));
		      }
		    }
		  }

		  function decodeItem() {
		    var initialByte = readUint8();
		    var majorType = initialByte >> 5;
		    var additionalInformation = initialByte & 0x1f;
		    var i;
		    var length;

		    if (majorType === 7) {
		      switch (additionalInformation) {
		        case 25:
		          return readFloat16();
		        case 26:
		          return readFloat32();
		        case 27:
		          return readFloat64();
		      }
		    }

		    length = readLength(additionalInformation);
		    if (length < 0 && (majorType < 2 || 6 < majorType))
		      throw "Invalid length";

		    switch (majorType) {
		      case 0:
		        return length;
		      case 1:
		        return -1 - length;
		      case 2:
		        if (length < 0) {
		          var elements = [];
		          var fullArrayLength = 0;
		          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
		            fullArrayLength += length;
		            elements.push(readArrayBuffer(length));
		          }
		          var fullArray = new Uint8Array(fullArrayLength);
		          var fullArrayOffset = 0;
		          for (i = 0; i < elements.length; ++i) {
		            fullArray.set(elements[i], fullArrayOffset);
		            fullArrayOffset += elements[i].length;
		          }
		          return fullArray;
		        }
		        return readArrayBuffer(length);
		      case 3:
		        var utf16data = [];
		        if (length < 0) {
		          while ((length = readIndefiniteStringLength(majorType)) >= 0)
		            appendUtf16data(utf16data, length);
		        } else
		          appendUtf16data(utf16data, length);
		        return String.fromCharCode.apply(null, utf16data);
		      case 4:
		        var retArray;
		        if (length < 0) {
		          retArray = [];
		          while (!readBreak())
		            retArray.push(decodeItem());
		        } else {
		          retArray = new Array(length);
		          for (i = 0; i < length; ++i)
		            retArray[i] = decodeItem();
		        }
		        return retArray;
		      case 5:
		        var retObject = {};
		        for (i = 0; i < length || length < 0 && !readBreak(); ++i) {
		          var key = decodeItem();
		          retObject[key] = decodeItem();
		        }
		        return retObject;
		      case 6:
		        return tagger(decodeItem(), length);
		      case 7:
		        switch (length) {
		          case 20:
		            return false;
		          case 21:
		            return true;
		          case 22:
		            return null;
		          case 23:
		            return undefined$1;
		          default:
		            return simpleValue(length);
		        }
		    }
		  }

		  var ret = decodeItem();
		  if (offset !== data.byteLength)
		    throw "Remaining bytes";
		  return ret;
		}

		var obj = { encode: encode, decode: decode };

		if (typeof undefined$1 === "function" && undefined$1.amd)
		  undefined$1("cbor/cbor", obj);
		else if (module.exports)
		  module.exports = obj;
		else if (!global.CBOR)
		  global.CBOR = obj;

		})(commonjsGlobal); 
	} (cbor));

	/******************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise, SuppressedError, Symbol */


	function __rest(s, e) {
	    var t = {};
	    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	        t[p] = s[p];
	    if (s != null && typeof Object.getOwnPropertySymbols === "function")
	        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
	            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
	                t[p[i]] = s[p[i]];
	        }
	    return t;
	}

	function __awaiter(thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	}

	typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
	    var e = new Error(message);
	    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
	};

	/**
	 * Crypto module.
	 */
	/**
	 * `String` to {@link ArrayBuffer} response decoder.
	 */
	new TextEncoder();
	/**
	 *  {@link ArrayBuffer} to {@link string} decoder.
	 */
	new TextDecoder();

	/**
	 * Encode `ArrayBuffer` as a Base64 encoded string.
	 *
	 * @param input ArrayBuffer with source data.
	 * @returns Base64 string with padding.
	 *
	 * @internal
	 */
	function encode(input) {
	    let base64 = '';
	    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	    const bytes = new Uint8Array(input);
	    const byteLength = bytes.byteLength;
	    const byteRemainder = byteLength % 3;
	    const mainLength = byteLength - byteRemainder;
	    let a, b, c, d;
	    let chunk;
	    // Main loop deals with bytes in chunks of 3
	    for (let i = 0; i < mainLength; i = i + 3) {
	        // Combine the three bytes into a single integer
	        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
	        // Use bitmasks to extract 6-bit segments from the triplet
	        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
	        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
	        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
	        d = chunk & 63; // 63       = 2^6 - 1
	        // Convert the raw binary segments to the appropriate ASCII encoding
	        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	    }
	    // Deal with the remaining bytes and padding
	    if (byteRemainder == 1) {
	        chunk = bytes[mainLength];
	        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
	        // Set the 4 least significant bits to zero
	        b = (chunk & 3) << 4; // 3   = 2^2 - 1
	        base64 += encodings[a] + encodings[b] + '==';
	    }
	    else if (byteRemainder == 2) {
	        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
	        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
	        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
	        // Set the 2 least significant bits to zero
	        c = (chunk & 15) << 2; // 15    = 2^4 - 1
	        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
	    }
	    return base64;
	}

	/**
	 * Request processing status categories.
	 */
	var StatusCategory;
	(function (StatusCategory) {
	    /**
	     * Call failed when network was unable to complete the call.
	     */
	    StatusCategory["PNNetworkIssuesCategory"] = "PNNetworkIssuesCategory";
	    /**
	     * Network call timed out.
	     */
	    StatusCategory["PNTimeoutCategory"] = "PNTimeoutCategory";
	    /**
	     * Request has been cancelled.
	     */
	    StatusCategory["PNCancelledCategory"] = "PNCancelledCategory";
	    /**
	     * Server responded with bad response.
	     */
	    StatusCategory["PNBadRequestCategory"] = "PNBadRequestCategory";
	    /**
	     * Server responded with access denied.
	     */
	    StatusCategory["PNAccessDeniedCategory"] = "PNAccessDeniedCategory";
	    /**
	     * Incomplete parameters provided for used endpoint.
	     */
	    StatusCategory["PNValidationErrorCategory"] = "PNValidationErrorCategory";
	    /**
	     * PubNub request acknowledgment status.
	     *
	     * Some API endpoints respond with request processing status w/o useful data.
	     */
	    StatusCategory["PNAcknowledgmentCategory"] = "PNAcknowledgmentCategory";
	    /**
	     * Something strange happened; please check the logs.
	     */
	    StatusCategory["PNUnknownCategory"] = "PNUnknownCategory";
	    // --------------------------------------------------------
	    // --------------------- Network status -------------------
	    // --------------------------------------------------------
	    /**
	     * SDK will announce when the network appears to be connected again.
	     */
	    StatusCategory["PNNetworkUpCategory"] = "PNNetworkUpCategory";
	    /**
	     * SDK will announce when the network appears to down.
	     */
	    StatusCategory["PNNetworkDownCategory"] = "PNNetworkDownCategory";
	    // --------------------------------------------------------
	    // -------------------- Real-time events ------------------
	    // --------------------------------------------------------
	    /**
	     * PubNub client reconnected to the real-time updates stream.
	     */
	    StatusCategory["PNReconnectedCategory"] = "PNReconnectedCategory";
	    /**
	     * PubNub client connected to the real-time updates stream.
	     */
	    StatusCategory["PNConnectedCategory"] = "PNConnectedCategory";
	    /**
	     * Received real-time updates exceed specified threshold.
	     *
	     * After temporary disconnection and catchup, this category means that potentially some
	     * real-time updates have been pushed into `storage` and need to be requested separately.
	     */
	    StatusCategory["PNRequestMessageCountExceededCategory"] = "PNRequestMessageCountExceededCategory";
	    /**
	     * PubNub client disconnected from the real-time updates streams.
	     */
	    StatusCategory["PNDisconnectedCategory"] = "PNDisconnectedCategory";
	    /**
	     * PubNub client wasn't able to connect to the real-time updates streams.
	     */
	    StatusCategory["PNConnectionErrorCategory"] = "PNConnectionErrorCategory";
	    /**
	     * PubNub client unexpectedly disconnected from the real-time updates streams.
	     */
	    StatusCategory["PNDisconnectedUnexpectedlyCategory"] = "PNDisconnectedUnexpectedlyCategory";
	})(StatusCategory || (StatusCategory = {}));
	var StatusCategory$1 = StatusCategory;

	class PubNubError extends Error {
	    constructor(message, status) {
	        super(message);
	        this.status = status;
	        this.name = 'PubNubError';
	        this.message = message;
	        Object.setPrototypeOf(this, new.target.prototype);
	    }
	}
	function createError(errorPayload) {
	    var _a;
	    (_a = errorPayload.statusCode) !== null && _a !== void 0 ? _a : (errorPayload.statusCode = 0);
	    return Object.assign(Object.assign({}, errorPayload), { statusCode: errorPayload.statusCode, category: StatusCategory$1.PNValidationErrorCategory, error: true });
	}
	function createValidationError(message, statusCode) {
	    return createError(Object.assign({ message }, (statusCode !== undefined ? { statusCode } : {})));
	}

	/*eslint-disable */

	/*
	 CryptoJS v3.1.2
	 code.google.com/p/crypto-js
	 (c) 2009-2013 by Jeff Mott. All rights reserved.
	 code.google.com/p/crypto-js/wiki/License
	 */
	var CryptoJS =
	  CryptoJS ||
	  (function (h, s) {
	    var f = {},
	      g = (f.lib = {}),
	      q = function () {},
	      m = (g.Base = {
	        extend: function (a) {
	          q.prototype = this;
	          var c = new q();
	          a && c.mixIn(a);
	          c.hasOwnProperty('init') ||
	            (c.init = function () {
	              c.$super.init.apply(this, arguments);
	            });
	          c.init.prototype = c;
	          c.$super = this;
	          return c;
	        },
	        create: function () {
	          var a = this.extend();
	          a.init.apply(a, arguments);
	          return a;
	        },
	        init: function () {},
	        mixIn: function (a) {
	          for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
	          a.hasOwnProperty('toString') && (this.toString = a.toString);
	        },
	        clone: function () {
	          return this.init.prototype.extend(this);
	        },
	      }),
	      r = (g.WordArray = m.extend({
	        init: function (a, c) {
	          a = this.words = a || [];
	          this.sigBytes = c != s ? c : 4 * a.length;
	        },
	        toString: function (a) {
	          return (a || k).stringify(this);
	        },
	        concat: function (a) {
	          var c = this.words,
	            d = a.words,
	            b = this.sigBytes;
	          a = a.sigBytes;
	          this.clamp();
	          if (b % 4)
	            for (var e = 0; e < a; e++)
	              c[(b + e) >>> 2] |= ((d[e >>> 2] >>> (24 - 8 * (e % 4))) & 255) << (24 - 8 * ((b + e) % 4));
	          else if (65535 < d.length) for (e = 0; e < a; e += 4) c[(b + e) >>> 2] = d[e >>> 2];
	          else c.push.apply(c, d);
	          this.sigBytes += a;
	          return this;
	        },
	        clamp: function () {
	          var a = this.words,
	            c = this.sigBytes;
	          a[c >>> 2] &= 4294967295 << (32 - 8 * (c % 4));
	          a.length = h.ceil(c / 4);
	        },
	        clone: function () {
	          var a = m.clone.call(this);
	          a.words = this.words.slice(0);
	          return a;
	        },
	        random: function (a) {
	          for (var c = [], d = 0; d < a; d += 4) c.push((4294967296 * h.random()) | 0);
	          return new r.init(c, a);
	        },
	      })),
	      l = (f.enc = {}),
	      k = (l.Hex = {
	        stringify: function (a) {
	          var c = a.words;
	          a = a.sigBytes;
	          for (var d = [], b = 0; b < a; b++) {
	            var e = (c[b >>> 2] >>> (24 - 8 * (b % 4))) & 255;
	            d.push((e >>> 4).toString(16));
	            d.push((e & 15).toString(16));
	          }
	          return d.join('');
	        },
	        parse: function (a) {
	          for (var c = a.length, d = [], b = 0; b < c; b += 2)
	            d[b >>> 3] |= parseInt(a.substr(b, 2), 16) << (24 - 4 * (b % 8));
	          return new r.init(d, c / 2);
	        },
	      }),
	      n = (l.Latin1 = {
	        stringify: function (a) {
	          var c = a.words;
	          a = a.sigBytes;
	          for (var d = [], b = 0; b < a; b++) d.push(String.fromCharCode((c[b >>> 2] >>> (24 - 8 * (b % 4))) & 255));
	          return d.join('');
	        },
	        parse: function (a) {
	          for (var c = a.length, d = [], b = 0; b < c; b++) d[b >>> 2] |= (a.charCodeAt(b) & 255) << (24 - 8 * (b % 4));
	          return new r.init(d, c);
	        },
	      }),
	      j = (l.Utf8 = {
	        stringify: function (a) {
	          try {
	            return decodeURIComponent(escape(n.stringify(a)));
	          } catch (c) {
	            throw Error('Malformed UTF-8 data');
	          }
	        },
	        parse: function (a) {
	          return n.parse(unescape(encodeURIComponent(a)));
	        },
	      }),
	      u = (g.BufferedBlockAlgorithm = m.extend({
	        reset: function () {
	          this._data = new r.init();
	          this._nDataBytes = 0;
	        },
	        _append: function (a) {
	          'string' == typeof a && (a = j.parse(a));
	          this._data.concat(a);
	          this._nDataBytes += a.sigBytes;
	        },
	        _process: function (a) {
	          var c = this._data,
	            d = c.words,
	            b = c.sigBytes,
	            e = this.blockSize,
	            f = b / (4 * e),
	            f = a ? h.ceil(f) : h.max((f | 0) - this._minBufferSize, 0);
	          a = f * e;
	          b = h.min(4 * a, b);
	          if (a) {
	            for (var g = 0; g < a; g += e) this._doProcessBlock(d, g);
	            g = d.splice(0, a);
	            c.sigBytes -= b;
	          }
	          return new r.init(g, b);
	        },
	        clone: function () {
	          var a = m.clone.call(this);
	          a._data = this._data.clone();
	          return a;
	        },
	        _minBufferSize: 0,
	      }));
	    g.Hasher = u.extend({
	      cfg: m.extend(),
	      init: function (a) {
	        this.cfg = this.cfg.extend(a);
	        this.reset();
	      },
	      reset: function () {
	        u.reset.call(this);
	        this._doReset();
	      },
	      update: function (a) {
	        this._append(a);
	        this._process();
	        return this;
	      },
	      finalize: function (a) {
	        a && this._append(a);
	        return this._doFinalize();
	      },
	      blockSize: 16,
	      _createHelper: function (a) {
	        return function (c, d) {
	          return new a.init(d).finalize(c);
	        };
	      },
	      _createHmacHelper: function (a) {
	        return function (c, d) {
	          return new t.HMAC.init(a, d).finalize(c);
	        };
	      },
	    });
	    var t = (f.algo = {});
	    return f;
	  })(Math);

	// SHA256
	(function (h) {
	  for (
	    var s = CryptoJS,
	      f = s.lib,
	      g = f.WordArray,
	      q = f.Hasher,
	      f = s.algo,
	      m = [],
	      r = [],
	      l = function (a) {
	        return (4294967296 * (a - (a | 0))) | 0;
	      },
	      k = 2,
	      n = 0;
	    64 > n;

	  ) {
	    var j;
	    a: {
	      j = k;
	      for (var u = h.sqrt(j), t = 2; t <= u; t++)
	        if (!(j % t)) {
	          j = !1;
	          break a;
	        }
	      j = !0;
	    }
	    j && (8 > n && (m[n] = l(h.pow(k, 0.5))), (r[n] = l(h.pow(k, 1 / 3))), n++);
	    k++;
	  }
	  var a = [],
	    f = (f.SHA256 = q.extend({
	      _doReset: function () {
	        this._hash = new g.init(m.slice(0));
	      },
	      _doProcessBlock: function (c, d) {
	        for (
	          var b = this._hash.words,
	            e = b[0],
	            f = b[1],
	            g = b[2],
	            j = b[3],
	            h = b[4],
	            m = b[5],
	            n = b[6],
	            q = b[7],
	            p = 0;
	          64 > p;
	          p++
	        ) {
	          if (16 > p) a[p] = c[d + p] | 0;
	          else {
	            var k = a[p - 15],
	              l = a[p - 2];
	            a[p] =
	              (((k << 25) | (k >>> 7)) ^ ((k << 14) | (k >>> 18)) ^ (k >>> 3)) +
	              a[p - 7] +
	              (((l << 15) | (l >>> 17)) ^ ((l << 13) | (l >>> 19)) ^ (l >>> 10)) +
	              a[p - 16];
	          }
	          k =
	            q +
	            (((h << 26) | (h >>> 6)) ^ ((h << 21) | (h >>> 11)) ^ ((h << 7) | (h >>> 25))) +
	            ((h & m) ^ (~h & n)) +
	            r[p] +
	            a[p];
	          l =
	            (((e << 30) | (e >>> 2)) ^ ((e << 19) | (e >>> 13)) ^ ((e << 10) | (e >>> 22))) +
	            ((e & f) ^ (e & g) ^ (f & g));
	          q = n;
	          n = m;
	          m = h;
	          h = (j + k) | 0;
	          j = g;
	          g = f;
	          f = e;
	          e = (k + l) | 0;
	        }
	        b[0] = (b[0] + e) | 0;
	        b[1] = (b[1] + f) | 0;
	        b[2] = (b[2] + g) | 0;
	        b[3] = (b[3] + j) | 0;
	        b[4] = (b[4] + h) | 0;
	        b[5] = (b[5] + m) | 0;
	        b[6] = (b[6] + n) | 0;
	        b[7] = (b[7] + q) | 0;
	      },
	      _doFinalize: function () {
	        var a = this._data,
	          d = a.words,
	          b = 8 * this._nDataBytes,
	          e = 8 * a.sigBytes;
	        d[e >>> 5] |= 128 << (24 - (e % 32));
	        d[(((e + 64) >>> 9) << 4) + 14] = h.floor(b / 4294967296);
	        d[(((e + 64) >>> 9) << 4) + 15] = b;
	        a.sigBytes = 4 * d.length;
	        this._process();
	        return this._hash;
	      },
	      clone: function () {
	        var a = q.clone.call(this);
	        a._hash = this._hash.clone();
	        return a;
	      },
	    }));
	  s.SHA256 = q._createHelper(f);
	  s.HmacSHA256 = q._createHmacHelper(f);
	})(Math);

	// HMAC SHA256
	(function () {
	  var h = CryptoJS,
	    s = h.enc.Utf8;
	  h.algo.HMAC = h.lib.Base.extend({
	    init: function (f, g) {
	      f = this._hasher = new f.init();
	      'string' == typeof g && (g = s.parse(g));
	      var h = f.blockSize,
	        m = 4 * h;
	      g.sigBytes > m && (g = f.finalize(g));
	      g.clamp();
	      for (var r = (this._oKey = g.clone()), l = (this._iKey = g.clone()), k = r.words, n = l.words, j = 0; j < h; j++)
	        (k[j] ^= 1549556828), (n[j] ^= 909522486);
	      r.sigBytes = l.sigBytes = m;
	      this.reset();
	    },
	    reset: function () {
	      var f = this._hasher;
	      f.reset();
	      f.update(this._iKey);
	    },
	    update: function (f) {
	      this._hasher.update(f);
	      return this;
	    },
	    finalize: function (f) {
	      var g = this._hasher;
	      f = g.finalize(f);
	      g.reset();
	      return g.finalize(this._oKey.clone().concat(f));
	    },
	  });
	})();

	// Base64
	(function () {
	  var u = CryptoJS,
	    p = u.lib.WordArray;
	  u.enc.Base64 = {
	    stringify: function (d) {
	      var l = d.words,
	        p = d.sigBytes,
	        t = this._map;
	      d.clamp();
	      d = [];
	      for (var r = 0; r < p; r += 3)
	        for (
	          var w =
	              (((l[r >>> 2] >>> (24 - 8 * (r % 4))) & 255) << 16) |
	              (((l[(r + 1) >>> 2] >>> (24 - 8 * ((r + 1) % 4))) & 255) << 8) |
	              ((l[(r + 2) >>> 2] >>> (24 - 8 * ((r + 2) % 4))) & 255),
	            v = 0;
	          4 > v && r + 0.75 * v < p;
	          v++
	        )
	          d.push(t.charAt((w >>> (6 * (3 - v))) & 63));
	      if ((l = t.charAt(64))) for (; d.length % 4; ) d.push(l);
	      return d.join('');
	    },
	    parse: function (d) {
	      var l = d.length,
	        s = this._map,
	        t = s.charAt(64);
	      t && ((t = d.indexOf(t)), -1 != t && (l = t));
	      for (var t = [], r = 0, w = 0; w < l; w++)
	        if (w % 4) {
	          var v = s.indexOf(d.charAt(w - 1)) << (2 * (w % 4)),
	            b = s.indexOf(d.charAt(w)) >>> (6 - 2 * (w % 4));
	          t[r >>> 2] |= (v | b) << (24 - 8 * (r % 4));
	          r++;
	        }
	      return p.create(t, r);
	    },
	    _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	  };
	})();

	// BlockCipher
	(function (u) {
	  function p(b, n, a, c, e, j, k) {
	    b = b + ((n & a) | (~n & c)) + e + k;
	    return ((b << j) | (b >>> (32 - j))) + n;
	  }
	  function d(b, n, a, c, e, j, k) {
	    b = b + ((n & c) | (a & ~c)) + e + k;
	    return ((b << j) | (b >>> (32 - j))) + n;
	  }
	  function l(b, n, a, c, e, j, k) {
	    b = b + (n ^ a ^ c) + e + k;
	    return ((b << j) | (b >>> (32 - j))) + n;
	  }
	  function s(b, n, a, c, e, j, k) {
	    b = b + (a ^ (n | ~c)) + e + k;
	    return ((b << j) | (b >>> (32 - j))) + n;
	  }
	  for (var t = CryptoJS, r = t.lib, w = r.WordArray, v = r.Hasher, r = t.algo, b = [], x = 0; 64 > x; x++)
	    b[x] = (4294967296 * u.abs(u.sin(x + 1))) | 0;
	  r = r.MD5 = v.extend({
	    _doReset: function () {
	      this._hash = new w.init([1732584193, 4023233417, 2562383102, 271733878]);
	    },
	    _doProcessBlock: function (q, n) {
	      for (var a = 0; 16 > a; a++) {
	        var c = n + a,
	          e = q[c];
	        q[c] = (((e << 8) | (e >>> 24)) & 16711935) | (((e << 24) | (e >>> 8)) & 4278255360);
	      }
	      var a = this._hash.words,
	        c = q[n + 0],
	        e = q[n + 1],
	        j = q[n + 2],
	        k = q[n + 3],
	        z = q[n + 4],
	        r = q[n + 5],
	        t = q[n + 6],
	        w = q[n + 7],
	        v = q[n + 8],
	        A = q[n + 9],
	        B = q[n + 10],
	        C = q[n + 11],
	        u = q[n + 12],
	        D = q[n + 13],
	        E = q[n + 14],
	        x = q[n + 15],
	        f = a[0],
	        m = a[1],
	        g = a[2],
	        h = a[3],
	        f = p(f, m, g, h, c, 7, b[0]),
	        h = p(h, f, m, g, e, 12, b[1]),
	        g = p(g, h, f, m, j, 17, b[2]),
	        m = p(m, g, h, f, k, 22, b[3]),
	        f = p(f, m, g, h, z, 7, b[4]),
	        h = p(h, f, m, g, r, 12, b[5]),
	        g = p(g, h, f, m, t, 17, b[6]),
	        m = p(m, g, h, f, w, 22, b[7]),
	        f = p(f, m, g, h, v, 7, b[8]),
	        h = p(h, f, m, g, A, 12, b[9]),
	        g = p(g, h, f, m, B, 17, b[10]),
	        m = p(m, g, h, f, C, 22, b[11]),
	        f = p(f, m, g, h, u, 7, b[12]),
	        h = p(h, f, m, g, D, 12, b[13]),
	        g = p(g, h, f, m, E, 17, b[14]),
	        m = p(m, g, h, f, x, 22, b[15]),
	        f = d(f, m, g, h, e, 5, b[16]),
	        h = d(h, f, m, g, t, 9, b[17]),
	        g = d(g, h, f, m, C, 14, b[18]),
	        m = d(m, g, h, f, c, 20, b[19]),
	        f = d(f, m, g, h, r, 5, b[20]),
	        h = d(h, f, m, g, B, 9, b[21]),
	        g = d(g, h, f, m, x, 14, b[22]),
	        m = d(m, g, h, f, z, 20, b[23]),
	        f = d(f, m, g, h, A, 5, b[24]),
	        h = d(h, f, m, g, E, 9, b[25]),
	        g = d(g, h, f, m, k, 14, b[26]),
	        m = d(m, g, h, f, v, 20, b[27]),
	        f = d(f, m, g, h, D, 5, b[28]),
	        h = d(h, f, m, g, j, 9, b[29]),
	        g = d(g, h, f, m, w, 14, b[30]),
	        m = d(m, g, h, f, u, 20, b[31]),
	        f = l(f, m, g, h, r, 4, b[32]),
	        h = l(h, f, m, g, v, 11, b[33]),
	        g = l(g, h, f, m, C, 16, b[34]),
	        m = l(m, g, h, f, E, 23, b[35]),
	        f = l(f, m, g, h, e, 4, b[36]),
	        h = l(h, f, m, g, z, 11, b[37]),
	        g = l(g, h, f, m, w, 16, b[38]),
	        m = l(m, g, h, f, B, 23, b[39]),
	        f = l(f, m, g, h, D, 4, b[40]),
	        h = l(h, f, m, g, c, 11, b[41]),
	        g = l(g, h, f, m, k, 16, b[42]),
	        m = l(m, g, h, f, t, 23, b[43]),
	        f = l(f, m, g, h, A, 4, b[44]),
	        h = l(h, f, m, g, u, 11, b[45]),
	        g = l(g, h, f, m, x, 16, b[46]),
	        m = l(m, g, h, f, j, 23, b[47]),
	        f = s(f, m, g, h, c, 6, b[48]),
	        h = s(h, f, m, g, w, 10, b[49]),
	        g = s(g, h, f, m, E, 15, b[50]),
	        m = s(m, g, h, f, r, 21, b[51]),
	        f = s(f, m, g, h, u, 6, b[52]),
	        h = s(h, f, m, g, k, 10, b[53]),
	        g = s(g, h, f, m, B, 15, b[54]),
	        m = s(m, g, h, f, e, 21, b[55]),
	        f = s(f, m, g, h, v, 6, b[56]),
	        h = s(h, f, m, g, x, 10, b[57]),
	        g = s(g, h, f, m, t, 15, b[58]),
	        m = s(m, g, h, f, D, 21, b[59]),
	        f = s(f, m, g, h, z, 6, b[60]),
	        h = s(h, f, m, g, C, 10, b[61]),
	        g = s(g, h, f, m, j, 15, b[62]),
	        m = s(m, g, h, f, A, 21, b[63]);
	      a[0] = (a[0] + f) | 0;
	      a[1] = (a[1] + m) | 0;
	      a[2] = (a[2] + g) | 0;
	      a[3] = (a[3] + h) | 0;
	    },
	    _doFinalize: function () {
	      var b = this._data,
	        n = b.words,
	        a = 8 * this._nDataBytes,
	        c = 8 * b.sigBytes;
	      n[c >>> 5] |= 128 << (24 - (c % 32));
	      var e = u.floor(a / 4294967296);
	      n[(((c + 64) >>> 9) << 4) + 15] = (((e << 8) | (e >>> 24)) & 16711935) | (((e << 24) | (e >>> 8)) & 4278255360);
	      n[(((c + 64) >>> 9) << 4) + 14] = (((a << 8) | (a >>> 24)) & 16711935) | (((a << 24) | (a >>> 8)) & 4278255360);
	      b.sigBytes = 4 * (n.length + 1);
	      this._process();
	      b = this._hash;
	      n = b.words;
	      for (a = 0; 4 > a; a++)
	        (c = n[a]), (n[a] = (((c << 8) | (c >>> 24)) & 16711935) | (((c << 24) | (c >>> 8)) & 4278255360));
	      return b;
	    },
	    clone: function () {
	      var b = v.clone.call(this);
	      b._hash = this._hash.clone();
	      return b;
	    },
	  });
	  t.MD5 = v._createHelper(r);
	  t.HmacMD5 = v._createHmacHelper(r);
	})(Math);
	(function () {
	  var u = CryptoJS,
	    p = u.lib,
	    d = p.Base,
	    l = p.WordArray,
	    p = u.algo,
	    s = (p.EvpKDF = d.extend({
	      cfg: d.extend({ keySize: 4, hasher: p.MD5, iterations: 1 }),
	      init: function (d) {
	        this.cfg = this.cfg.extend(d);
	      },
	      compute: function (d, r) {
	        for (
	          var p = this.cfg, s = p.hasher.create(), b = l.create(), u = b.words, q = p.keySize, p = p.iterations;
	          u.length < q;

	        ) {
	          n && s.update(n);
	          var n = s.update(d).finalize(r);
	          s.reset();
	          for (var a = 1; a < p; a++) (n = s.finalize(n)), s.reset();
	          b.concat(n);
	        }
	        b.sigBytes = 4 * q;
	        return b;
	      },
	    }));
	  u.EvpKDF = function (d, l, p) {
	    return s.create(p).compute(d, l);
	  };
	})();

	// Cipher
	CryptoJS.lib.Cipher ||
	  (function (u) {
	    var p = CryptoJS,
	      d = p.lib,
	      l = d.Base,
	      s = d.WordArray,
	      t = d.BufferedBlockAlgorithm,
	      r = p.enc.Base64,
	      w = p.algo.EvpKDF,
	      v = (d.Cipher = t.extend({
	        cfg: l.extend(),
	        createEncryptor: function (e, a) {
	          return this.create(this._ENC_XFORM_MODE, e, a);
	        },
	        createDecryptor: function (e, a) {
	          return this.create(this._DEC_XFORM_MODE, e, a);
	        },
	        init: function (e, a, b) {
	          this.cfg = this.cfg.extend(b);
	          this._xformMode = e;
	          this._key = a;
	          this.reset();
	        },
	        reset: function () {
	          t.reset.call(this);
	          this._doReset();
	        },
	        process: function (e) {
	          this._append(e);
	          return this._process();
	        },
	        finalize: function (e) {
	          e && this._append(e);
	          return this._doFinalize();
	        },
	        keySize: 4,
	        ivSize: 4,
	        _ENC_XFORM_MODE: 1,
	        _DEC_XFORM_MODE: 2,
	        _createHelper: function (e) {
	          return {
	            encrypt: function (b, k, d) {
	              return ('string' == typeof k ? c : a).encrypt(e, b, k, d);
	            },
	            decrypt: function (b, k, d) {
	              return ('string' == typeof k ? c : a).decrypt(e, b, k, d);
	            },
	          };
	        },
	      }));
	    d.StreamCipher = v.extend({
	      _doFinalize: function () {
	        return this._process(!0);
	      },
	      blockSize: 1,
	    });
	    var b = (p.mode = {}),
	      x = function (e, a, b) {
	        var c = this._iv;
	        c ? (this._iv = u) : (c = this._prevBlock);
	        for (var d = 0; d < b; d++) e[a + d] ^= c[d];
	      },
	      q = (d.BlockCipherMode = l.extend({
	        createEncryptor: function (e, a) {
	          return this.Encryptor.create(e, a);
	        },
	        createDecryptor: function (e, a) {
	          return this.Decryptor.create(e, a);
	        },
	        init: function (e, a) {
	          this._cipher = e;
	          this._iv = a;
	        },
	      })).extend();
	    q.Encryptor = q.extend({
	      processBlock: function (e, a) {
	        var b = this._cipher,
	          c = b.blockSize;
	        x.call(this, e, a, c);
	        b.encryptBlock(e, a);
	        this._prevBlock = e.slice(a, a + c);
	      },
	    });
	    q.Decryptor = q.extend({
	      processBlock: function (e, a) {
	        var b = this._cipher,
	          c = b.blockSize,
	          d = e.slice(a, a + c);
	        b.decryptBlock(e, a);
	        x.call(this, e, a, c);
	        this._prevBlock = d;
	      },
	    });
	    b = b.CBC = q;
	    q = (p.pad = {}).Pkcs7 = {
	      pad: function (a, b) {
	        for (
	          var c = 4 * b, c = c - (a.sigBytes % c), d = (c << 24) | (c << 16) | (c << 8) | c, l = [], n = 0;
	          n < c;
	          n += 4
	        )
	          l.push(d);
	        c = s.create(l, c);
	        a.concat(c);
	      },
	      unpad: function (a) {
	        a.sigBytes -= a.words[(a.sigBytes - 1) >>> 2] & 255;
	      },
	    };
	    d.BlockCipher = v.extend({
	      cfg: v.cfg.extend({ mode: b, padding: q }),
	      reset: function () {
	        v.reset.call(this);
	        var a = this.cfg,
	          b = a.iv,
	          a = a.mode;
	        if (this._xformMode == this._ENC_XFORM_MODE) var c = a.createEncryptor;
	        else (c = a.createDecryptor), (this._minBufferSize = 1);
	        this._mode = c.call(a, this, b && b.words);
	      },
	      _doProcessBlock: function (a, b) {
	        this._mode.processBlock(a, b);
	      },
	      _doFinalize: function () {
	        var a = this.cfg.padding;
	        if (this._xformMode == this._ENC_XFORM_MODE) {
	          a.pad(this._data, this.blockSize);
	          var b = this._process(!0);
	        } else (b = this._process(!0)), a.unpad(b);
	        return b;
	      },
	      blockSize: 4,
	    });
	    var n = (d.CipherParams = l.extend({
	        init: function (a) {
	          this.mixIn(a);
	        },
	        toString: function (a) {
	          return (a || this.formatter).stringify(this);
	        },
	      })),
	      b = ((p.format = {}).OpenSSL = {
	        stringify: function (a) {
	          var b = a.ciphertext;
	          a = a.salt;
	          return (a ? s.create([1398893684, 1701076831]).concat(a).concat(b) : b).toString(r);
	        },
	        parse: function (a) {
	          a = r.parse(a);
	          var b = a.words;
	          if (1398893684 == b[0] && 1701076831 == b[1]) {
	            var c = s.create(b.slice(2, 4));
	            b.splice(0, 4);
	            a.sigBytes -= 16;
	          }
	          return n.create({ ciphertext: a, salt: c });
	        },
	      }),
	      a = (d.SerializableCipher = l.extend({
	        cfg: l.extend({ format: b }),
	        encrypt: function (a, b, c, d) {
	          d = this.cfg.extend(d);
	          var l = a.createEncryptor(c, d);
	          b = l.finalize(b);
	          l = l.cfg;
	          return n.create({
	            ciphertext: b,
	            key: c,
	            iv: l.iv,
	            algorithm: a,
	            mode: l.mode,
	            padding: l.padding,
	            blockSize: a.blockSize,
	            formatter: d.format,
	          });
	        },
	        decrypt: function (a, b, c, d) {
	          d = this.cfg.extend(d);
	          b = this._parse(b, d.format);
	          return a.createDecryptor(c, d).finalize(b.ciphertext);
	        },
	        _parse: function (a, b) {
	          return 'string' == typeof a ? b.parse(a, this) : a;
	        },
	      })),
	      p = ((p.kdf = {}).OpenSSL = {
	        execute: function (a, b, c, d) {
	          d || (d = s.random(8));
	          a = w.create({ keySize: b + c }).compute(a, d);
	          c = s.create(a.words.slice(b), 4 * c);
	          a.sigBytes = 4 * b;
	          return n.create({ key: a, iv: c, salt: d });
	        },
	      }),
	      c = (d.PasswordBasedCipher = a.extend({
	        cfg: a.cfg.extend({ kdf: p }),
	        encrypt: function (b, c, d, l) {
	          l = this.cfg.extend(l);
	          d = l.kdf.execute(d, b.keySize, b.ivSize);
	          l.iv = d.iv;
	          b = a.encrypt.call(this, b, c, d.key, l);
	          b.mixIn(d);
	          return b;
	        },
	        decrypt: function (b, c, d, l) {
	          l = this.cfg.extend(l);
	          c = this._parse(c, l.format);
	          d = l.kdf.execute(d, b.keySize, b.ivSize, c.salt);
	          l.iv = d.iv;
	          return a.decrypt.call(this, b, c, d.key, l);
	        },
	      }));
	  })();

	// AES
	(function () {
	  for (
	    var u = CryptoJS,
	      p = u.lib.BlockCipher,
	      d = u.algo,
	      l = [],
	      s = [],
	      t = [],
	      r = [],
	      w = [],
	      v = [],
	      b = [],
	      x = [],
	      q = [],
	      n = [],
	      a = [],
	      c = 0;
	    256 > c;
	    c++
	  )
	    a[c] = 128 > c ? c << 1 : (c << 1) ^ 283;
	  for (var e = 0, j = 0, c = 0; 256 > c; c++) {
	    var k = j ^ (j << 1) ^ (j << 2) ^ (j << 3) ^ (j << 4),
	      k = (k >>> 8) ^ (k & 255) ^ 99;
	    l[e] = k;
	    s[k] = e;
	    var z = a[e],
	      F = a[z],
	      G = a[F],
	      y = (257 * a[k]) ^ (16843008 * k);
	    t[e] = (y << 24) | (y >>> 8);
	    r[e] = (y << 16) | (y >>> 16);
	    w[e] = (y << 8) | (y >>> 24);
	    v[e] = y;
	    y = (16843009 * G) ^ (65537 * F) ^ (257 * z) ^ (16843008 * e);
	    b[k] = (y << 24) | (y >>> 8);
	    x[k] = (y << 16) | (y >>> 16);
	    q[k] = (y << 8) | (y >>> 24);
	    n[k] = y;
	    e ? ((e = z ^ a[a[a[G ^ z]]]), (j ^= a[a[j]])) : (e = j = 1);
	  }
	  var H = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54],
	    d = (d.AES = p.extend({
	      _doReset: function () {
	        for (
	          var a = this._key,
	            c = a.words,
	            d = a.sigBytes / 4,
	            a = 4 * ((this._nRounds = d + 6) + 1),
	            e = (this._keySchedule = []),
	            j = 0;
	          j < a;
	          j++
	        )
	          if (j < d) e[j] = c[j];
	          else {
	            var k = e[j - 1];
	            j % d
	              ? 6 < d &&
	                4 == j % d &&
	                (k = (l[k >>> 24] << 24) | (l[(k >>> 16) & 255] << 16) | (l[(k >>> 8) & 255] << 8) | l[k & 255])
	              : ((k = (k << 8) | (k >>> 24)),
	                (k = (l[k >>> 24] << 24) | (l[(k >>> 16) & 255] << 16) | (l[(k >>> 8) & 255] << 8) | l[k & 255]),
	                (k ^= H[(j / d) | 0] << 24));
	            e[j] = e[j - d] ^ k;
	          }
	        c = this._invKeySchedule = [];
	        for (d = 0; d < a; d++)
	          (j = a - d),
	            (k = d % 4 ? e[j] : e[j - 4]),
	            (c[d] =
	              4 > d || 4 >= j ? k : b[l[k >>> 24]] ^ x[l[(k >>> 16) & 255]] ^ q[l[(k >>> 8) & 255]] ^ n[l[k & 255]]);
	      },
	      encryptBlock: function (a, b) {
	        this._doCryptBlock(a, b, this._keySchedule, t, r, w, v, l);
	      },
	      decryptBlock: function (a, c) {
	        var d = a[c + 1];
	        a[c + 1] = a[c + 3];
	        a[c + 3] = d;
	        this._doCryptBlock(a, c, this._invKeySchedule, b, x, q, n, s);
	        d = a[c + 1];
	        a[c + 1] = a[c + 3];
	        a[c + 3] = d;
	      },
	      _doCryptBlock: function (a, b, c, d, e, j, l, f) {
	        for (
	          var m = this._nRounds,
	            g = a[b] ^ c[0],
	            h = a[b + 1] ^ c[1],
	            k = a[b + 2] ^ c[2],
	            n = a[b + 3] ^ c[3],
	            p = 4,
	            r = 1;
	          r < m;
	          r++
	        )
	          var q = d[g >>> 24] ^ e[(h >>> 16) & 255] ^ j[(k >>> 8) & 255] ^ l[n & 255] ^ c[p++],
	            s = d[h >>> 24] ^ e[(k >>> 16) & 255] ^ j[(n >>> 8) & 255] ^ l[g & 255] ^ c[p++],
	            t = d[k >>> 24] ^ e[(n >>> 16) & 255] ^ j[(g >>> 8) & 255] ^ l[h & 255] ^ c[p++],
	            n = d[n >>> 24] ^ e[(g >>> 16) & 255] ^ j[(h >>> 8) & 255] ^ l[k & 255] ^ c[p++],
	            g = q,
	            h = s,
	            k = t;
	        q = ((f[g >>> 24] << 24) | (f[(h >>> 16) & 255] << 16) | (f[(k >>> 8) & 255] << 8) | f[n & 255]) ^ c[p++];
	        s = ((f[h >>> 24] << 24) | (f[(k >>> 16) & 255] << 16) | (f[(n >>> 8) & 255] << 8) | f[g & 255]) ^ c[p++];
	        t = ((f[k >>> 24] << 24) | (f[(n >>> 16) & 255] << 16) | (f[(g >>> 8) & 255] << 8) | f[h & 255]) ^ c[p++];
	        n = ((f[n >>> 24] << 24) | (f[(g >>> 16) & 255] << 16) | (f[(h >>> 8) & 255] << 8) | f[k & 255]) ^ c[p++];
	        a[b] = q;
	        a[b + 1] = s;
	        a[b + 2] = t;
	        a[b + 3] = n;
	      },
	      keySize: 8,
	    }));
	  u.AES = p._createHelper(d);
	})();

	// Mode ECB
	CryptoJS.mode.ECB = (function () {
	  var ECB = CryptoJS.lib.BlockCipherMode.extend();

	  ECB.Encryptor = ECB.extend({
	    processBlock: function (words, offset) {
	      this._cipher.encryptBlock(words, offset);
	    },
	  });

	  ECB.Decryptor = ECB.extend({
	    processBlock: function (words, offset) {
	      this._cipher.decryptBlock(words, offset);
	    },
	  });

	  return ECB;
	})();

	/**
	 * AES-CBC cryptor module.
	 */
	/**
	 * {@link string|String} to {@link ArrayBuffer} response decoder.
	 */
	new TextEncoder();
	/**
	 *  {@link ArrayBuffer} to {@link string} decoder.
	 */
	new TextDecoder();

	/* global crypto */
	/**
	 * Legacy browser cryptography module.
	 */
	/**
	 * {@link string|String} to {@link ArrayBuffer} response decoder.
	 */
	new TextEncoder();
	/**
	 *  {@link ArrayBuffer} to {@link string} decoder.
	 */
	new TextDecoder();

	/**
	 * Legacy cryptor module.
	 */
	/**
	 * `string` to {@link ArrayBuffer} response decoder.
	 */
	new TextEncoder();
	/**
	 *  {@link ArrayBuffer} to {@link string} decoder.
	 */
	new TextDecoder();

	/**
	 * Browser crypto module.
	 */
	new TextDecoder();

	/**
	 * REST API endpoint use error module.
	 */
	/**
	 * PubNub REST API call error.
	 */
	class PubNubAPIError extends Error {
	    /**
	     * Construct API from known error object or {@link PubNub} service error response.
	     *
	     * @param errorOrResponse - `Error` or service error response object from which error information
	     * should be extracted.
	     * @param data - Preprocessed service error response.
	     *
	     * @returns `PubNubAPIError` object with known error category and additional information (if
	     * available).
	     */
	    static create(errorOrResponse, data) {
	        if (errorOrResponse instanceof Error)
	            return PubNubAPIError.createFromError(errorOrResponse);
	        else
	            return PubNubAPIError.createFromServiceResponse(errorOrResponse, data);
	    }
	    /**
	     * Create API error instance from other error object.
	     *
	     * @param error - `Error` object provided by network provider (mostly) or other {@link PubNub} client components.
	     *
	     * @returns `PubNubAPIError` object with known error category and additional information (if
	     * available).
	     */
	    static createFromError(error) {
	        let category = StatusCategory$1.PNUnknownCategory;
	        let message = 'Unknown error';
	        let errorName = 'Error';
	        if (!error)
	            return new PubNubAPIError(message, category, 0);
	        else if (error instanceof PubNubAPIError)
	            return error;
	        if (error instanceof Error) {
	            message = error.message;
	            errorName = error.name;
	        }
	        if (errorName === 'AbortError' || message.indexOf('Aborted') !== -1) {
	            category = StatusCategory$1.PNCancelledCategory;
	            message = 'Request cancelled';
	        }
	        else if (message.indexOf('timeout') !== -1) {
	            category = StatusCategory$1.PNTimeoutCategory;
	            message = 'Request timeout';
	        }
	        else if (message.indexOf('network') !== -1) {
	            category = StatusCategory$1.PNNetworkIssuesCategory;
	            message = 'Network issues';
	        }
	        else if (errorName === 'TypeError') {
	            if (message.indexOf('Load failed') !== -1 || message.indexOf('Failed to fetch') != -1)
	                category = StatusCategory$1.PNTimeoutCategory;
	            else
	                category = StatusCategory$1.PNBadRequestCategory;
	        }
	        else if (errorName === 'FetchError') {
	            const errorCode = error.code;
	            if (['ECONNREFUSED', 'ENETUNREACH', 'ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN'].includes(errorCode))
	                category = StatusCategory$1.PNNetworkIssuesCategory;
	            if (errorCode === 'ECONNREFUSED')
	                message = 'Connection refused';
	            else if (errorCode === 'ENETUNREACH')
	                message = 'Network not reachable';
	            else if (errorCode === 'ENOTFOUND')
	                message = 'Server not found';
	            else if (errorCode === 'ECONNRESET')
	                message = 'Connection reset by peer';
	            else if (errorCode === 'EAI_AGAIN')
	                message = 'Name resolution error';
	            else if (errorCode === 'ETIMEDOUT') {
	                category = StatusCategory$1.PNTimeoutCategory;
	                message = 'Request timeout';
	            }
	            else
	                message = `Unknown system error: ${error}`;
	        }
	        else if (message === 'Request timeout')
	            category = StatusCategory$1.PNTimeoutCategory;
	        return new PubNubAPIError(message, category, 0, error);
	    }
	    /**
	     * Construct API from known {@link PubNub} service error response.
	     *
	     * @param response - Service error response object from which error information should be
	     * extracted.
	     * @param data - Preprocessed service error response.
	     *
	     * @returns `PubNubAPIError` object with known error category and additional information (if
	     * available).
	     */
	    static createFromServiceResponse(response, data) {
	        let category = StatusCategory$1.PNUnknownCategory;
	        let errorData;
	        let message = 'Unknown error';
	        let { status } = response;
	        data !== null && data !== void 0 ? data : (data = response.body);
	        if (status === 402)
	            message = 'Not available for used key set. Contact support@pubnub.com';
	        else if (status === 400) {
	            category = StatusCategory$1.PNBadRequestCategory;
	            message = 'Bad request';
	        }
	        else if (status === 403) {
	            category = StatusCategory$1.PNAccessDeniedCategory;
	            message = 'Access denied';
	        }
	        // Try to get more information about error from service response.
	        if (data && data.byteLength > 0) {
	            const decoded = new TextDecoder().decode(data);
	            if (response.headers['content-type'].indexOf('text/javascript') !== -1 ||
	                response.headers['content-type'].indexOf('application/json') !== -1) {
	                try {
	                    const errorResponse = JSON.parse(decoded);
	                    if (typeof errorResponse === 'object' && !Array.isArray(errorResponse)) {
	                        if ('error' in errorResponse &&
	                            (errorResponse.error === 1 || errorResponse.error === true) &&
	                            'status' in errorResponse &&
	                            typeof errorResponse.status === 'number' &&
	                            'message' in errorResponse &&
	                            'service' in errorResponse) {
	                            errorData = errorResponse;
	                            status = errorResponse.status;
	                        }
	                        else
	                            errorData = errorResponse;
	                        if ('error' in errorResponse && errorResponse.error instanceof Error)
	                            errorData = errorResponse.error;
	                    }
	                }
	                catch (_) {
	                    errorData = decoded;
	                }
	            }
	            else if (response.headers['content-type'].indexOf('xml') !== -1) {
	                const reason = /<Message>(.*)<\/Message>/gi.exec(decoded);
	                message = reason ? `Upload to bucket failed: ${reason[1]}` : 'Upload to bucket failed.';
	            }
	            else {
	                errorData = decoded;
	            }
	        }
	        return new PubNubAPIError(message, category, status, errorData);
	    }
	    /**
	     * Construct PubNub endpoint error.
	     *
	     * @param message - Short API call error description.
	     * @param category - Error category.
	     * @param statusCode - Response HTTP status code.
	     * @param errorData - Error information.
	     */
	    constructor(message, category, statusCode, errorData) {
	        super(message);
	        this.category = category;
	        this.statusCode = statusCode;
	        this.errorData = errorData;
	        this.name = 'PubNubAPIError';
	    }
	    /**
	     * Convert API error object to API callback status object.
	     *
	     * @param operation - Request operation during which error happened.
	     *
	     * @returns Pre-formatted API callback status object.
	     */
	    toStatus(operation) {
	        return {
	            error: true,
	            category: this.category,
	            operation,
	            statusCode: this.statusCode,
	            errorData: this.errorData,
	        };
	    }
	    /**
	     * Convert API error object to PubNub client error object.
	     *
	     * @param operation - Request operation during which error happened.
	     * @param message - Custom error message.
	     *
	     * @returns Client-facing pre-formatted endpoint call error.
	     */
	    toPubNubError(operation, message) {
	        return new PubNubError(message !== null && message !== void 0 ? message : this.message, this.toStatus(operation));
	    }
	}

	/**
	 * Percent-encode input string.
	 *
	 * **Note:** Encode content in accordance of the `PubNub` service requirements.
	 *
	 * @param input - Source string or number for encoding.
	 *
	 * @returns Percent-encoded string.
	 */
	const encodeString = (input) => {
	    return encodeURIComponent(input).replace(/[!~*'()]/g, (x) => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);
	};
	/**
	 * Transform query key / value pairs to the string.
	 *
	 * @param query - Key / value pairs of the request query parameters.
	 *
	 * @returns Stringified query key / value pairs.
	 */
	const queryStringFromObject = (query) => {
	    return Object.keys(query)
	        .map((key) => {
	        const queryValue = query[key];
	        if (!Array.isArray(queryValue))
	            return `${key}=${encodeString(queryValue)}`;
	        return queryValue.map((value) => `${key}=${encodeString(value)}`).join('&');
	    })
	        .join('&');
	};

	/**
	 * Common browser and React Native Transport provider module.
	 */
	/**
	 * Class representing a `fetch`-based browser and React Native transport provider.
	 */
	class WebReactNativeTransport {
	    constructor(keepAlive = false, logVerbosity) {
	        this.keepAlive = keepAlive;
	        this.logVerbosity = logVerbosity;
	    }
	    makeSendable(req) {
	        let controller;
	        let abortController;
	        if (req.cancellable) {
	            abortController = new AbortController();
	            controller = {
	                // Storing controller inside to prolong object lifetime.
	                abortController,
	                abort: () => abortController === null || abortController === void 0 ? void 0 : abortController.abort(),
	            };
	        }
	        return [
	            this.requestFromTransportRequest(req).then((request) => {
	                const start = new Date().getTime();
	                this.logRequestProcessProgress(request);
	                /**
	                 * Setup request timeout promise.
	                 *
	                 * **Note:** Native Fetch API doesn't support `timeout` out-of-box.
	                 */
	                const requestTimeout = new Promise((_, reject) => {
	                    const timeoutId = setTimeout(() => {
	                        // Clean up.
	                        clearTimeout(timeoutId);
	                        reject(new Error('Request timeout'));
	                    }, req.timeout * 1000);
	                });
	                return Promise.race([fetch(request, { signal: abortController === null || abortController === void 0 ? void 0 : abortController.signal }), requestTimeout])
	                    .then((response) => response.arrayBuffer().then((arrayBuffer) => [response, arrayBuffer]))
	                    .then((response) => {
	                    const responseBody = response[1].byteLength > 0 ? response[1] : undefined;
	                    const { status, headers: requestHeaders } = response[0];
	                    const headers = {};
	                    // Copy Headers object content into plain Record.
	                    requestHeaders.forEach((value, key) => (headers[key] = value.toLowerCase()));
	                    const transportResponse = {
	                        status,
	                        url: request.url,
	                        headers,
	                        body: responseBody,
	                    };
	                    if (status >= 400)
	                        throw PubNubAPIError.create(transportResponse);
	                    this.logRequestProcessProgress(request, new Date().getTime() - start, responseBody);
	                    return transportResponse;
	                })
	                    .catch((error) => {
	                    throw PubNubAPIError.create(error);
	                });
	            }),
	            controller,
	        ];
	    }
	    request(req) {
	        return req;
	    }
	    /**
	     * Creates a Request object from a given {@link TransportRequest} object.
	     *
	     * @param req - The {@link TransportRequest} object containing request information.
	     *
	     * @returns Request object generated from the {@link TransportRequest} object.
	     */
	    requestFromTransportRequest(req) {
	        return __awaiter(this, void 0, void 0, function* () {
	            let body;
	            let path = req.path;
	            // Create multipart request body.
	            if (req.formData && req.formData.length > 0) {
	                // Reset query parameters to conform to signed URL
	                req.queryParameters = {};
	                const file = req.body;
	                const formData = new FormData();
	                for (const { key, value } of req.formData)
	                    formData.append(key, value);
	                try {
	                    const fileData = yield file.toArrayBuffer();
	                    formData.append('file', new Blob([fileData], { type: 'application/octet-stream' }), file.name);
	                }
	                catch (_) {
	                    try {
	                        const fileData = yield file.toFileUri();
	                        // @ts-expect-error React Native File Uri support.
	                        formData.append('file', fileData, file.name);
	                    }
	                    catch (_) { }
	                }
	                body = formData;
	            }
	            // Handle regular body payload (if passed).
	            else if (req.body && (typeof req.body === 'string' || req.body instanceof ArrayBuffer))
	                body = req.body;
	            if (req.queryParameters && Object.keys(req.queryParameters).length !== 0)
	                path = `${path}?${queryStringFromObject(req.queryParameters)}`;
	            return new Request(`${req.origin}${path}`, {
	                method: req.method,
	                headers: req.headers,
	                redirect: 'follow',
	                body,
	            });
	        });
	    }
	    /**
	     * Log out request processing progress and result.
	     *
	     * @param request - Platform-specific
	     * @param [elapsed] - How many seconds passed since request processing started.
	     * @param [body] - Service response (if available).
	     */
	    logRequestProcessProgress(request, elapsed, body) {
	        if (!this.logVerbosity)
	            return;
	        const { protocol, host, pathname, search } = new URL(request.url);
	        const timestamp = new Date().toISOString();
	        if (!elapsed) {
	            console.log('<<<<<');
	            console.log(`[${timestamp}]`, `\n${protocol}//${host}${pathname}`, `\n${search}`);
	            console.log('-----');
	        }
	        else {
	            const stringifiedBody = body ? WebReactNativeTransport.decoder.decode(body) : undefined;
	            console.log('>>>>>>');
	            console.log(`[${timestamp} / ${elapsed}]`, `\n${protocol}//${host}${pathname}`, `\n${search}`, `\n${stringifiedBody}`);
	            console.log('-----');
	        }
	    }
	}
	/**
	 * Service {@link ArrayBuffer} response decoder.
	 */
	WebReactNativeTransport.decoder = new TextDecoder();

	/**
	 * {@link PubNub} client configuration module.
	 */
	// --------------------------------------------------------
	// ----------------------- Defaults -----------------------
	// --------------------------------------------------------
	// region Defaults
	/**
	 * Whether secured connection should be used by or not.
	 */
	const USE_SSL = true;
	/**
	 * Whether PubNub client should catch up subscription after network issues.
	 */
	const RESTORE = false;
	/**
	 * Whether network availability change should be announced with `PNNetworkDownCategory` and
	 * `PNNetworkUpCategory` state or not.
	 */
	const AUTO_NETWORK_DETECTION = false;
	/**
	 * Whether messages should be de-duplicated before announcement or not.
	 */
	const DEDUPE_ON_SUBSCRIBE = false;
	/**
	 * Maximum cache which should be used for message de-duplication functionality.
	 */
	const DEDUPE_CACHE_SIZE = 100;
	/**
	 * Maximum number of file message publish retries.
	 */
	const FILE_PUBLISH_RETRY_LIMIT = 5;
	/**
	 * Whether subscription event engine should be used or not.
	 */
	const ENABLE_EVENT_ENGINE = false;
	/**
	 * Whether configured user presence state should be maintained by the PubNub client or not.
	 */
	const MAINTAIN_PRESENCE_STATE = true;
	/**
	 * Whether PubNub client should try to utilize existing TCP connection for new requests or not.
	 */
	const KEEP_ALIVE$1 = false;
	/**
	 * Whether verbose logging should be enabled or not.
	 */
	const USE_VERBOSE_LOGGING = false;
	/**
	 * Whether leave events should be suppressed or not.
	 */
	const SUPPRESS_LEAVE_EVENTS = false;
	/**
	 * Whether heartbeat request failure should be announced or not.
	 */
	const ANNOUNCE_HEARTBEAT_FAILURE = true;
	/**
	 * Whether heartbeat request success should be announced or not.
	 */
	const ANNOUNCE_HEARTBEAT_SUCCESS = false;
	/**
	 * Whether PubNub client instance id should be added to the requests or not.
	 */
	const USE_INSTANCE_ID = false;
	/**
	 * Whether unique identifier should be added to the request or not.
	 */
	const USE_REQUEST_ID = true;
	/**
	 * Transactional requests timeout.
	 */
	const TRANSACTIONAL_REQUEST_TIMEOUT = 15;
	/**
	 * Subscription request timeout.
	 */
	const SUBSCRIBE_REQUEST_TIMEOUT = 310;
	/**
	 * Default user presence timeout.
	 */
	const PRESENCE_TIMEOUT = 300;
	/**
	 * Minimum user presence timeout.
	 */
	const PRESENCE_TIMEOUT_MINIMUM = 20;
	/**
	 * Apply configuration default values.
	 *
	 * @param configuration - User-provided configuration.
	 *
	 * @internal
	 */
	const setDefaults$1 = (configuration) => {
	    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
	    // Copy configuration.
	    const configurationCopy = Object.assign({}, configuration);
	    (_a = configurationCopy.logVerbosity) !== null && _a !== void 0 ? _a : (configurationCopy.logVerbosity = USE_VERBOSE_LOGGING);
	    (_b = configurationCopy.ssl) !== null && _b !== void 0 ? _b : (configurationCopy.ssl = USE_SSL);
	    (_c = configurationCopy.transactionalRequestTimeout) !== null && _c !== void 0 ? _c : (configurationCopy.transactionalRequestTimeout = TRANSACTIONAL_REQUEST_TIMEOUT);
	    (_d = configurationCopy.subscribeRequestTimeout) !== null && _d !== void 0 ? _d : (configurationCopy.subscribeRequestTimeout = SUBSCRIBE_REQUEST_TIMEOUT);
	    (_e = configurationCopy.restore) !== null && _e !== void 0 ? _e : (configurationCopy.restore = RESTORE);
	    (_f = configurationCopy.useInstanceId) !== null && _f !== void 0 ? _f : (configurationCopy.useInstanceId = USE_INSTANCE_ID);
	    (_g = configurationCopy.suppressLeaveEvents) !== null && _g !== void 0 ? _g : (configurationCopy.suppressLeaveEvents = SUPPRESS_LEAVE_EVENTS);
	    (_h = configurationCopy.requestMessageCountThreshold) !== null && _h !== void 0 ? _h : (configurationCopy.requestMessageCountThreshold = DEDUPE_CACHE_SIZE);
	    (_j = configurationCopy.autoNetworkDetection) !== null && _j !== void 0 ? _j : (configurationCopy.autoNetworkDetection = AUTO_NETWORK_DETECTION);
	    (_k = configurationCopy.enableEventEngine) !== null && _k !== void 0 ? _k : (configurationCopy.enableEventEngine = ENABLE_EVENT_ENGINE);
	    (_l = configurationCopy.maintainPresenceState) !== null && _l !== void 0 ? _l : (configurationCopy.maintainPresenceState = MAINTAIN_PRESENCE_STATE);
	    (_m = configurationCopy.keepAlive) !== null && _m !== void 0 ? _m : (configurationCopy.keepAlive = KEEP_ALIVE$1);
	    if (configurationCopy.userId && configurationCopy.uuid)
	        throw new PubNubError("PubNub client configuration error: use only 'userId'");
	    (_o = configurationCopy.userId) !== null && _o !== void 0 ? _o : (configurationCopy.userId = configurationCopy.uuid);
	    if (!configurationCopy.userId)
	        throw new PubNubError("PubNub client configuration error: 'userId' not set");
	    else if (((_p = configurationCopy.userId) === null || _p === void 0 ? void 0 : _p.trim().length) === 0)
	        throw new PubNubError("PubNub client configuration error: 'userId' is empty");
	    // Generate default origin subdomains.
	    if (!configurationCopy.origin)
	        configurationCopy.origin = Array.from({ length: 20 }, (_, i) => `ps${i + 1}.pndsn.com`);
	    const keySet = {
	        subscribeKey: configurationCopy.subscribeKey,
	        publishKey: configurationCopy.publishKey,
	        secretKey: configurationCopy.secretKey,
	    };
	    if (configurationCopy.presenceTimeout !== undefined && configurationCopy.presenceTimeout < PRESENCE_TIMEOUT_MINIMUM) {
	        configurationCopy.presenceTimeout = PRESENCE_TIMEOUT_MINIMUM;
	        // eslint-disable-next-line no-console
	        console.log('WARNING: Presence timeout is less than the minimum. Using minimum value: ', PRESENCE_TIMEOUT_MINIMUM);
	    }
	    if (configurationCopy.presenceTimeout !== undefined)
	        configurationCopy.heartbeatInterval = configurationCopy.presenceTimeout / 2 - 1;
	    else
	        configurationCopy.presenceTimeout = PRESENCE_TIMEOUT;
	    // Apply extended configuration defaults.
	    let announceSuccessfulHeartbeats = ANNOUNCE_HEARTBEAT_SUCCESS;
	    let announceFailedHeartbeats = ANNOUNCE_HEARTBEAT_FAILURE;
	    let fileUploadPublishRetryLimit = FILE_PUBLISH_RETRY_LIMIT;
	    let dedupeOnSubscribe = DEDUPE_ON_SUBSCRIBE;
	    const maximumCacheSize = DEDUPE_CACHE_SIZE;
	    let useRequestId = USE_REQUEST_ID;
	    // @ts-expect-error Not documented legacy configuration options.
	    if (configurationCopy.dedupeOnSubscribe !== undefined && typeof configurationCopy.dedupeOnSubscribe === 'boolean') {
	        // @ts-expect-error Not documented legacy configuration options.
	        dedupeOnSubscribe = configurationCopy.dedupeOnSubscribe;
	    }
	    // @ts-expect-error Not documented legacy configuration options.
	    if (configurationCopy.useRequestId !== undefined && typeof configurationCopy.useRequestId === 'boolean') {
	        // @ts-expect-error Not documented legacy configuration options.
	        useRequestId = configurationCopy.useRequestId;
	    }
	    if (
	    // @ts-expect-error Not documented legacy configuration options.
	    configurationCopy.announceSuccessfulHeartbeats !== undefined &&
	        // @ts-expect-error Not documented legacy configuration options.
	        typeof configurationCopy.announceSuccessfulHeartbeats === 'boolean') {
	        // @ts-expect-error Not documented legacy configuration options.
	        announceSuccessfulHeartbeats = configurationCopy.announceSuccessfulHeartbeats;
	    }
	    if (
	    // @ts-expect-error Not documented legacy configuration options.
	    configurationCopy.announceFailedHeartbeats !== undefined &&
	        // @ts-expect-error Not documented legacy configuration options.
	        typeof configurationCopy.announceFailedHeartbeats === 'boolean') {
	        // @ts-expect-error Not documented legacy configuration options.
	        announceFailedHeartbeats = configurationCopy.announceFailedHeartbeats;
	    }
	    if (
	    // @ts-expect-error Not documented legacy configuration options.
	    configurationCopy.fileUploadPublishRetryLimit !== undefined &&
	        // @ts-expect-error Not documented legacy configuration options.
	        typeof configurationCopy.fileUploadPublishRetryLimit === 'number') {
	        // @ts-expect-error Not documented legacy configuration options.
	        fileUploadPublishRetryLimit = configurationCopy.fileUploadPublishRetryLimit;
	    }
	    return Object.assign(Object.assign({}, configurationCopy), { keySet,
	        dedupeOnSubscribe,
	        maximumCacheSize,
	        useRequestId,
	        announceSuccessfulHeartbeats,
	        announceFailedHeartbeats,
	        fileUploadPublishRetryLimit });
	};

	// --------------------------------------------------------
	// ----------------------- Defaults -----------------------
	// --------------------------------------------------------
	// region Defaults
	/**
	 * Whether PubNub client should update its state using browser's reachability events or not.
	 *
	 * If the browser fails to detect the network changes from Wi-Fi to LAN and vice versa, or you get
	 * reconnection issues, set the flag to `false`. This allows the SDK reconnection logic to take over.
	 */
	const LISTEN_TO_BROWSER_NETWORK_EVENTS = true;
	/**
	 * Whether verbose logging should be enabled for `Subscription` worker to print debug messages or not.
	 */
	const SUBSCRIPTION_WORKER_LOG_VERBOSITY = false;
	/**
	 * Whether PubNub client should try to utilize existing TCP connection for new requests or not.
	 */
	const KEEP_ALIVE = true;
	/**
	 * Apply configuration default values.
	 *
	 * @param configuration - User-provided configuration.
	 *
	 * @internal
	 */
	const setDefaults = (configuration) => {
	    var _a, _b, _c;
	    // Force disable service workers if environment doesn't support them.
	    if (configuration.subscriptionWorkerUrl && typeof SharedWorker === 'undefined')
	        configuration.subscriptionWorkerUrl = null;
	    return Object.assign(Object.assign({}, setDefaults$1(configuration)), { 
	        // Set platform-specific options.
	        listenToBrowserNetworkEvents: (_a = configuration.listenToBrowserNetworkEvents) !== null && _a !== void 0 ? _a : LISTEN_TO_BROWSER_NETWORK_EVENTS, subscriptionWorkerUrl: configuration.subscriptionWorkerUrl, subscriptionWorkerLogVerbosity: (_b = configuration.subscriptionWorkerLogVerbosity) !== null && _b !== void 0 ? _b : SUBSCRIPTION_WORKER_LOG_VERBOSITY, keepAlive: (_c = configuration.keepAlive) !== null && _c !== void 0 ? _c : KEEP_ALIVE });
	};

	var uuid = {exports: {}};

	/*! lil-uuid - v0.1 - MIT License - https://github.com/lil-js/uuid */
	uuid.exports;

	(function (module, exports) {
		(function (root, factory) {
		  {
		    factory(exports);
		    if (module !== null) {
		      module.exports = exports.uuid;
		    }
		  }
		}(commonjsGlobal, function (exports) {
		  var VERSION = '0.1.0';
		  var uuidRegex = {
		    '3': /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
		    '4': /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		    '5': /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		    all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
		  };

		  function uuid() {
		    var uuid = '', i, random;
		    for (i = 0; i < 32; i++) {
		      random = Math.random() * 16 | 0;
		      if (i === 8 || i === 12 || i === 16 || i === 20) uuid += '-';
		      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
		    }
		    return uuid
		  }

		  function isUUID(str, version) {
		    var pattern = uuidRegex[version || 'all'];
		    return pattern && pattern.test(str) || false
		  }

		  uuid.isUUID = isUUID;
		  uuid.VERSION = VERSION;

		  exports.uuid = uuid;
		  exports.isUUID = isUUID;
		})); 
	} (uuid, uuid.exports));

	var uuidExports = uuid.exports;
	var uuidGenerator$1 = /*@__PURE__*/getDefaultExportFromCjs(uuidExports);

	var uuidGenerator = {
	    createUUID() {
	        if (uuidGenerator$1.uuid) {
	            return uuidGenerator$1.uuid();
	        }
	        // @ts-expect-error Depending on module type it may be callable.
	        return uuidGenerator$1();
	    },
	};

	/**
	 * {@link PubNub} client configuration module.
	 */
	// --------------------------------------------------------
	// ----------------------- Defaults -----------------------
	// --------------------------------------------------------
	// region Defaults
	/**
	 * Whether encryption (if set) should use random initialization vector or not.
	 *
	 * @internal
	 */
	const USE_RANDOM_INITIALIZATION_VECTOR = true;
	/**
	 * Create {@link PubNub} client private configuration object.
	 *
	 * @param base - User- and platform-provided configuration.
	 * @param setupCryptoModule - Platform-provided {@link CryptoModule} configuration block.
	 *
	 * @returns `PubNub` client private configuration.
	 *
	 * @internal
	 */
	const makeConfiguration = (base, setupCryptoModule) => {
	    var _a, _b, _c;
	    // Ensure that retry policy has proper configuration (if has been set).
	    (_a = base.retryConfiguration) === null || _a === void 0 ? void 0 : _a.validate();
	    (_b = base.useRandomIVs) !== null && _b !== void 0 ? _b : (base.useRandomIVs = USE_RANDOM_INITIALIZATION_VECTOR);
	    // Override origin value.
	    base.origin = standardOrigin((_c = base.ssl) !== null && _c !== void 0 ? _c : false, base.origin);
	    const cryptoModule = base.cryptoModule;
	    if (cryptoModule)
	        delete base.cryptoModule;
	    const clientConfiguration = Object.assign(Object.assign({}, base), { _pnsdkSuffix: {}, _instanceId: `pn-${uuidGenerator.createUUID()}`, _cryptoModule: undefined, _cipherKey: undefined, _setupCryptoModule: setupCryptoModule, get instanceId() {
	            if (this.useInstanceId)
	                return this._instanceId;
	            return undefined;
	        },
	        getUserId() {
	            return this.userId;
	        },
	        setUserId(value) {
	            if (!value || typeof value !== 'string' || value.trim().length === 0)
	                throw new Error('Missing or invalid userId parameter. Provide a valid string userId');
	            this.userId = value;
	        },
	        getAuthKey() {
	            return this.authKey;
	        },
	        setAuthKey(authKey) {
	            this.authKey = authKey;
	        },
	        getFilterExpression() {
	            return this.filterExpression;
	        },
	        setFilterExpression(expression) {
	            this.filterExpression = expression;
	        },
	        getCipherKey() {
	            return this._cipherKey;
	        },
	        setCipherKey(key) {
	            this._cipherKey = key;
	            if (!key && this._cryptoModule) {
	                this._cryptoModule = undefined;
	                return;
	            }
	            else if (!key || !this._setupCryptoModule)
	                return;
	            this._cryptoModule = this._setupCryptoModule({
	                cipherKey: key,
	                useRandomIVs: base.useRandomIVs,
	                customEncrypt: this.getCustomEncrypt(),
	                customDecrypt: this.getCustomDecrypt(),
	            });
	        },
	        getCryptoModule() {
	            return this._cryptoModule;
	        },
	        getUseRandomIVs() {
	            return base.useRandomIVs;
	        },
	        setPresenceTimeout(value) {
	            this.heartbeatInterval = value / 2 - 1;
	            this.presenceTimeout = value;
	        },
	        getPresenceTimeout() {
	            return this.presenceTimeout;
	        },
	        getHeartbeatInterval() {
	            return this.heartbeatInterval;
	        },
	        setHeartbeatInterval(interval) {
	            this.heartbeatInterval = interval;
	        },
	        getTransactionTimeout() {
	            return this.transactionalRequestTimeout;
	        },
	        getSubscribeTimeout() {
	            return this.subscribeRequestTimeout;
	        },
	        get PubNubFile() {
	            return base.PubNubFile;
	        },
	        get version() {
	            return '8.2.7';
	        },
	        getVersion() {
	            return this.version;
	        },
	        _addPnsdkSuffix(name, suffix) {
	            this._pnsdkSuffix[name] = `${suffix}`;
	        },
	        _getPnsdkSuffix(separator) {
	            const sdk = Object.values(this._pnsdkSuffix).join(separator);
	            return sdk.length > 0 ? separator + sdk : '';
	        },
	        // --------------------------------------------------------
	        // ---------------------- Deprecated ----------------------
	        // --------------------------------------------------------
	        // region Deprecated
	        getUUID() {
	            return this.getUserId();
	        },
	        setUUID(value) {
	            this.setUserId(value);
	        },
	        getCustomEncrypt() {
	            return base.customEncrypt;
	        },
	        getCustomDecrypt() {
	            return base.customDecrypt;
	        } });
	    // Setup `CryptoModule` if possible.
	    if (base.cipherKey)
	        clientConfiguration.setCipherKey(base.cipherKey);
	    else if (cryptoModule)
	        clientConfiguration._cryptoModule = cryptoModule;
	    return clientConfiguration;
	};
	/**
	 * Decide {@lin PubNub} service REST API origin.
	 *
	 * @param secure - Whether preferred to use secured connection or not.
	 * @param origin - User-provided or default origin.
	 *
	 * @returns `PubNub` REST API endpoints origin.
	 */
	const standardOrigin = (secure, origin) => {
	    const protocol = secure ? 'https://' : 'http://';
	    if (typeof origin === 'string')
	        return `${protocol}${origin}`;
	    return `${protocol}${origin[Math.floor(Math.random() * origin.length)]}`;
	};

	/**
	 * Enum representing possible transport methods for HTTP requests.
	 *
	 * @enum {number}
	 */
	var TransportMethod;
	(function (TransportMethod) {
	    /**
	     * Request will be sent using `GET` method.
	     */
	    TransportMethod["GET"] = "GET";
	    /**
	     * Request will be sent using `POST` method.
	     */
	    TransportMethod["POST"] = "POST";
	    /**
	     * Request will be sent using `PATCH` method.
	     */
	    TransportMethod["PATCH"] = "PATCH";
	    /**
	     * Request will be sent using `DELETE` method.
	     */
	    TransportMethod["DELETE"] = "DELETE";
	    /**
	     * Local request.
	     *
	     * Request won't be sent to the service and probably used to compute URL.
	     */
	    TransportMethod["LOCAL"] = "LOCAL";
	})(TransportMethod || (TransportMethod = {}));

	new TextDecoder('utf-8');
	class PubNubMiddleware {
	    constructor(configuration) {
	        this.configuration = configuration;
	    }
	    makeSendable(req) {
	        return this.configuration.transport.makeSendable(this.request(req));
	    }
	    request(req) {
	        var _a;
	        const { clientConfiguration } = this.configuration;
	        // Get request patched by transport provider.
	        req = this.configuration.transport.request(req);
	        if (!req.queryParameters)
	            req.queryParameters = {};
	        // Modify request with required information.
	        if (clientConfiguration.useInstanceId)
	            req.queryParameters['instanceid'] = clientConfiguration.instanceId;
	        if (!req.queryParameters['uuid'])
	            req.queryParameters['uuid'] = clientConfiguration.userId;
	        if (clientConfiguration.useRequestId)
	            req.queryParameters['requestid'] = req.identifier;
	        req.queryParameters['pnsdk'] = this.generatePNSDK();
	        (_a = req.origin) !== null && _a !== void 0 ? _a : (req.origin = clientConfiguration.origin);
	        // Authenticate request if required.
	        this.authenticateRequest(req);
	        // Sign request if it is required.
	        this.signRequest(req);
	        return req;
	    }
	    authenticateRequest(req) {
	        var _a;
	        // Access management endpoints doesn't need authentication (signature required instead).
	        if (req.path.startsWith('/v2/auth/') || req.path.startsWith('/v3/pam/') || req.path.startsWith('/time'))
	            return;
	        const { clientConfiguration, tokenManager } = this.configuration;
	        const accessKey = (_a = (tokenManager && tokenManager.getToken())) !== null && _a !== void 0 ? _a : clientConfiguration.authKey;
	        if (accessKey)
	            req.queryParameters['auth'] = accessKey;
	    }
	    /**
	     * Compute and append request signature.
	     *
	     * @param req - Transport request with information which should be used to generate signature.
	     */
	    signRequest(req) {
	        if (!this.signatureGenerator || req.path.startsWith('/time'))
	            return;
	        req.queryParameters['timestamp'] = String(Math.floor(new Date().getTime() / 1000));
	        req.queryParameters['signature'] = this.signatureGenerator.signature(req);
	    }
	    /**
	     * Compose `pnsdk` query parameter.
	     *
	     * SDK provides ability to set custom name or append vendor information to the `pnsdk` query
	     * parameter.
	     *
	     * @returns Finalized `pnsdk` query parameter value.
	     */
	    generatePNSDK() {
	        const { clientConfiguration } = this.configuration;
	        if (clientConfiguration.sdkName)
	            return clientConfiguration.sdkName;
	        let base = `PubNub-JS-${clientConfiguration.sdkFamily}`;
	        if (clientConfiguration.partnerId)
	            base += `-${clientConfiguration.partnerId}`;
	        base += `/${clientConfiguration.getVersion()}`;
	        const pnsdkSuffix = clientConfiguration._getPnsdkSuffix(' ');
	        if (pnsdkSuffix.length > 0)
	            base += pnsdkSuffix;
	        return base;
	    }
	}

	/**
	 * Events listener manager module.
	 */
	/**
	 * Real-time listeners' manager.
	 *
	 * @internal
	 */
	class ListenerManager {
	    constructor() {
	        /**
	         * List of registered event listeners.
	         */
	        this.listeners = [];
	        // endregion
	    }
	    /**
	     * Register new real-time events listener.
	     *
	     * @param listener - Listener with event callbacks to handle different types of events.
	     */
	    addListener(listener) {
	        if (this.listeners.includes(listener))
	            return;
	        this.listeners.push(listener);
	    }
	    /**
	     * Remove real-time event listener.
	     *
	     * @param listener - Event listeners which should be removed.
	     */
	    removeListener(listener) {
	        this.listeners = this.listeners.filter((storedListener) => storedListener !== listener);
	    }
	    /**
	     * Clear all real-time event listeners.
	     */
	    removeAllListeners() {
	        this.listeners = [];
	    }
	    /**
	     * Announce PubNub client status change event.
	     *
	     * @param status - PubNub client status.
	     */
	    announceStatus(status) {
	        this.listeners.forEach((listener) => {
	            if (listener.status)
	                listener.status(status);
	        });
	    }
	    /**
	     * Announce channel presence change event.
	     *
	     * @param presence - Channel presence change information.
	     */
	    announcePresence(presence) {
	        this.listeners.forEach((listener) => {
	            if (listener.presence)
	                listener.presence(presence);
	        });
	    }
	    /**
	     * Announce real-time message event.
	     *
	     * @param message - Received real-time message.
	     */
	    announceMessage(message) {
	        this.listeners.forEach((listener) => {
	            if (listener.message)
	                listener.message(message);
	        });
	    }
	    /**
	     * Announce real-time signal event.
	     *
	     * @param signal - Received real-time signal.
	     */
	    announceSignal(signal) {
	        this.listeners.forEach((listener) => {
	            if (listener.signal)
	                listener.signal(signal);
	        });
	    }
	    /**
	     * Announce message actions change event.
	     *
	     * @param messageAction - Message action change information.
	     */
	    announceMessageAction(messageAction) {
	        this.listeners.forEach((listener) => {
	            if (listener.messageAction)
	                listener.messageAction(messageAction);
	        });
	    }
	    /**
	     * Announce fie share event.
	     *
	     * @param file - Shared file information.
	     */
	    announceFile(file) {
	        this.listeners.forEach((listener) => {
	            if (listener.file)
	                listener.file(file);
	        });
	    }
	    /**
	     * Announce App Context Object change event.
	     *
	     * @param object - App Context change information.
	     */
	    announceObjects(object) {
	        this.listeners.forEach((listener) => {
	            if (listener.objects)
	                listener.objects(object);
	        });
	    }
	    /**
	     * Announce network up status.
	     */
	    announceNetworkUp() {
	        this.listeners.forEach((listener) => {
	            if (listener.status) {
	                listener.status({
	                    category: StatusCategory$1.PNNetworkUpCategory,
	                });
	            }
	        });
	    }
	    /**
	     * Announce network down status.
	     */
	    announceNetworkDown() {
	        this.listeners.forEach((listener) => {
	            if (listener.status) {
	                listener.status({
	                    category: StatusCategory$1.PNNetworkDownCategory,
	                });
	            }
	        });
	    }
	    // --------------------------------------------------------
	    // ---------------------- Deprecated ----------------------
	    // --------------------------------------------------------
	    // region Deprecated
	    /**
	     * Announce User App Context Object change event.
	     *
	     * @param user - User App Context change information.
	     *
	     * @deprecated Use {@link announceObjects} method instead.
	     */
	    announceUser(user) {
	        this.listeners.forEach((listener) => {
	            if (listener.user)
	                listener.user(user);
	        });
	    }
	    /**
	     * Announce Space App Context Object change event.
	     *
	     * @param space - Space App Context change information.
	     *
	     * @deprecated Use {@link announceObjects} method instead.
	     */
	    announceSpace(space) {
	        this.listeners.forEach((listener) => {
	            if (listener.space)
	                listener.space(space);
	        });
	    }
	    /**
	     * Announce VSP Membership App Context Object change event.
	     *
	     * @param membership - VSP Membership App Context change information.
	     *
	     * @deprecated Use {@link announceObjects} method instead.
	     */
	    announceMembership(membership) {
	        this.listeners.forEach((listener) => {
	            if (listener.membership)
	                listener.membership(membership);
	        });
	    }
	}

	/**
	 * Base REST API request class.
	 *
	 * @internal
	 */
	class AbstractRequest {
	    /**
	     * Construct base request.
	     *
	     * Constructed request by default won't be cancellable and performed using `GET` HTTP method.
	     *
	     * @param params - Request configuration parameters.
	     */
	    constructor(params) {
	        this.params = params;
	        /**
	         * Unique request identifier.
	         */
	        this.requestIdentifier = uuidGenerator.createUUID();
	        this._cancellationController = null;
	    }
	    /**
	     * Retrieve configured cancellation controller.
	     *
	     * @returns Cancellation controller.
	     */
	    get cancellationController() {
	        return this._cancellationController;
	    }
	    /**
	     * Update request cancellation controller.
	     *
	     * Controller itself provided by transport provider implementation and set only when request
	     * sending has been scheduled.
	     *
	     * @param controller - Cancellation controller or `null` to reset it.
	     */
	    set cancellationController(controller) {
	        this._cancellationController = controller;
	    }
	    /**
	     * Abort request if possible.
	     */
	    abort() {
	        if (this && this.cancellationController)
	            this.cancellationController.abort();
	    }
	    /**
	     * Target REST API endpoint operation type.
	     */
	    operation() {
	        throw Error('Should be implemented by subclass.');
	    }
	    /**
	     * Validate user-provided data before scheduling request.
	     *
	     * @returns Error message if request can't be sent without missing or malformed parameters.
	     */
	    validate() {
	        return undefined;
	    }
	    /**
	     * Parse service response.
	     *
	     * @param _response - Raw service response which should be parsed.
	     */
	    parse(_response) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw Error('Should be implemented by subclass.');
	        });
	    }
	    /**
	     * Create platform-agnostic request object.
	     *
	     * @returns Request object which can be processed using platform-specific requirements.
	     */
	    request() {
	        var _a, _b, _c, _d;
	        const request = {
	            method: (_b = (_a = this.params) === null || _a === void 0 ? void 0 : _a.method) !== null && _b !== void 0 ? _b : TransportMethod.GET,
	            path: this.path,
	            queryParameters: this.queryParameters,
	            cancellable: (_d = (_c = this.params) === null || _c === void 0 ? void 0 : _c.cancellable) !== null && _d !== void 0 ? _d : false,
	            timeout: 10000,
	            identifier: this.requestIdentifier,
	        };
	        // Attach headers (if required).
	        const headers = this.headers;
	        if (headers)
	            request.headers = headers;
	        // Attach body (if required).
	        if (request.method === TransportMethod.POST || request.method === TransportMethod.PATCH) {
	            const [body, formData] = [this.body, this.formData];
	            if (formData)
	                request.formData = formData;
	            if (body)
	                request.body = body;
	        }
	        return request;
	    }
	    /**
	     * Target REST API endpoint request headers getter.
	     *
	     * @returns Key/value headers which should be used with request.
	     */
	    get headers() {
	        return undefined;
	    }
	    /**
	     * Target REST API endpoint request path getter.
	     *
	     * @returns REST API path.
	     */
	    get path() {
	        throw Error('`path` getter should be implemented by subclass.');
	    }
	    /**
	     * Target REST API endpoint request query parameters getter.
	     *
	     * @returns Key/value pairs which should be appended to the REST API path.
	     */
	    get queryParameters() {
	        return {};
	    }
	    get formData() {
	        return undefined;
	    }
	    /**
	     * Target REST API Request body payload getter.
	     *
	     * @returns Buffer of stringified data which should be sent with `POST` or `PATCH` request.
	     */
	    get body() {
	        return undefined;
	    }
	    /**
	     * Deserialize service response.
	     *
	     * @param response - Transparent response object with headers and body information.
	     *
	     * @returns Deserialized data or `undefined` in case of `JSON.parse(..)` error.
	     */
	    deserializeResponse(response) {
	        const contentType = response.headers['content-type'];
	        if (!contentType || (contentType.indexOf('javascript') === -1 && contentType.indexOf('json') === -1))
	            return undefined;
	        const json = AbstractRequest.decoder.decode(response.body);
	        try {
	            const parsedJson = JSON.parse(json);
	            return parsedJson;
	        }
	        catch (error) {
	            console.error('Error parsing JSON response:', error);
	            return undefined;
	        }
	    }
	}
	/**
	 * Service `ArrayBuffer` response decoder.
	 */
	AbstractRequest.decoder = new TextDecoder();

	/*       */
	var RequestOperation;
	(function (RequestOperation) {
	    // --------------------------------------------------------
	    // ---------------------- Publish API ---------------------
	    // --------------------------------------------------------
	    /**
	     * Data publish REST API operation.
	     */
	    RequestOperation["PNPublishOperation"] = "PNPublishOperation";
	    /**
	     * Signal sending REST API operation.
	     */
	    RequestOperation["PNSignalOperation"] = "PNSignalOperation";
	    // --------------------------------------------------------
	    // --------------------- Subscribe API --------------------
	    // --------------------------------------------------------
	    /**
	     * Subscribe for real-time updates REST API operation.
	     *
	     * User's presence change on specified entities will trigger `join` event.
	     */
	    RequestOperation["PNSubscribeOperation"] = "PNSubscribeOperation";
	    /**
	     * Unsubscribe from real-time updates REST API operation.
	     *
	     * User's presence change on specified entities will trigger `leave` event.
	     */
	    RequestOperation["PNUnsubscribeOperation"] = "PNUnsubscribeOperation";
	    // --------------------------------------------------------
	    // --------------------- Presence API ---------------------
	    // --------------------------------------------------------
	    /**
	     * Fetch user's presence information REST API operation.
	     */
	    RequestOperation["PNWhereNowOperation"] = "PNWhereNowOperation";
	    /**
	     * Fetch channel's presence information REST API operation.
	     */
	    RequestOperation["PNHereNowOperation"] = "PNHereNowOperation";
	    /**
	     * Fetch global presence information REST API operation.
	     */
	    RequestOperation["PNGlobalHereNowOperation"] = "PNGlobalHereNowOperation";
	    /**
	     * Update user's information associated with specified channel REST API operation.
	     */
	    RequestOperation["PNSetStateOperation"] = "PNSetStateOperation";
	    /**
	     * Fetch user's information associated with the specified channel REST API operation.
	     */
	    RequestOperation["PNGetStateOperation"] = "PNGetStateOperation";
	    /**
	     * Announce presence on managed channels REST API operation.
	     */
	    RequestOperation["PNHeartbeatOperation"] = "PNHeartbeatOperation";
	    // --------------------------------------------------------
	    // ----------------- Message Reaction API -----------------
	    // --------------------------------------------------------
	    /**
	     * Add a reaction to the specified message REST API operation.
	     */
	    RequestOperation["PNAddMessageActionOperation"] = "PNAddActionOperation";
	    /**
	     * Remove reaction from the specified message REST API operation.
	     */
	    RequestOperation["PNRemoveMessageActionOperation"] = "PNRemoveMessageActionOperation";
	    /**
	     * Fetch reactions for specific message REST API operation.
	     */
	    RequestOperation["PNGetMessageActionsOperation"] = "PNGetMessageActionsOperation";
	    RequestOperation["PNTimeOperation"] = "PNTimeOperation";
	    // --------------------------------------------------------
	    // ---------------------- Storage API ---------------------
	    // --------------------------------------------------------
	    /**
	     * Channel history REST API operation.
	     */
	    RequestOperation["PNHistoryOperation"] = "PNHistoryOperation";
	    /**
	     * Delete messages from channel history REST API operation.
	     */
	    RequestOperation["PNDeleteMessagesOperation"] = "PNDeleteMessagesOperation";
	    /**
	     * History for channels REST API operation.
	     */
	    RequestOperation["PNFetchMessagesOperation"] = "PNFetchMessagesOperation";
	    /**
	     * Number of messages for channels in specified time frame REST API operation.
	     */
	    RequestOperation["PNMessageCounts"] = "PNMessageCountsOperation";
	    // --------------------------------------------------------
	    // -------------------- App Context API -------------------
	    // --------------------------------------------------------
	    /**
	     * Fetch users metadata REST API operation.
	     */
	    RequestOperation["PNGetAllUUIDMetadataOperation"] = "PNGetAllUUIDMetadataOperation";
	    /**
	     * Fetch user metadata REST API operation.
	     */
	    RequestOperation["PNGetUUIDMetadataOperation"] = "PNGetUUIDMetadataOperation";
	    /**
	     * Set user metadata REST API operation.
	     */
	    RequestOperation["PNSetUUIDMetadataOperation"] = "PNSetUUIDMetadataOperation";
	    /**
	     * Remove user metadata REST API operation.
	     */
	    RequestOperation["PNRemoveUUIDMetadataOperation"] = "PNRemoveUUIDMetadataOperation";
	    /**
	     * Fetch channels metadata REST API operation.
	     */
	    RequestOperation["PNGetAllChannelMetadataOperation"] = "PNGetAllChannelMetadataOperation";
	    /**
	     * Fetch channel metadata REST API operation.
	     */
	    RequestOperation["PNGetChannelMetadataOperation"] = "PNGetChannelMetadataOperation";
	    /**
	     * Set channel metadata REST API operation.
	     */
	    RequestOperation["PNSetChannelMetadataOperation"] = "PNSetChannelMetadataOperation";
	    /**
	     * Remove channel metadata REST API operation.
	     */
	    RequestOperation["PNRemoveChannelMetadataOperation"] = "PNRemoveChannelMetadataOperation";
	    /**
	     * Fetch channel members REST API operation.
	     */
	    RequestOperation["PNGetMembersOperation"] = "PNGetMembersOperation";
	    /**
	     * Update channel members REST API operation.
	     */
	    RequestOperation["PNSetMembersOperation"] = "PNSetMembersOperation";
	    /**
	     * Fetch channel memberships REST API operation.
	     */
	    RequestOperation["PNGetMembershipsOperation"] = "PNGetMembershipsOperation";
	    /**
	     * Update channel memberships REST API operation.
	     */
	    RequestOperation["PNSetMembershipsOperation"] = "PNSetMembershipsOperation";
	    // --------------------------------------------------------
	    // -------------------- File Upload API -------------------
	    // --------------------------------------------------------
	    /**
	     * Fetch list of files sent to the channel REST API operation.
	     */
	    RequestOperation["PNListFilesOperation"] = "PNListFilesOperation";
	    /**
	     * Retrieve file upload URL REST API operation.
	     */
	    RequestOperation["PNGenerateUploadUrlOperation"] = "PNGenerateUploadUrlOperation";
	    /**
	     * Upload file to the channel REST API operation.
	     */
	    RequestOperation["PNPublishFileOperation"] = "PNPublishFileOperation";
	    /**
	     * Publish File Message to the channel REST API operation.
	     */
	    RequestOperation["PNPublishFileMessageOperation"] = "PNPublishFileMessageOperation";
	    /**
	     * Retrieve file download URL REST API operation.
	     */
	    RequestOperation["PNGetFileUrlOperation"] = "PNGetFileUrlOperation";
	    /**
	     * Download file from the channel REST API operation.
	     */
	    RequestOperation["PNDownloadFileOperation"] = "PNDownloadFileOperation";
	    /**
	     * Delete file sent to the channel REST API operation.
	     */
	    RequestOperation["PNDeleteFileOperation"] = "PNDeleteFileOperation";
	    // --------------------------------------------------------
	    // -------------------- Mobile Push API -------------------
	    // --------------------------------------------------------
	    /**
	     * Register channels with device push notifications REST API operation.
	     */
	    RequestOperation["PNAddPushNotificationEnabledChannelsOperation"] = "PNAddPushNotificationEnabledChannelsOperation";
	    /**
	     * Unregister channels with device push notifications REST API operation.
	     */
	    RequestOperation["PNRemovePushNotificationEnabledChannelsOperation"] = "PNRemovePushNotificationEnabledChannelsOperation";
	    /**
	     * Fetch list of channels with enabled push notifications for device REST API operation.
	     */
	    RequestOperation["PNPushNotificationEnabledChannelsOperation"] = "PNPushNotificationEnabledChannelsOperation";
	    /**
	     * Disable push notifications for device REST API operation.
	     */
	    RequestOperation["PNRemoveAllPushNotificationsOperation"] = "PNRemoveAllPushNotificationsOperation";
	    // --------------------------------------------------------
	    // ------------------ Channel Groups API ------------------
	    // --------------------------------------------------------
	    /**
	     * Fetch channels groups list REST API operation.
	     */
	    RequestOperation["PNChannelGroupsOperation"] = "PNChannelGroupsOperation";
	    /**
	     * Remove specified channel group REST API operation.
	     */
	    RequestOperation["PNRemoveGroupOperation"] = "PNRemoveGroupOperation";
	    /**
	     * Fetch list of channels for the specified channel group REST API operation.
	     */
	    RequestOperation["PNChannelsForGroupOperation"] = "PNChannelsForGroupOperation";
	    /**
	     * Add list of channels to the specified channel group REST API operation.
	     */
	    RequestOperation["PNAddChannelsToGroupOperation"] = "PNAddChannelsToGroupOperation";
	    /**
	     * Remove list of channels from the specified channel group REST API operation.
	     */
	    RequestOperation["PNRemoveChannelsFromGroupOperation"] = "PNRemoveChannelsFromGroupOperation";
	    // --------------------------------------------------------
	    // ----------------------- PAM API ------------------------
	    // --------------------------------------------------------
	    /**
	     * Generate authorized token REST API operation.
	     */
	    RequestOperation["PNAccessManagerGrant"] = "PNAccessManagerGrant";
	    /**
	     * Generate authorized token REST API operation.
	     */
	    RequestOperation["PNAccessManagerGrantToken"] = "PNAccessManagerGrantToken";
	    RequestOperation["PNAccessManagerAudit"] = "PNAccessManagerAudit";
	    /**
	     * Revoke authorized token REST API operation.
	     */
	    RequestOperation["PNAccessManagerRevokeToken"] = "PNAccessManagerRevokeToken";
	    //
	    // --------------------------------------------------------
	    // ---------------- Subscription Utility ------------------
	    // --------------------------------------------------------
	    RequestOperation["PNHandshakeOperation"] = "PNHandshakeOperation";
	    RequestOperation["PNReceiveMessagesOperation"] = "PNReceiveMessagesOperation";
	})(RequestOperation || (RequestOperation = {}));
	var RequestOperation$1 = RequestOperation;

	/**
	 * Subscription REST API module.
	 */
	// endregion
	// --------------------------------------------------------
	// ------------------------ Types -------------------------
	// --------------------------------------------------------
	// region Types
	/**
	 * PubNub-defined event types by payload.
	 *
	 * @internal
	 */
	var PubNubEventType;
	(function (PubNubEventType) {
	    /**
	     * Presence change event.
	     */
	    PubNubEventType[PubNubEventType["Presence"] = -2] = "Presence";
	    /**
	     * Regular message event.
	     *
	     * **Note:** This is default type assigned for non-presence events if `e` field is missing.
	     */
	    PubNubEventType[PubNubEventType["Message"] = -1] = "Message";
	    /**
	     * Signal data event.
	     */
	    PubNubEventType[PubNubEventType["Signal"] = 1] = "Signal";
	    /**
	     * App Context object event.
	     */
	    PubNubEventType[PubNubEventType["AppContext"] = 2] = "AppContext";
	    /**
	     * Message reaction event.
	     */
	    PubNubEventType[PubNubEventType["MessageAction"] = 3] = "MessageAction";
	    /**
	     * Files event.
	     */
	    PubNubEventType[PubNubEventType["Files"] = 4] = "Files";
	})(PubNubEventType || (PubNubEventType = {}));

	/**
	 * Real-time events' emitter.
	 *
	 * Emitter responsible for forwarding received real-time events to the closures which has been
	 * registered for specific events handling.
	 *
	 * @internal
	 */
	class EventEmitter {
	    constructor(listenerManager) {
	        this.listenerManager = listenerManager;
	        /**
	         * Map of channels to listener callbacks for them.
	         */
	        this.channelListenerMap = new Map();
	        /**
	         * Map of channel group names to the listener callbacks for them.
	         */
	        this.groupListenerMap = new Map();
	    }
	    /**
	     * Emit specific real-time event.
	     *
	     * Proper listener will be notified basing on event `type`.
	     *
	     * @param event - Received real-time event.
	     */
	    emitEvent(event) {
	        if (event.type === PubNubEventType.Message) {
	            this.listenerManager.announceMessage(event.data);
	            this.announce('message', event.data, event.data.channel, event.data.subscription);
	        }
	        else if (event.type === PubNubEventType.Signal) {
	            this.listenerManager.announceSignal(event.data);
	            this.announce('signal', event.data, event.data.channel, event.data.subscription);
	        }
	        else if (event.type === PubNubEventType.Presence) {
	            this.listenerManager.announcePresence(event.data);
	            this.announce('presence', event.data, event.data.channel, event.data.subscription);
	        }
	        else if (event.type === PubNubEventType.AppContext) {
	            const { data: objectEvent } = event;
	            const { message: object } = objectEvent;
	            this.listenerManager.announceObjects(objectEvent);
	            this.announce('objects', objectEvent, objectEvent.channel, objectEvent.subscription);
	            if (object.type === 'uuid') {
	                const { message, channel } = objectEvent, restEvent = __rest(objectEvent, ["message", "channel"]);
	                const { event, type } = object, restObject = __rest(object, ["event", "type"]);
	                const userEvent = Object.assign(Object.assign({}, restEvent), { spaceId: channel, message: Object.assign(Object.assign({}, restObject), { event: event === 'set' ? 'updated' : 'removed', type: 'user' }) });
	                this.listenerManager.announceUser(userEvent);
	                this.announce('user', userEvent, userEvent.spaceId, userEvent.subscription);
	            }
	            else if (object.type === 'channel') {
	                const { message, channel } = objectEvent, restEvent = __rest(objectEvent, ["message", "channel"]);
	                const { event, type } = object, restObject = __rest(object, ["event", "type"]);
	                const spaceEvent = Object.assign(Object.assign({}, restEvent), { spaceId: channel, message: Object.assign(Object.assign({}, restObject), { event: event === 'set' ? 'updated' : 'removed', type: 'space' }) });
	                this.listenerManager.announceSpace(spaceEvent);
	                this.announce('space', spaceEvent, spaceEvent.spaceId, spaceEvent.subscription);
	            }
	            else if (object.type === 'membership') {
	                const { message, channel } = objectEvent, restEvent = __rest(objectEvent, ["message", "channel"]);
	                const { event, data } = object, restObject = __rest(object, ["event", "data"]);
	                const { uuid, channel: channelMeta } = data, restData = __rest(data, ["uuid", "channel"]);
	                const membershipEvent = Object.assign(Object.assign({}, restEvent), { spaceId: channel, message: Object.assign(Object.assign({}, restObject), { event: event === 'set' ? 'updated' : 'removed', data: Object.assign(Object.assign({}, restData), { user: uuid, space: channelMeta }) }) });
	                this.listenerManager.announceMembership(membershipEvent);
	                this.announce('membership', membershipEvent, membershipEvent.spaceId, membershipEvent.subscription);
	            }
	        }
	        else if (event.type === PubNubEventType.MessageAction) {
	            this.listenerManager.announceMessageAction(event.data);
	            this.announce('messageAction', event.data, event.data.channel, event.data.subscription);
	        }
	        else if (event.type === PubNubEventType.Files) {
	            this.listenerManager.announceFile(event.data);
	            this.announce('file', event.data, event.data.channel, event.data.subscription);
	        }
	    }
	    /**
	     * Register real-time event listener for specific channels and groups.
	     *
	     * @param listener - Listener with event callbacks to handle different types of events.
	     * @param channels - List of channels for which listener should be registered.
	     * @param groups - List of channel groups for which listener should be registered.
	     */
	    addListener(listener, channels, groups) {
	        // Register event-listener listener globally.
	        if (!(channels && groups)) {
	            this.listenerManager.addListener(listener);
	        }
	        else {
	            channels === null || channels === void 0 ? void 0 : channels.forEach((channel) => {
	                if (this.channelListenerMap.has(channel)) {
	                    const channelListeners = this.channelListenerMap.get(channel);
	                    if (!channelListeners.includes(listener))
	                        channelListeners.push(listener);
	                }
	                else
	                    this.channelListenerMap.set(channel, [listener]);
	            });
	            groups === null || groups === void 0 ? void 0 : groups.forEach((group) => {
	                if (this.groupListenerMap.has(group)) {
	                    const groupListeners = this.groupListenerMap.get(group);
	                    if (!groupListeners.includes(listener))
	                        groupListeners.push(listener);
	                }
	                else
	                    this.groupListenerMap.set(group, [listener]);
	            });
	        }
	    }
	    /**
	     * Remove real-time event listener.
	     *
	     * @param listener - Event listeners which should be removed.
	     * @param channels - List of channels for which listener should be removed.
	     * @param groups - List of channel groups for which listener should be removed.
	     */
	    removeListener(listener, channels, groups) {
	        if (!(channels && groups)) {
	            this.listenerManager.removeListener(listener);
	        }
	        else {
	            channels === null || channels === void 0 ? void 0 : channels.forEach((channel) => {
	                if (this.channelListenerMap.has(channel)) {
	                    this.channelListenerMap.set(channel, this.channelListenerMap.get(channel).filter((channelListener) => channelListener !== listener));
	                }
	            });
	            groups === null || groups === void 0 ? void 0 : groups.forEach((group) => {
	                if (this.groupListenerMap.has(group)) {
	                    this.groupListenerMap.set(group, this.groupListenerMap.get(group).filter((groupListener) => groupListener !== listener));
	                }
	            });
	        }
	    }
	    /**
	     * Clear all real-time event listeners.
	     */
	    removeAllListeners() {
	        this.listenerManager.removeAllListeners();
	        this.channelListenerMap.clear();
	        this.groupListenerMap.clear();
	    }
	    /**
	     * Announce real-time event to all listeners.
	     *
	     * @param type - Type of event which should be announced.
	     * @param event - Announced real-time event payload.
	     * @param channel - Name of the channel for which registered listeners should be notified.
	     * @param group - Name of the channel group for which registered listeners should be notified.
	     */
	    announce(type, event, channel, group) {
	        if (event && this.channelListenerMap.has(channel))
	            this.channelListenerMap.get(channel).forEach((listener) => {
	                const typedListener = listener[type];
	                // @ts-expect-error Dynamic events mapping.
	                if (typedListener)
	                    typedListener(event);
	            });
	        if (group && this.groupListenerMap.has(group))
	            this.groupListenerMap.get(group).forEach((listener) => {
	                const typedListener = listener[type];
	                // @ts-expect-error Dynamic events mapping.
	                if (typedListener)
	                    typedListener(event);
	            });
	    }
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	class State {
	    transition(context, event) {
	        var _a;
	        if (this.transitionMap.has(event.type)) {
	            return (_a = this.transitionMap.get(event.type)) === null || _a === void 0 ? void 0 : _a(context, event);
	        }
	        return undefined;
	    }
	    constructor(label) {
	        this.label = label;
	        this.transitionMap = new Map();
	        this.enterEffects = [];
	        this.exitEffects = [];
	    }
	    on(eventType, transition) {
	        this.transitionMap.set(eventType, transition);
	        return this;
	    }
	    with(context, effects) {
	        return [this, context, effects !== null && effects !== void 0 ? effects : []];
	    }
	    onEnter(effect) {
	        this.enterEffects.push(effect);
	        return this;
	    }
	    onExit(effect) {
	        this.exitEffects.push(effect);
	        return this;
	    }
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	function createEvent(type, fn) {
	    const creator = function (...args) {
	        return {
	            type,
	            payload: fn === null || fn === void 0 ? void 0 : fn(...args),
	        };
	    };
	    creator.type = type;
	    return creator;
	}
	function createEffect(type, fn) {
	    const creator = (...args) => {
	        return { type, payload: fn(...args), managed: false };
	    };
	    creator.type = type;
	    return creator;
	}
	function createManagedEffect(type, fn) {
	    const creator = (...args) => {
	        return { type, payload: fn(...args), managed: true };
	    };
	    creator.type = type;
	    creator.cancel = { type: 'CANCEL', payload: type, managed: false };
	    return creator;
	}

	const reconnect$1 = createEvent('RECONNECT', () => ({}));
	const disconnect$1 = createEvent('DISCONNECT', () => ({}));
	const joined = createEvent('JOINED', (channels, groups) => ({
	    channels,
	    groups,
	}));
	const left = createEvent('LEFT', (channels, groups) => ({
	    channels,
	    groups,
	}));
	const leftAll = createEvent('LEFT_ALL', () => ({}));
	const heartbeatSuccess = createEvent('HEARTBEAT_SUCCESS', (statusCode) => ({ statusCode }));
	const heartbeatFailure = createEvent('HEARTBEAT_FAILURE', (error) => error);
	const heartbeatGiveup = createEvent('HEARTBEAT_GIVEUP', () => ({}));
	const timesUp = createEvent('TIMES_UP', () => ({}));

	const heartbeat = createEffect('HEARTBEAT', (channels, groups) => ({
	    channels,
	    groups,
	}));
	const leave = createEffect('LEAVE', (channels, groups) => ({
	    channels,
	    groups,
	}));
	/* eslint-disable  @typescript-eslint/no-explicit-any */
	createEffect('EMIT_STATUS', (status) => status);
	const wait = createManagedEffect('WAIT', () => ({}));
	const delayedHeartbeat = createManagedEffect('DELAYED_HEARTBEAT', (context) => context);

	const HeartbeatStoppedState = new State('HEARTBEAT_STOPPED');
	HeartbeatStoppedState.on(joined.type, (context, event) => HeartbeatStoppedState.with({
	    channels: [...context.channels, ...event.payload.channels],
	    groups: [...context.groups, ...event.payload.groups],
	}));
	HeartbeatStoppedState.on(left.type, (context, event) => HeartbeatStoppedState.with({
	    channels: context.channels.filter((channel) => !event.payload.channels.includes(channel)),
	    groups: context.groups.filter((group) => !event.payload.groups.includes(group)),
	}));
	HeartbeatStoppedState.on(reconnect$1.type, (context, _) => HeartbeatingState.with({
	    channels: context.channels,
	    groups: context.groups,
	}));
	HeartbeatStoppedState.on(leftAll.type, (context, _) => HeartbeatInactiveState.with(undefined));

	const HeartbeatCooldownState = new State('HEARTBEAT_COOLDOWN');
	HeartbeatCooldownState.onEnter(() => wait());
	HeartbeatCooldownState.onExit(() => wait.cancel);
	HeartbeatCooldownState.on(timesUp.type, (context, _) => HeartbeatingState.with({
	    channels: context.channels,
	    groups: context.groups,
	}));
	HeartbeatCooldownState.on(joined.type, (context, event) => HeartbeatingState.with({
	    channels: [...context.channels, ...event.payload.channels],
	    groups: [...context.groups, ...event.payload.groups],
	}));
	HeartbeatCooldownState.on(left.type, (context, event) => HeartbeatingState.with({
	    channels: context.channels.filter((channel) => !event.payload.channels.includes(channel)),
	    groups: context.groups.filter((group) => !event.payload.groups.includes(group)),
	}, [leave(event.payload.channels, event.payload.groups)]));
	HeartbeatCooldownState.on(disconnect$1.type, (context) => HeartbeatStoppedState.with({
	    channels: context.channels,
	    groups: context.groups,
	}, [leave(context.channels, context.groups)]));
	HeartbeatCooldownState.on(leftAll.type, (context, _) => HeartbeatInactiveState.with(undefined, [leave(context.channels, context.groups)]));

	const HeartbeatFailedState = new State('HEARTBEAT_FAILED');
	HeartbeatFailedState.on(joined.type, (context, event) => HeartbeatingState.with({
	    channels: [...context.channels, ...event.payload.channels],
	    groups: [...context.groups, ...event.payload.groups],
	}));
	HeartbeatFailedState.on(left.type, (context, event) => HeartbeatingState.with({
	    channels: context.channels.filter((channel) => !event.payload.channels.includes(channel)),
	    groups: context.groups.filter((group) => !event.payload.groups.includes(group)),
	}, [leave(event.payload.channels, event.payload.groups)]));
	HeartbeatFailedState.on(reconnect$1.type, (context, _) => HeartbeatingState.with({
	    channels: context.channels,
	    groups: context.groups,
	}));
	HeartbeatFailedState.on(disconnect$1.type, (context, _) => HeartbeatStoppedState.with({
	    channels: context.channels,
	    groups: context.groups,
	}, [leave(context.channels, context.groups)]));
	HeartbeatFailedState.on(leftAll.type, (context, _) => HeartbeatInactiveState.with(undefined, [leave(context.channels, context.groups)]));

	const HearbeatReconnectingState = new State('HEARBEAT_RECONNECTING');
	HearbeatReconnectingState.onEnter((context) => delayedHeartbeat(context));
	HearbeatReconnectingState.onExit(() => delayedHeartbeat.cancel);
	HearbeatReconnectingState.on(joined.type, (context, event) => HeartbeatingState.with({
	    channels: [...context.channels, ...event.payload.channels],
	    groups: [...context.groups, ...event.payload.groups],
	}));
	HearbeatReconnectingState.on(left.type, (context, event) => HeartbeatingState.with({
	    channels: context.channels.filter((channel) => !event.payload.channels.includes(channel)),
	    groups: context.groups.filter((group) => !event.payload.groups.includes(group)),
	}, [leave(event.payload.channels, event.payload.groups)]));
	HearbeatReconnectingState.on(disconnect$1.type, (context, _) => {
	    HeartbeatStoppedState.with({
	        channels: context.channels,
	        groups: context.groups,
	    }, [leave(context.channels, context.groups)]);
	});
	HearbeatReconnectingState.on(heartbeatSuccess.type, (context, event) => {
	    return HeartbeatCooldownState.with({
	        channels: context.channels,
	        groups: context.groups,
	    });
	});
	HearbeatReconnectingState.on(heartbeatFailure.type, (context, event) => HearbeatReconnectingState.with(Object.assign(Object.assign({}, context), { attempts: context.attempts + 1, reason: event.payload })));
	HearbeatReconnectingState.on(heartbeatGiveup.type, (context, event) => {
	    return HeartbeatFailedState.with({
	        channels: context.channels,
	        groups: context.groups,
	    });
	});
	HearbeatReconnectingState.on(leftAll.type, (context, _) => HeartbeatInactiveState.with(undefined, [leave(context.channels, context.groups)]));

	const HeartbeatingState = new State('HEARTBEATING');
	HeartbeatingState.onEnter((context) => heartbeat(context.channels, context.groups));
	HeartbeatingState.on(heartbeatSuccess.type, (context, event) => {
	    return HeartbeatCooldownState.with({
	        channels: context.channels,
	        groups: context.groups,
	    });
	});
	HeartbeatingState.on(joined.type, (context, event) => HeartbeatingState.with({
	    channels: [...context.channels, ...event.payload.channels],
	    groups: [...context.groups, ...event.payload.groups],
	}));
	HeartbeatingState.on(left.type, (context, event) => {
	    return HeartbeatingState.with({
	        channels: context.channels.filter((channel) => !event.payload.channels.includes(channel)),
	        groups: context.groups.filter((group) => !event.payload.groups.includes(group)),
	    }, [leave(event.payload.channels, event.payload.groups)]);
	});
	HeartbeatingState.on(heartbeatFailure.type, (context, event) => {
	    return HearbeatReconnectingState.with(Object.assign(Object.assign({}, context), { attempts: 0, reason: event.payload }));
	});
	HeartbeatingState.on(disconnect$1.type, (context) => HeartbeatStoppedState.with({
	    channels: context.channels,
	    groups: context.groups,
	}, [leave(context.channels, context.groups)]));
	HeartbeatingState.on(leftAll.type, (context, _) => HeartbeatInactiveState.with(undefined, [leave(context.channels, context.groups)]));

	const HeartbeatInactiveState = new State('HEARTBEAT_INACTIVE');
	HeartbeatInactiveState.on(joined.type, (_, event) => HeartbeatingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	}));

	class RetryPolicy {
	    static LinearRetryPolicy(configuration) {
	        return {
	            delay: configuration.delay,
	            maximumRetry: configuration.maximumRetry,
	            /* eslint-disable  @typescript-eslint/no-explicit-any */
	            shouldRetry(error, attempt) {
	                var _a;
	                if (((_a = error === null || error === void 0 ? void 0 : error.status) === null || _a === void 0 ? void 0 : _a.statusCode) === 403) {
	                    return false;
	                }
	                return this.maximumRetry > attempt;
	            },
	            getDelay(_, reason) {
	                var _a;
	                const delay = (_a = reason.retryAfter) !== null && _a !== void 0 ? _a : this.delay;
	                return (delay + Math.random()) * 1000;
	            },
	            /* eslint-disable  @typescript-eslint/no-explicit-any */
	            getGiveupReason(error, attempt) {
	                var _a;
	                if (this.maximumRetry <= attempt) {
	                    return 'retry attempts exhaused.';
	                }
	                if (((_a = error === null || error === void 0 ? void 0 : error.status) === null || _a === void 0 ? void 0 : _a.statusCode) === 403) {
	                    return 'forbidden operation.';
	                }
	                return 'unknown error';
	            },
	            validate() {
	                if (this.maximumRetry > 10)
	                    throw new Error('Maximum retry for linear retry policy can not be more than 10');
	            },
	        };
	    }
	    static ExponentialRetryPolicy(configuration) {
	        return {
	            minimumDelay: configuration.minimumDelay,
	            maximumDelay: configuration.maximumDelay,
	            maximumRetry: configuration.maximumRetry,
	            shouldRetry(reason, attempt) {
	                var _a;
	                if (((_a = reason === null || reason === void 0 ? void 0 : reason.status) === null || _a === void 0 ? void 0 : _a.statusCode) === 403) {
	                    return false;
	                }
	                return this.maximumRetry > attempt;
	            },
	            getDelay(attempt, reason) {
	                var _a;
	                const delay = (_a = reason.retryAfter) !== null && _a !== void 0 ? _a : Math.min(Math.pow(2, attempt), this.maximumDelay);
	                return (delay + Math.random()) * 1000;
	            },
	            getGiveupReason(reason, attempt) {
	                var _a;
	                if (this.maximumRetry <= attempt) {
	                    return 'retry attempts exhausted.';
	                }
	                if (((_a = reason === null || reason === void 0 ? void 0 : reason.status) === null || _a === void 0 ? void 0 : _a.statusCode) === 403) {
	                    return 'forbidden operation.';
	                }
	                return 'unknown error';
	            },
	            validate() {
	                if (this.minimumDelay < 2)
	                    throw new Error('Minimum delay can not be set less than 2 seconds for retry');
	                else if (this.maximumDelay)
	                    throw new Error('Maximum delay can not be set more than 150 seconds for retry');
	                else if (this.maximumRetry > 6)
	                    throw new Error('Maximum retry for exponential retry policy can not be more than 6');
	            },
	        };
	    }
	}

	const handshake = createManagedEffect('HANDSHAKE', (channels, groups) => ({
	    channels,
	    groups,
	}));
	const receiveMessages = createManagedEffect('RECEIVE_MESSAGES', (channels, groups, cursor) => ({ channels, groups, cursor }));
	const emitMessages = createEffect('EMIT_MESSAGES', (events) => events);
	const emitStatus = createEffect('EMIT_STATUS', (status) => status);
	const receiveReconnect = createManagedEffect('RECEIVE_RECONNECT', (context) => context);
	const handshakeReconnect = createManagedEffect('HANDSHAKE_RECONNECT', (context) => context);

	const subscriptionChange = createEvent('SUBSCRIPTION_CHANGED', (channels, groups) => ({
	    channels,
	    groups,
	}));
	const restore = createEvent('SUBSCRIPTION_RESTORED', (channels, groups, timetoken, region) => ({
	    channels,
	    groups,
	    cursor: {
	        timetoken: timetoken,
	        region: region !== null && region !== void 0 ? region : 0,
	    },
	}));
	const handshakeSuccess = createEvent('HANDSHAKE_SUCCESS', (cursor) => cursor);
	const handshakeFailure = createEvent('HANDSHAKE_FAILURE', (error) => error);
	const handshakeReconnectSuccess = createEvent('HANDSHAKE_RECONNECT_SUCCESS', (cursor) => ({
	    cursor,
	}));
	const handshakeReconnectFailure = createEvent('HANDSHAKE_RECONNECT_FAILURE', (error) => error);
	const handshakeReconnectGiveup = createEvent('HANDSHAKE_RECONNECT_GIVEUP', (error) => error);
	const receiveSuccess = createEvent('RECEIVE_SUCCESS', (cursor, events) => ({
	    cursor,
	    events,
	}));
	const receiveFailure = createEvent('RECEIVE_FAILURE', (error) => error);
	const receiveReconnectSuccess = createEvent('RECEIVE_RECONNECT_SUCCESS', (cursor, events) => ({
	    cursor,
	    events,
	}));
	const receiveReconnectFailure = createEvent('RECEIVE_RECONNECT_FAILURE', (error) => error);
	const receiveReconnectGiveup = createEvent('RECEIVING_RECONNECT_GIVEUP', (error) => error);
	const disconnect = createEvent('DISCONNECT', () => ({}));
	const reconnect = createEvent('RECONNECT', (timetoken, region) => ({
	    cursor: {
	        timetoken: timetoken !== null && timetoken !== void 0 ? timetoken : '',
	        region: region !== null && region !== void 0 ? region : 0,
	    },
	}));
	const unsubscribeAll = createEvent('UNSUBSCRIBE_ALL', () => ({}));

	const HandshakeFailedState = new State('HANDSHAKE_FAILED');
	HandshakeFailedState.on(subscriptionChange.type, (context, event) => HandshakingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: context.cursor,
	}));
	HandshakeFailedState.on(reconnect.type, (context, event) => HandshakingState.with({
	    channels: context.channels,
	    groups: context.groups,
	    cursor: event.payload.cursor || context.cursor,
	}));
	HandshakeFailedState.on(restore.type, (context, event) => {
	    var _a, _b;
	    return HandshakingState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: {
	            timetoken: event.payload.cursor.timetoken,
	            region: event.payload.cursor.region ? event.payload.cursor.region : (_b = (_a = context === null || context === void 0 ? void 0 : context.cursor) === null || _a === void 0 ? void 0 : _a.region) !== null && _b !== void 0 ? _b : 0,
	        },
	    });
	});
	HandshakeFailedState.on(unsubscribeAll.type, (_) => UnsubscribedState.with());

	const HandshakeStoppedState = new State('HANDSHAKE_STOPPED');
	HandshakeStoppedState.on(subscriptionChange.type, (context, event) => HandshakeStoppedState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: context.cursor,
	}));
	HandshakeStoppedState.on(reconnect.type, (context, event) => HandshakingState.with(Object.assign(Object.assign({}, context), { cursor: event.payload.cursor || context.cursor })));
	HandshakeStoppedState.on(restore.type, (context, event) => {
	    var _a;
	    return HandshakeStoppedState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: {
	            timetoken: event.payload.cursor.timetoken,
	            region: event.payload.cursor.region || ((_a = context === null || context === void 0 ? void 0 : context.cursor) === null || _a === void 0 ? void 0 : _a.region) || 0,
	        },
	    });
	});
	HandshakeStoppedState.on(unsubscribeAll.type, (_) => UnsubscribedState.with());

	const ReceiveFailedState = new State('RECEIVE_FAILED');
	ReceiveFailedState.on(reconnect.type, (context, event) => {
	    var _a;
	    return HandshakingState.with({
	        channels: context.channels,
	        groups: context.groups,
	        cursor: {
	            timetoken: !!event.payload.cursor.timetoken ? (_a = event.payload.cursor) === null || _a === void 0 ? void 0 : _a.timetoken : context.cursor.timetoken,
	            region: event.payload.cursor.region || context.cursor.region,
	        },
	    });
	});
	ReceiveFailedState.on(subscriptionChange.type, (context, event) => HandshakingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: context.cursor,
	}));
	ReceiveFailedState.on(restore.type, (context, event) => HandshakingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: {
	        timetoken: event.payload.cursor.timetoken,
	        region: event.payload.cursor.region || context.cursor.region,
	    },
	}));
	ReceiveFailedState.on(unsubscribeAll.type, (_) => UnsubscribedState.with(undefined));

	const ReceiveStoppedState = new State('RECEIVE_STOPPED');
	ReceiveStoppedState.on(subscriptionChange.type, (context, event) => ReceiveStoppedState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: context.cursor,
	}));
	ReceiveStoppedState.on(restore.type, (context, event) => ReceiveStoppedState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: {
	        timetoken: event.payload.cursor.timetoken,
	        region: event.payload.cursor.region || context.cursor.region,
	    },
	}));
	ReceiveStoppedState.on(reconnect.type, (context, event) => {
	    var _a;
	    return HandshakingState.with({
	        channels: context.channels,
	        groups: context.groups,
	        cursor: {
	            timetoken: !!event.payload.cursor.timetoken ? (_a = event.payload.cursor) === null || _a === void 0 ? void 0 : _a.timetoken : context.cursor.timetoken,
	            region: event.payload.cursor.region || context.cursor.region,
	        },
	    });
	});
	ReceiveStoppedState.on(unsubscribeAll.type, () => UnsubscribedState.with(undefined));

	const ReceiveReconnectingState = new State('RECEIVE_RECONNECTING');
	ReceiveReconnectingState.onEnter((context) => receiveReconnect(context));
	ReceiveReconnectingState.onExit(() => receiveReconnect.cancel);
	ReceiveReconnectingState.on(receiveReconnectSuccess.type, (context, event) => ReceivingState.with({
	    channels: context.channels,
	    groups: context.groups,
	    cursor: event.payload.cursor,
	}, [emitMessages(event.payload.events)]));
	ReceiveReconnectingState.on(receiveReconnectFailure.type, (context, event) => ReceiveReconnectingState.with(Object.assign(Object.assign({}, context), { attempts: context.attempts + 1, reason: event.payload })));
	ReceiveReconnectingState.on(receiveReconnectGiveup.type, (context, event) => {
	    var _a;
	    return ReceiveFailedState.with({
	        groups: context.groups,
	        channels: context.channels,
	        cursor: context.cursor,
	        reason: event.payload,
	    }, [emitStatus({ category: StatusCategory$1.PNDisconnectedUnexpectedlyCategory, error: (_a = event.payload) === null || _a === void 0 ? void 0 : _a.message })]);
	});
	ReceiveReconnectingState.on(disconnect.type, (context) => ReceiveStoppedState.with({
	    channels: context.channels,
	    groups: context.groups,
	    cursor: context.cursor,
	}, [emitStatus({ category: StatusCategory$1.PNDisconnectedCategory })]));
	ReceiveReconnectingState.on(restore.type, (context, event) => ReceivingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: {
	        timetoken: event.payload.cursor.timetoken,
	        region: event.payload.cursor.region || context.cursor.region,
	    },
	}));
	ReceiveReconnectingState.on(subscriptionChange.type, (context, event) => ReceivingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: context.cursor,
	}));
	ReceiveReconnectingState.on(unsubscribeAll.type, (_) => UnsubscribedState.with(undefined, [emitStatus({ category: StatusCategory$1.PNDisconnectedCategory })]));

	const ReceivingState = new State('RECEIVING');
	ReceivingState.onEnter((context) => receiveMessages(context.channels, context.groups, context.cursor));
	ReceivingState.onExit(() => receiveMessages.cancel);
	ReceivingState.on(receiveSuccess.type, (context, event) => {
	    return ReceivingState.with({ channels: context.channels, groups: context.groups, cursor: event.payload.cursor }, [
	        emitMessages(event.payload.events),
	    ]);
	});
	ReceivingState.on(subscriptionChange.type, (context, event) => {
	    if (event.payload.channels.length === 0 && event.payload.groups.length === 0) {
	        return UnsubscribedState.with(undefined);
	    }
	    return ReceivingState.with({
	        cursor: context.cursor,
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	    });
	});
	ReceivingState.on(restore.type, (context, event) => {
	    if (event.payload.channels.length === 0 && event.payload.groups.length === 0) {
	        return UnsubscribedState.with(undefined);
	    }
	    return ReceivingState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: {
	            timetoken: event.payload.cursor.timetoken,
	            region: event.payload.cursor.region || context.cursor.region,
	        },
	    });
	});
	ReceivingState.on(receiveFailure.type, (context, event) => {
	    return ReceiveReconnectingState.with(Object.assign(Object.assign({}, context), { attempts: 0, reason: event.payload }));
	});
	ReceivingState.on(disconnect.type, (context) => {
	    return ReceiveStoppedState.with({
	        channels: context.channels,
	        groups: context.groups,
	        cursor: context.cursor,
	    }, [emitStatus({ category: StatusCategory$1.PNDisconnectedCategory })]);
	});
	ReceivingState.on(unsubscribeAll.type, (_) => UnsubscribedState.with(undefined, [emitStatus({ category: StatusCategory$1.PNDisconnectedCategory })]));

	const HandshakeReconnectingState = new State('HANDSHAKE_RECONNECTING');
	HandshakeReconnectingState.onEnter((context) => handshakeReconnect(context));
	HandshakeReconnectingState.onExit(() => handshakeReconnect.cancel);
	HandshakeReconnectingState.on(handshakeReconnectSuccess.type, (context, event) => {
	    var _a, _b;
	    const cursor = {
	        timetoken: !!((_a = context.cursor) === null || _a === void 0 ? void 0 : _a.timetoken) ? (_b = context.cursor) === null || _b === void 0 ? void 0 : _b.timetoken : event.payload.cursor.timetoken,
	        region: event.payload.cursor.region,
	    };
	    return ReceivingState.with({
	        channels: context.channels,
	        groups: context.groups,
	        cursor: cursor,
	    }, [emitStatus({ category: StatusCategory$1.PNConnectedCategory })]);
	});
	HandshakeReconnectingState.on(handshakeReconnectFailure.type, (context, event) => HandshakeReconnectingState.with(Object.assign(Object.assign({}, context), { attempts: context.attempts + 1, reason: event.payload })));
	HandshakeReconnectingState.on(handshakeReconnectGiveup.type, (context, event) => {
	    var _a;
	    return HandshakeFailedState.with({
	        groups: context.groups,
	        channels: context.channels,
	        cursor: context.cursor,
	        reason: event.payload,
	    }, [emitStatus({ category: StatusCategory$1.PNConnectionErrorCategory, error: (_a = event.payload) === null || _a === void 0 ? void 0 : _a.message })]);
	});
	HandshakeReconnectingState.on(disconnect.type, (context) => HandshakeStoppedState.with({
	    channels: context.channels,
	    groups: context.groups,
	    cursor: context.cursor,
	}));
	HandshakeReconnectingState.on(subscriptionChange.type, (context, event) => HandshakingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	    cursor: context.cursor,
	}));
	HandshakeReconnectingState.on(restore.type, (context, event) => {
	    var _a, _b;
	    return HandshakingState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: {
	            timetoken: event.payload.cursor.timetoken,
	            region: ((_a = event.payload.cursor) === null || _a === void 0 ? void 0 : _a.region) || ((_b = context === null || context === void 0 ? void 0 : context.cursor) === null || _b === void 0 ? void 0 : _b.region) || 0,
	        },
	    });
	});
	HandshakeReconnectingState.on(unsubscribeAll.type, (_) => UnsubscribedState.with(undefined));

	const HandshakingState = new State('HANDSHAKING');
	HandshakingState.onEnter((context) => handshake(context.channels, context.groups));
	HandshakingState.onExit(() => handshake.cancel);
	HandshakingState.on(subscriptionChange.type, (context, event) => {
	    if (event.payload.channels.length === 0 && event.payload.groups.length === 0) {
	        return UnsubscribedState.with(undefined);
	    }
	    return HandshakingState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: context.cursor,
	    });
	});
	HandshakingState.on(handshakeSuccess.type, (context, event) => {
	    var _a, _b;
	    return ReceivingState.with({
	        channels: context.channels,
	        groups: context.groups,
	        cursor: {
	            timetoken: !!((_a = context === null || context === void 0 ? void 0 : context.cursor) === null || _a === void 0 ? void 0 : _a.timetoken) ? (_b = context === null || context === void 0 ? void 0 : context.cursor) === null || _b === void 0 ? void 0 : _b.timetoken : event.payload.timetoken,
	            region: event.payload.region,
	        },
	    }, [
	        emitStatus({
	            category: StatusCategory$1.PNConnectedCategory,
	        }),
	    ]);
	});
	HandshakingState.on(handshakeFailure.type, (context, event) => {
	    return HandshakeReconnectingState.with({
	        channels: context.channels,
	        groups: context.groups,
	        cursor: context.cursor,
	        attempts: 0,
	        reason: event.payload,
	    });
	});
	HandshakingState.on(disconnect.type, (context) => HandshakeStoppedState.with({
	    channels: context.channels,
	    groups: context.groups,
	    cursor: context.cursor,
	}));
	HandshakingState.on(restore.type, (context, event) => {
	    var _a;
	    return HandshakingState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: {
	            timetoken: event.payload.cursor.timetoken,
	            region: event.payload.cursor.region || ((_a = context === null || context === void 0 ? void 0 : context.cursor) === null || _a === void 0 ? void 0 : _a.region) || 0,
	        },
	    });
	});
	HandshakingState.on(unsubscribeAll.type, (_) => UnsubscribedState.with());

	const UnsubscribedState = new State('UNSUBSCRIBED');
	UnsubscribedState.on(subscriptionChange.type, (_, event) => HandshakingState.with({
	    channels: event.payload.channels,
	    groups: event.payload.groups,
	}));
	UnsubscribedState.on(restore.type, (_, event) => {
	    return HandshakingState.with({
	        channels: event.payload.channels,
	        groups: event.payload.groups,
	        cursor: event.payload.cursor,
	    });
	});

	// endregion
	// --------------------------------------------------------
	// -------------------- Fetch Messages --------------------
	// --------------------------------------------------------
	// region Fetch Messages
	/**
	 * PubNub-defined message type.
	 *
	 * Types of messages which can be retrieved with fetch messages REST API.
	 */
	var PubNubMessageType;
	(function (PubNubMessageType) {
	    /**
	     * Regular message.
	     */
	    PubNubMessageType[PubNubMessageType["Message"] = -1] = "Message";
	    /**
	     * File message.
	     */
	    PubNubMessageType[PubNubMessageType["Files"] = 4] = "Files";
	})(PubNubMessageType || (PubNubMessageType = {}));
	// endregion

	class ChannelMetadata {
	    constructor(id, eventEmitter, pubnub) {
	        this.id = id;
	        this.eventEmitter = eventEmitter;
	        this.pubnub = pubnub;
	    }
	    subscription(subscriptionOptions) {
	        throw new Error('Subscription error: subscription module disabled');
	    }
	}

	class ChannelGroup {
	    constructor(channelGroup, eventEmitter, pubnub) {
	        this.eventEmitter = eventEmitter;
	        this.pubnub = pubnub;
	        this.name = channelGroup;
	    }
	    subscription(subscriptionOptions) {
	        throw new Error('Subscription error: subscription event engine module disabled');
	    }
	}

	class UserMetadata {
	    constructor(id, eventEmitter, pubnub) {
	        this.id = id;
	        this.eventEmitter = eventEmitter;
	        this.pubnub = pubnub;
	    }
	    subscription(subscriptionOptions) {
	        throw new Error('Subscription error: subscription event engine module disabled');
	    }
	}

	class Channel {
	    constructor(channelName, eventEmitter, pubnub) {
	        this.eventEmitter = eventEmitter;
	        this.pubnub = pubnub;
	        this.name = channelName;
	    }
	    subscription(subscriptionOptions) {
	        throw new Error('Subscription error: subscription event engine module disabled');
	    }
	}

	/**
	 * Time REST API module.
	 */
	// endregion
	/**
	 * Get current PubNub high-precision time request.
	 *
	 * @internal
	 */
	class TimeRequest extends AbstractRequest {
	    constructor() {
	        super();
	    }
	    operation() {
	        return RequestOperation$1.PNTimeOperation;
	    }
	    parse(response) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const serviceResponse = this.deserializeResponse(response);
	            if (!serviceResponse)
	                throw new PubNubError('Service response error, check status for details', createValidationError('Unable to deserialize service response'));
	            return { timetoken: serviceResponse[0] };
	        });
	    }
	    get path() {
	        return '/time/0';
	    }
	}

	// endregion
	/**
	 * Platform-agnostic PubNub client core.
	 */
	class PubNubCore {
	    /**
	     * Construct notification payload which will trigger push notification.
	     *
	     * @param title - Title which will be shown on notification.
	     * @param body - Payload which will be sent as part of notification.
	     *
	     * @returns Pre-formatted message payload which will trigger push notification.
	     */
	    static notificationPayload(title, body) {
	        throw new Error('Notification Payload error: publish module disabled');
	    }
	    /**
	     * Generate unique identifier.
	     *
	     * @returns Unique identifier.
	     */
	    static generateUUID() {
	        return uuidGenerator.createUUID();
	    }
	    // endregion
	    constructor(configuration) {
	        this._configuration = configuration.configuration;
	        this.cryptography = configuration.cryptography;
	        this.tokenManager = configuration.tokenManager;
	        this.transport = configuration.transport;
	        this.crypto = configuration.crypto;
	        {
	            // Prepare for real-time events announcement.
	            this.listenerManager = new ListenerManager();
	            this.eventEmitter = new EventEmitter(this.listenerManager);
	            if (this._configuration.enableEventEngine) {
	                throw new Error('Event Engine error: subscription event engine module disabled');
	            }
	            else {
	                throw new Error('Subscription Manager error: subscription manager module disabled');
	            }
	        }
	    }
	    // --------------------------------------------------------
	    // -------------------- Configuration ----------------------
	    // --------------------------------------------------------
	    // region Configuration
	    /**
	     * PubNub client configuration.
	     *
	     * @returns Currently user PubNub client configuration.
	     */
	    get configuration() {
	        return this._configuration;
	    }
	    /**
	     * Current PubNub client configuration.
	     *
	     * @returns Currently user PubNub client configuration.
	     *
	     * @deprecated Use {@link configuration} getter instead.
	     */
	    get _config() {
	        return this.configuration;
	    }
	    /**
	     * REST API endpoint access authorization key.
	     *
	     * It is required to have `authorization key` with required permissions to access REST API
	     * endpoints when `PAM` enabled for user key set.
	     */
	    get authKey() {
	        var _a;
	        return (_a = this._configuration.authKey) !== null && _a !== void 0 ? _a : undefined;
	    }
	    /**
	     * REST API endpoint access authorization key.
	     *
	     * It is required to have `authorization key` with required permissions to access REST API
	     * endpoints when `PAM` enabled for user key set.
	     */
	    getAuthKey() {
	        return this.authKey;
	    }
	    /**
	     * Change REST API endpoint access authorization key.
	     *
	     * @param authKey - New authorization key which should be used with new requests.
	     */
	    setAuthKey(authKey) {
	        this._configuration.setAuthKey(authKey);
	    }
	    /**
	     * Get a PubNub client user identifier.
	     *
	     * @returns Current PubNub client user identifier.
	     */
	    get userId() {
	        return this._configuration.userId;
	    }
	    /**
	     * Change the current PubNub client user identifier.
	     *
	     * **Important:** Change won't affect ongoing REST API calls.
	     *
	     * @param value - New PubNub client user identifier.
	     *
	     * @throws Error empty user identifier has been provided.
	     */
	    set userId(value) {
	        if (!value || typeof value !== 'string' || value.trim().length === 0)
	            throw new Error('Missing or invalid userId parameter. Provide a valid string userId');
	        this._configuration.userId = value;
	    }
	    /**
	     * Get a PubNub client user identifier.
	     *
	     * @returns Current PubNub client user identifier.
	     */
	    getUserId() {
	        return this._configuration.userId;
	    }
	    /**
	     * Change the current PubNub client user identifier.
	     *
	     * **Important:** Change won't affect ongoing REST API calls.
	     *
	     * @param value - New PubNub client user identifier.
	     *
	     * @throws Error empty user identifier has been provided.
	     */
	    setUserId(value) {
	        if (!value || typeof value !== 'string' || value.trim().length === 0)
	            throw new Error('Missing or invalid userId parameter. Provide a valid string userId');
	        this._configuration.userId = value;
	    }
	    /**
	     * Real-time updates filtering expression.
	     *
	     * @returns Filtering expression.
	     */
	    get filterExpression() {
	        var _a;
	        return (_a = this._configuration.getFilterExpression()) !== null && _a !== void 0 ? _a : undefined;
	    }
	    /**
	     * Real-time updates filtering expression.
	     *
	     * @returns Filtering expression.
	     */
	    getFilterExpression() {
	        return this.filterExpression;
	    }
	    /**
	     * Update real-time updates filtering expression.
	     *
	     * @param expression - New expression which should be used or `undefined` to disable filtering.
	     */
	    set filterExpression(expression) {
	        this._configuration.setFilterExpression(expression);
	    }
	    /**
	     * Update real-time updates filtering expression.
	     *
	     * @param expression - New expression which should be used or `undefined` to disable filtering.
	     */
	    setFilterExpression(expression) {
	        this.filterExpression = expression;
	    }
	    /**
	     * Dta encryption / decryption key.
	     *
	     * @returns Currently used key for data encryption / decryption.
	     */
	    get cipherKey() {
	        return this._configuration.getCipherKey();
	    }
	    /**
	     * Change data encryption / decryption key.
	     *
	     * @param key - New key which should be used for data encryption / decryption.
	     */
	    set cipherKey(key) {
	        this._configuration.setCipherKey(key);
	    }
	    /**
	     * Change data encryption / decryption key.
	     *
	     * @param key - New key which should be used for data encryption / decryption.
	     */
	    setCipherKey(key) {
	        this.cipherKey = key;
	    }
	    /**
	     * Change heartbeat requests interval.
	     *
	     * @param interval - New presence request heartbeat intervals.
	     */
	    set heartbeatInterval(interval) {
	        this._configuration.setHeartbeatInterval(interval);
	    }
	    /**
	     * Change heartbeat requests interval.
	     *
	     * @param interval - New presence request heartbeat intervals.
	     */
	    setHeartbeatInterval(interval) {
	        this.heartbeatInterval = interval;
	    }
	    /**
	     * Get PubNub SDK version.
	     *
	     * @returns Current SDK version.
	     */
	    getVersion() {
	        return this._configuration.getVersion();
	    }
	    /**
	     * Add framework's prefix.
	     *
	     * @param name - Name of the framework which would want to add own data into `pnsdk` suffix.
	     * @param suffix - Suffix with information about framework.
	     */
	    _addPnsdkSuffix(name, suffix) {
	        this._configuration._addPnsdkSuffix(name, suffix);
	    }
	    // --------------------------------------------------------
	    // ---------------------- Deprecated ----------------------
	    // --------------------------------------------------------
	    // region Deprecated
	    /**
	     * Get a PubNub client user identifier.
	     *
	     * @returns Current PubNub client user identifier.
	     *
	     * @deprecated Use the {@link getUserId} or {@link userId} getter instead.
	     */
	    getUUID() {
	        return this.userId;
	    }
	    /**
	     * Change the current PubNub client user identifier.
	     *
	     * **Important:** Change won't affect ongoing REST API calls.
	     *
	     * @param value - New PubNub client user identifier.
	     *
	     * @throws Error empty user identifier has been provided.
	     *
	     * @deprecated Use the {@link PubNubCore#setUserId} or {@link PubNubCore#userId} setter instead.
	     */
	    setUUID(value) {
	        this.userId = value;
	    }
	    /**
	     * Custom data encryption method.
	     *
	     * @deprecated Instead use {@link cryptoModule} for data encryption.
	     */
	    get customEncrypt() {
	        return this._configuration.getCustomEncrypt();
	    }
	    /**
	     * Custom data decryption method.
	     *
	     * @deprecated Instead use {@link cryptoModule} for data decryption.
	     */
	    get customDecrypt() {
	        return this._configuration.getCustomDecrypt();
	    }
	    // endregion
	    // endregion
	    // --------------------------------------------------------
	    // ---------------------- Entities ------------------------
	    // --------------------------------------------------------
	    // region Entities
	    /**
	     * Create a `Channel` entity.
	     *
	     * Entity can be used for the interaction with the following API:
	     * - `subscribe`
	     *
	     * @param name - Unique channel name.
	     * @returns `Channel` entity.
	     */
	    channel(name) {
	        return new Channel(name, this.eventEmitter, this);
	    }
	    /**
	     * Create a `ChannelGroup` entity.
	     *
	     * Entity can be used for the interaction with the following API:
	     * - `subscribe`
	     *
	     * @param name - Unique channel group name.
	     * @returns `ChannelGroup` entity.
	     */
	    channelGroup(name) {
	        return new ChannelGroup(name, this.eventEmitter, this);
	    }
	    /**
	     * Create a `ChannelMetadata` entity.
	     *
	     * Entity can be used for the interaction with the following API:
	     * - `subscribe`
	     *
	     * @param id - Unique channel metadata object identifier.
	     * @returns `ChannelMetadata` entity.
	     */
	    channelMetadata(id) {
	        return new ChannelMetadata(id, this.eventEmitter, this);
	    }
	    /**
	     * Create a `UserMetadata` entity.
	     *
	     * Entity can be used for the interaction with the following API:
	     * - `subscribe`
	     *
	     * @param id - Unique user metadata object identifier.
	     * @returns `UserMetadata` entity.
	     */
	    userMetadata(id) {
	        return new UserMetadata(id, this.eventEmitter, this);
	    }
	    /**
	     * Create subscriptions set object.
	     *
	     * @param parameters - Subscriptions set configuration parameters.
	     */
	    subscriptionSet(parameters) {
	        throw new Error('Subscription error: subscription event engine module disabled');
	    }
	    /**
	     * Schedule request execution.
	     *
	     * @param request - REST API request.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous request execution and response parsing result or `void` in case if
	     * `callback` provided.
	     *
	     * @throws PubNubError in case of request processing error.
	     */
	    sendRequest(request, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            // Validate user-input.
	            const validationResult = request.validate();
	            if (validationResult) {
	                if (callback)
	                    return callback(createValidationError(validationResult), null);
	                throw new PubNubError('Validation failed, check status for details', createValidationError(validationResult));
	            }
	            // Complete request configuration.
	            const transportRequest = request.request();
	            if (transportRequest.formData && transportRequest.formData.length > 0) {
	                // Set 300 seconds file upload request delay.
	                transportRequest.timeout = 300;
	            }
	            else {
	                if (request.operation() === RequestOperation$1.PNSubscribeOperation)
	                    transportRequest.timeout = this._configuration.getSubscribeTimeout();
	                else
	                    transportRequest.timeout = this._configuration.getTransactionTimeout();
	            }
	            // API request processing status.
	            const status = {
	                error: false,
	                operation: request.operation(),
	                category: StatusCategory$1.PNAcknowledgmentCategory,
	                statusCode: 0,
	            };
	            const [sendableRequest, cancellationController] = this.transport.makeSendable(transportRequest);
	            /**
	             * **Important:** Because of multiple environments where JS SDK can be used control over
	             * cancellation had to be inverted to let transport provider solve request cancellation task
	             * more efficiently. As result, cancellation controller can be retrieved and used only after
	             * request will be scheduled by transport provider.
	             */
	            request.cancellationController = cancellationController ? cancellationController : null;
	            return sendableRequest
	                .then((response) => {
	                status.statusCode = response.status;
	                // Handle special case when request completed but not fully processed by PubNub service.
	                if (response.status !== 200 && response.status !== 204) {
	                    const contentType = response.headers['content-type'];
	                    if (contentType || contentType.indexOf('javascript') !== -1 || contentType.indexOf('json') !== -1) {
	                        const json = JSON.parse(PubNubCore.decoder.decode(response.body));
	                        if (typeof json === 'object' && 'error' in json && json.error && typeof json.error === 'object')
	                            status.errorData = json.error;
	                    }
	                }
	                return request.parse(response);
	            })
	                .then((parsed) => {
	                // Notify callback (if possible).
	                if (callback)
	                    return callback(status, parsed);
	                return parsed;
	            })
	                .catch((error) => {
	                const apiError = !(error instanceof PubNubAPIError) ? PubNubAPIError.create(error) : error;
	                // Notify callback (if possible).
	                if (callback)
	                    return callback(apiError.toStatus(request.operation()), null);
	                throw apiError.toPubNubError(request.operation(), 'REST API request processing error, check status for details');
	            });
	        });
	    }
	    /**
	     * Unsubscribe from all channels and groups.
	     *
	     * @param [isOffline] - Whether `offline` presence should be notified or not.
	     */
	    destroy(isOffline) {
	        {
	            if (this.subscriptionManager) {
	                this.subscriptionManager.unsubscribeAll(isOffline);
	                this.subscriptionManager.disconnect();
	            }
	            else if (this.eventEngine)
	                this.eventEngine.dispose();
	        }
	    }
	    /**
	     * Unsubscribe from all channels and groups.
	     *
	     * @deprecated Use {@link destroy} method instead.
	     */
	    stop() {
	        this.destroy();
	    }
	    // endregion
	    // --------------------------------------------------------
	    // ----------------------- Listener -----------------------
	    // --------------------------------------------------------
	    // region Listener
	    /**
	     * Register real-time events listener.
	     *
	     * @param listener - Listener with event callbacks to handle different types of events.
	     */
	    addListener(listener) {
	        this.listenerManager.addListener(listener);
	    }
	    /**
	     * Remove real-time event listener.
	     *
	     * @param listener - Event listeners which should be removed.
	     */
	    removeListener(listener) {
	        this.listenerManager.removeListener(listener);
	    }
	    /**
	     * Clear all real-time event listeners.
	     */
	    removeAllListeners() {
	        this.listenerManager.removeAllListeners();
	    }
	    /**
	     * Publish data to a specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous publish data response or `void` in case if `callback` provided.
	     */
	    publish(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Publish error: publish module disabled');
	        });
	    }
	    /**
	     * Signal data to a specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous signal data response or `void` in case if `callback` provided.
	     */
	    signal(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Publish error: publish module disabled');
	        });
	    }
	    /**
	     * `Fire` a data to a specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous signal data response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link publish} method instead.
	     */
	    fire(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            callback !== null && callback !== void 0 ? callback : (callback = () => { });
	            return this.publish(Object.assign(Object.assign({}, parameters), { replicate: false, storeInHistory: false }), callback);
	        });
	    }
	    // endregion
	    // --------------------------------------------------------
	    // -------------------- Subscribe API ---------------------
	    // --------------------------------------------------------
	    // region Subscribe API
	    /**
	     * Get list of channels on which PubNub client currently subscribed.
	     *
	     * @returns List of active channels.
	     */
	    getSubscribedChannels() {
	        {
	            if (this.subscriptionManager)
	                return this.subscriptionManager.subscribedChannels;
	            else if (this.eventEngine)
	                return this.eventEngine.getSubscribedChannels();
	        }
	        return [];
	    }
	    /**
	     * Get list of channel groups on which PubNub client currently subscribed.
	     *
	     * @returns List of active channel groups.
	     */
	    getSubscribedChannelGroups() {
	        {
	            if (this.subscriptionManager)
	                return this.subscriptionManager.subscribedChannelGroups;
	            else if (this.eventEngine)
	                return this.eventEngine.getSubscribedChannelGroups();
	        }
	        return [];
	    }
	    /**
	     * Subscribe to specified channels and groups real-time events.
	     *
	     * @param parameters - Request configuration parameters.
	     */
	    subscribe(parameters) {
	        {
	            if (this.subscriptionManager)
	                this.subscriptionManager.subscribe(parameters);
	            else if (this.eventEngine)
	                this.eventEngine.subscribe(parameters);
	        }
	    }
	    /**
	     * Perform subscribe request.
	     *
	     * **Note:** Method passed into managers to let them use it when required.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param callback - Request completion handler callback.
	     */
	    makeSubscribe(parameters, callback) {
	        throw new Error('Subscription error: subscription manager module disabled');
	    }
	    /**
	     * Unsubscribe from specified channels and groups real-time events.
	     *
	     * @param parameters - Request configuration parameters.
	     */
	    unsubscribe(parameters) {
	        {
	            if (this.subscriptionManager)
	                this.subscriptionManager.unsubscribe(parameters);
	            else if (this.eventEngine)
	                this.eventEngine.unsubscribe(parameters);
	        }
	    }
	    /**
	     * Perform unsubscribe request.
	     *
	     * **Note:** Method passed into managers to let them use it when required.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param callback - Request completion handler callback.
	     */
	    makeUnsubscribe(parameters, callback) {
	        throw new Error('Unsubscription error: presence module disabled');
	    }
	    /**
	     * Unsubscribe from all channels and groups.
	     */
	    unsubscribeAll() {
	        {
	            if (this.subscriptionManager)
	                this.subscriptionManager.unsubscribeAll();
	            else if (this.eventEngine)
	                this.eventEngine.unsubscribeAll();
	        }
	    }
	    /**
	     * Temporarily disconnect from real-time events stream.
	     */
	    disconnect() {
	        {
	            if (this.subscriptionManager)
	                this.subscriptionManager.disconnect();
	            else if (this.eventEngine)
	                this.eventEngine.disconnect();
	        }
	    }
	    /**
	     * Restore connection to the real-time events stream.
	     *
	     * @param parameters - Reconnection catch up configuration. **Note:** available only with
	     * enabled event engine.
	     */
	    reconnect(parameters) {
	        {
	            if (this.subscriptionManager)
	                this.subscriptionManager.reconnect();
	            else if (this.eventEngine)
	                this.eventEngine.reconnect(parameters !== null && parameters !== void 0 ? parameters : {});
	        }
	    }
	    /**
	     * Event engine handshake subscribe.
	     *
	     * @param parameters - Request configuration parameters.
	     */
	    subscribeHandshake(parameters) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Subscription error: subscription event engine module disabled');
	        });
	    }
	    /**
	     * Event engine receive messages subscribe.
	     *
	     * @param parameters - Request configuration parameters.
	     */
	    subscribeReceiveMessages(parameters) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Subscription error: subscription event engine module disabled');
	        });
	    }
	    /**
	     * Get reactions to a specific message.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get reactions response or `void` in case if `callback` provided.
	     */
	    getMessageActions(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Get Message Actions error: message reactions module disabled');
	        });
	    }
	    /**
	     * Add a reaction to a specific message.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous add a reaction response or `void` in case if `callback` provided.
	     */
	    addMessageAction(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Add Message Action error: message reactions module disabled');
	        });
	    }
	    /**
	     * Remove a reaction from a specific message.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous remove a reaction response or `void` in case if `callback` provided.
	     */
	    removeMessageAction(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Remove Message Action error: message reactions module disabled');
	        });
	    }
	    /**
	     * Fetch messages history for channels.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous fetch messages response or `void` in case if `callback` provided.
	     */
	    fetchMessages(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Fetch Messages History error: message persistence module disabled');
	        });
	    }
	    /**
	     * Delete messages from the channel history.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous delete messages response or `void` in case if `callback` provided.
	     *
	     * @deprecated
	     */
	    deleteMessages(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Delete Messages error: message persistence module disabled');
	        });
	    }
	    /**
	     * Count messages from the channels' history.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous count messages response or `void` in case if `callback` provided.
	     */
	    messageCounts(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Get Messages Count error: message persistence module disabled');
	        });
	    }
	    /**
	     * Fetch single channel history.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous fetch channel history response or `void` in case if `callback` provided.
	     *
	     * @deprecated
	     */
	    history(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Get Messages History error: message persistence module disabled');
	        });
	    }
	    /**
	     * Get channel's presence information.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get channel's presence response or `void` in case if `callback` provided.
	     */
	    hereNow(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Get Channel Here Now error: presence module disabled');
	        });
	    }
	    /**
	     * Get user's presence information.
	     *
	     * Get list of channels to which `uuid` currently subscribed.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get user's presence response or `void` in case if `callback` provided.
	     */
	    whereNow(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Get UUID Here Now error: presence module disabled');
	        });
	    }
	    /**
	     * Get associated user's data for channels and groups.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get user's data response or `void` in case if `callback` provided.
	     */
	    getState(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Get UUID State error: presence module disabled');
	        });
	    }
	    /**
	     * Set associated user's data for channels and groups.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous set user's data response or `void` in case if `callback` provided.
	     */
	    setState(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Set UUID State error: presence module disabled');
	        });
	    }
	    // endregion
	    // region Change presence state
	    /**
	     * Manual presence management.
	     *
	     * @param parameters - Desired presence state for provided list of channels and groups.
	     */
	    presence(parameters) {
	        throw new Error('Change UUID presence error: subscription manager module disabled');
	    }
	    // endregion
	    // region Heartbeat
	    /**
	     * Announce user presence
	     *
	     * @param parameters - Desired presence state for provided list of channels and groups.
	     * @param callback - Request completion handler callback.
	     */
	    heartbeat(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Announce UUID Presence error: presence module disabled');
	        });
	    }
	    // endregion
	    // region Join
	    /**
	     * Announce user `join` on specified list of channels and groups.
	     *
	     * @param parameters - List of channels and groups where `join` event should be sent.
	     */
	    join(parameters) {
	        throw new Error('Announce UUID Presence error: presence module disabled');
	    }
	    // endregion
	    // region Leave
	    /**
	     * Announce user `leave` on specified list of channels and groups.
	     *
	     * @param parameters - List of channels and groups where `leave` event should be sent.
	     */
	    leave(parameters) {
	        throw new Error('Announce UUID Leave error: presence module disabled');
	    }
	    /**
	     * Announce user `leave` on all subscribed channels.
	     */
	    leaveAll() {
	        throw new Error('Announce UUID Leave error: presence module disabled');
	    }
	    /**
	     * Grant token permission.
	     *
	     * Generate access token with requested permissions.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous grant token response or `void` in case if `callback` provided.
	     */
	    grantToken(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Grant Token error: PAM module disabled');
	        });
	    }
	    /**
	     * Revoke token permission.
	     *
	     * @param token - Access token for which permissions should be revoked.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous revoke token response or `void` in case if `callback` provided.
	     */
	    revokeToken(token, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Revoke Token error: PAM module disabled');
	        });
	    }
	    // endregion
	    // region Token Manipulation
	    /**
	     * Get current access token.
	     *
	     * @returns Previously configured access token using {@link setToken} method.
	     */
	    get token() {
	        return this.tokenManager && this.tokenManager.getToken();
	    }
	    /**
	     * Get current access token.
	     *
	     * @returns Previously configured access token using {@link setToken} method.
	     */
	    getToken() {
	        return this.token;
	    }
	    /**
	     * Set current access token.
	     *
	     * @param token - New access token which should be used with next REST API endpoint calls.
	     */
	    set token(token) {
	        if (this.tokenManager)
	            this.tokenManager.setToken(token);
	    }
	    /**
	     * Set current access token.
	     *
	     * @param token - New access token which should be used with next REST API endpoint calls.
	     */
	    setToken(token) {
	        this.token = token;
	    }
	    /**
	     * Parse access token.
	     *
	     * Parse token to see what permissions token owner has.
	     *
	     * @param token - Token which should be parsed.
	     *
	     * @returns Token's permissions information for the resources.
	     */
	    parseToken(token) {
	        return this.tokenManager && this.tokenManager.parseToken(token);
	    }
	    /**
	     * Grant auth key(s) permission.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous grant auth key(s) permissions or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link grantToken} and {@link setToken} methods instead.
	     */
	    grant(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Grant error: PAM module disabled');
	        });
	    }
	    /**
	     * Audit auth key(s) permission.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @deprecated
	     *
	     * @deprecated Use {@link grantToken} and {@link setToken} methods instead.
	     */
	    audit(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Grant Permissions error: PAM module disabled');
	        });
	    }
	    // endregion
	    // endregion
	    // endregion
	    // --------------------------------------------------------
	    // ------------------- App Context API --------------------
	    // --------------------------------------------------------
	    // region App Context API
	    /**
	     * PubNub App Context API group.
	     */
	    get objects() {
	        return this._objects;
	    }
	    /**
	     Fetch a paginated list of User objects.
	     *
	     * @param [parametersOrCallback] - Request configuration parameters or callback from overload.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get all User objects response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.getAllUUIDMetadata} method instead.
	     */
	    fetchUsers(parametersOrCallback, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Fetch Users Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Fetch User object for currently configured PubNub client `uuid`.
	     *
	     * @param [parametersOrCallback] - Request configuration parameters or callback from overload.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get User object response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.getUUIDMetadata} method instead.
	     */
	    fetchUser(parametersOrCallback, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Fetch User Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Create User object.
	     *
	     * @param parameters - Request configuration parameters. Will create User object for currently
	     * configured PubNub client `uuid` if not set.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous create User object response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.setUUIDMetadata} method instead.
	     */
	    createUser(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Create User Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Update User object.
	     *
	     * @param parameters - Request configuration parameters. Will update User object for currently
	     * configured PubNub client `uuid` if not set.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous update User object response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.setUUIDMetadata} method instead.
	     */
	    updateUser(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Update User Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Remove a specific User object.
	     *
	     * @param [parametersOrCallback] - Request configuration parameters or callback from overload.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous User object remove response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.removeUUIDMetadata} method instead.
	     */
	    removeUser(parametersOrCallback, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Remove User Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Fetch a paginated list of Space objects.
	     *
	     * @param [parametersOrCallback] - Request configuration parameters or callback from overload.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get all Space objects response or `void` in case if `callback`
	     * provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.getAllChannelMetadata} method instead.
	     */
	    fetchSpaces(parametersOrCallback, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Fetch Spaces Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Fetch a specific Space object.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get Space object response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.getChannelMetadata} method instead.
	     */
	    fetchSpace(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Fetch Space Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Create specific Space object.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous create Space object response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.setChannelMetadata} method instead.
	     */
	    createSpace(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Create Space Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Update specific Space object.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous update Space object response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.setChannelMetadata} method instead.
	     */
	    updateSpace(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Update Space Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Remove a specific Space object.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous Space object remove response or `void` in case if `callback`
	     * provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.removeChannelMetadata} method instead.
	     */
	    removeSpace(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Remove Space Metadata error: App Context module disabled');
	        });
	    }
	    /**
	     * Fetch paginated list of specific Space members or specific User memberships.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get specific Space members or specific User memberships response or
	     * `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.getChannelMembers} or {@link PubNubCore#objects.getMemberships}
	     * methods instead.
	     */
	    fetchMemberships(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Fetch Memberships error: App Context module disabled');
	        });
	    }
	    /**
	     * Add members to specific Space or memberships specific User.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous add members to specific Space or memberships specific User response or
	     * `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.setChannelMembers} or {@link PubNubCore#objects.setMemberships}
	     * methods instead.
	     */
	    addMemberships(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Add Memberships error: App Context module disabled');
	        });
	    }
	    /**
	     * Update specific Space members or User memberships.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous update Space members or User memberships response or `void` in case
	     * if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.setChannelMembers} or {@link PubNubCore#objects.setMemberships}
	     * methods instead.
	     */
	    updateMemberships(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Update Memberships error: App Context module disabled');
	        });
	    }
	    /**
	     * Remove User membership.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous memberships modification response or `void` in case if `callback` provided.
	     *
	     * @deprecated Use {@link PubNubCore#objects.removeMemberships} or {@link PubNubCore#objects.removeChannelMembers}
	     * methods instead
	     * from `objects` API group..
	     */
	    removeMemberships(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Remove Memberships error: App Context module disabled');
	        });
	    }
	    // endregion
	    // endregion
	    // --------------------------------------------------------
	    // ----------------- Channel Groups API -------------------
	    // --------------------------------------------------------
	    // region Channel Groups API
	    /**
	     * PubNub Channel Groups API group.
	     */
	    get channelGroups() {
	        return this._channelGroups;
	    }
	    // endregion
	    // --------------------------------------------------------
	    // ---------------- Push Notifications API -----------------
	    // --------------------------------------------------------
	    // region Push Notifications API
	    /**
	     * PubNub Push Notifications API group.
	     */
	    get push() {
	        return this._push;
	    }
	    /**
	     * Share file to a specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous file sharing response or `void` in case if `callback` provided.
	     */
	    sendFile(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Send File error: file sharing module disabled');
	        });
	    }
	    /**
	     * Publish file message to a specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous publish file message response or `void` in case if `callback` provided.
	     */
	    publishFile(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Publish File error: file sharing module disabled');
	        });
	    }
	    /**
	     * Retrieve list of shared files in specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous shared files list response or `void` in case if `callback` provided.
	     */
	    listFiles(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('List Files error: file sharing module disabled');
	        });
	    }
	    // endregion
	    // region Get Download Url
	    /**
	     * Get file download Url.
	     *
	     * @param parameters - Request configuration parameters.
	     *
	     * @returns File download Url.
	     */
	    getFileUrl(parameters) {
	        throw new Error('Generate File Download Url error: file sharing module disabled');
	    }
	    /**
	     * Download shared file from specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous download shared file response or `void` in case if `callback` provided.
	     */
	    downloadFile(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Download File error: file sharing module disabled');
	        });
	    }
	    /**
	     * Delete shared file from specific channel.
	     *
	     * @param parameters - Request configuration parameters.
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous delete shared file response or `void` in case if `callback` provided.
	     */
	    deleteFile(parameters, callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            throw new Error('Delete File error: file sharing module disabled');
	        });
	    }
	    /**
	     Get current high-precision timetoken.
	     *
	     * @param [callback] - Request completion handler callback.
	     *
	     * @returns Asynchronous get current timetoken response or `void` in case if `callback` provided.
	     */
	    time(callback) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const request = new TimeRequest();
	            if (callback)
	                return this.sendRequest(request, callback);
	            return this.sendRequest(request);
	        });
	    }
	    // endregion
	    // --------------------------------------------------------
	    // ------------------ Cryptography API --------------------
	    // --------------------------------------------------------
	    // region Cryptography
	    // region Common
	    /**
	     * Encrypt data.
	     *
	     * @param data - Stringified data which should be encrypted using `CryptoModule`.
	     * @deprecated
	     * @param [customCipherKey] - Cipher key which should be used to encrypt data. **Deprecated:**
	     * use {@link Configuration#cryptoModule|cryptoModule} instead.
	     *
	     * @returns Data encryption result as a string.
	     */
	    encrypt(data, customCipherKey) {
	        const cryptoModule = this._configuration.getCryptoModule();
	        if (!customCipherKey && cryptoModule && typeof data === 'string') {
	            const encrypted = cryptoModule.encrypt(data);
	            return typeof encrypted === 'string' ? encrypted : encode(encrypted);
	        }
	        if (!this.crypto)
	            throw new Error('Encryption error: cypher key not set');
	        throw new Error('Encryption error: crypto module disabled');
	    }
	    /**
	     * Decrypt data.
	     *
	     * @param data - Stringified data which should be encrypted using `CryptoModule`.
	     * @param [customCipherKey] - Cipher key which should be used to decrypt data. **Deprecated:**
	     * use {@link Configuration#cryptoModule|cryptoModule} instead.
	     *
	     * @returns Data decryption result as an object.
	     */
	    decrypt(data, customCipherKey) {
	        const cryptoModule = this._configuration.getCryptoModule();
	        if (!customCipherKey && cryptoModule) {
	            const decrypted = cryptoModule.decrypt(data);
	            return decrypted instanceof ArrayBuffer ? JSON.parse(new TextDecoder().decode(decrypted)) : decrypted;
	        }
	        if (!this.crypto)
	            throw new Error('Decryption error: cypher key not set');
	        throw new Error('Decryption error: crypto module disabled');
	    }
	    /**
	     * Encrypt file content.
	     *
	     * @param keyOrFile - Cipher key which should be used to encrypt data or file which should be
	     * encrypted using `CryptoModule`.
	     * @param [file] - File which should be encrypted using legacy cryptography.
	     *
	     * @returns Asynchronous file encryption result.
	     *
	     * @throws Error if source file not provided.
	     * @throws File constructor not provided.
	     * @throws Crypto module is missing (if non-legacy flow used).
	     */
	    encryptFile(keyOrFile, file) {
	        return __awaiter(this, void 0, void 0, function* () {
	            if (typeof keyOrFile !== 'string')
	                file = keyOrFile;
	            if (!file)
	                throw new Error('File encryption error. Source file is missing.');
	            if (!this._configuration.PubNubFile)
	                throw new Error('File encryption error. File constructor not configured.');
	            if (typeof keyOrFile !== 'string' && !this._configuration.getCryptoModule())
	                throw new Error('File encryption error. Crypto module not configured.');
	            if (typeof keyOrFile === 'string') {
	                if (!this.cryptography)
	                    throw new Error('File encryption error. File encryption not available');
	                throw new Error('Encryption error: file sharing module disabled');
	            }
	            throw new Error('Encryption error: file sharing module disabled');
	        });
	    }
	    /**
	     * Decrypt file content.
	     *
	     * @param keyOrFile - Cipher key which should be used to decrypt data or file which should be
	     * decrypted using `CryptoModule`.
	     * @param [file] - File which should be decrypted using legacy cryptography.
	     *
	     * @returns Asynchronous file decryption result.
	     *
	     * @throws Error if source file not provided.
	     * @throws File constructor not provided.
	     * @throws Crypto module is missing (if non-legacy flow used).
	     */
	    decryptFile(keyOrFile, file) {
	        return __awaiter(this, void 0, void 0, function* () {
	            if (typeof keyOrFile !== 'string')
	                file = keyOrFile;
	            if (!file)
	                throw new Error('File encryption error. Source file is missing.');
	            if (!this._configuration.PubNubFile)
	                throw new Error('File decryption error. File constructor' + ' not configured.');
	            if (typeof keyOrFile === 'string' && !this._configuration.getCryptoModule())
	                throw new Error('File decryption error. Crypto module not configured.');
	            if (typeof keyOrFile === 'string') {
	                if (!this.cryptography)
	                    throw new Error('File decryption error. File decryption not available');
	                throw new Error('Decryption error: file sharing module disabled');
	            }
	            throw new Error('Decryption error: file sharing module disabled');
	        });
	    }
	}
	/**
	 * {@link ArrayBuffer} to {@link string} decoder.
	 *
	 * @internal
	 */
	PubNubCore.decoder = new TextDecoder();
	// --------------------------------------------------------
	// ----------------------- Static -------------------------
	// --------------------------------------------------------
	// region Static
	/**
	 * Type of REST API endpoint which reported status.
	 */
	PubNubCore.OPERATIONS = RequestOperation$1;
	/**
	 * API call status category.
	 */
	PubNubCore.CATEGORIES = StatusCategory$1;
	/**
	 * Exponential retry policy constructor.
	 */
	PubNubCore.ExponentialRetryPolicy = RetryPolicy.ExponentialRetryPolicy;
	/**
	 * Linear retry policy constructor.
	 */
	PubNubCore.LinearRetryPolicy = RetryPolicy.LinearRetryPolicy;

	/* eslint no-bitwise: ["error", { "allow": ["~", "&", ">>"] }] */
	/* global navigator */
	/**
	 * PubNub client for browser platform.
	 */
	class PubNub extends PubNubCore {
	    constructor(configuration) {
	        var _a;
	        const configurationCopy = setDefaults(configuration);
	        const platformConfiguration = Object.assign(Object.assign({}, configurationCopy), { sdkFamily: 'Web' });
	        // Prepare full client configuration.
	        const clientConfiguration = makeConfiguration(platformConfiguration, (cryptoConfiguration) => {
	            if (!cryptoConfiguration.cipherKey)
	                return undefined;
	            return undefined;
	        });
	        // Prepare Token manager.
	        let tokenManager;
	        // Legacy crypto (legacy data encryption / decryption and request signature support).
	        let crypto;
	        let cryptography;
	        // Setup transport provider.
	        let transport = new WebReactNativeTransport(clientConfiguration.keepAlive, clientConfiguration.logVerbosity);
	        const transportMiddleware = new PubNubMiddleware({
	            clientConfiguration,
	            tokenManager,
	            transport,
	        });
	        super({
	            configuration: clientConfiguration,
	            transport: transportMiddleware,
	            cryptography,
	            tokenManager,
	            crypto,
	        });
	        if ((_a = configuration.listenToBrowserNetworkEvents) !== null && _a !== void 0 ? _a : true) {
	            window.addEventListener('offline', () => {
	                this.networkDownDetected();
	            });
	            window.addEventListener('online', () => {
	                this.networkUpDetected();
	            });
	        }
	    }
	    networkDownDetected() {
	        this.listenerManager.announceNetworkDown();
	        if (this._configuration.restore)
	            this.disconnect();
	        else
	            this.destroy(true);
	    }
	    networkUpDetected() {
	        this.listenerManager.announceNetworkUp();
	        this.reconnect();
	    }
	}
	/**
	 * Data encryption / decryption module constructor.
	 */
	// @ts-expect-error Allowed to simplify interface when module can be disabled.
	PubNub.CryptoModule = undefined;

	return PubNub;

}));
