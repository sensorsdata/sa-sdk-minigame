/**
* @fileoverview sensors analytic minigame sdk
* @author shengyonggen@sensorsdata.cn
*/

import mp_scene from './scene.js';
import defaultPara from './para.js';

var _ = {};

var sa = {};

sa.para = defaultPara;

var logger = typeof logger === 'object' ? logger : {};

logger.info = function () {
  if (sa.para.show_log) {
    return console.log.apply(console, arguments);
  }
};

sa.setPara = function(para){

    sa.para = _.extend2Lev(sa.para, para);

    GameGlobal[sa.para.name] = sa;

    var channel = [];
    if (_.isArray(sa.para.source_channel)) {
      var len = sa.para.source_channel.length;
      var reserve_channel = ' utm_source utm_medium utm_campaign utm_content utm_term sa_utm ';
      for (var c = 0; c < len; c++) {
        if (reserve_channel.indexOf(' ' + sa.para.source_channel[c] + ' ') === -1) {
          channel.push(sa.para.source_channel[c]);
        }
      }
    }
    sa.para.source_channel = channel;

    if (_.isObject(sa.para.register)) {
      _.extend(_.info.properties, sa.para.register);
    }

    // 初始化各种预定义参数
    if (!sa.para.openid_url) {
      sa.para.openid_url = sa.para.server_url.replace(/([^\/])\/(sa)(\.gif){0,1}/, '$1/mp_login');
    }

    if (typeof sa.para.send_timeout !== 'number') {
      sa.para.send_timeout = 1000;
    }

    var batch_send_default = {
      send_timeout: 6000,
      max_length: 6
    };
    // 如果是true，转换成对象
    if (sa.para.batch_send === true) {
      sa.para.batch_send = _.extend({}, batch_send_default);
      sa.para.use_client_time = true;
    }else if(typeof sa.para.batch_send === 'object'){
      sa.para.use_client_time = true;
      sa.para.batch_send = _.extend({}, batch_send_default, sa.para.batch_send);
    }

    if(!sa.para.server_url){
      logger.info('请使用 setPara() 方法设置 server_url 数据接收地址,详情可查看https://www.sensorsdata.cn/manual/mp_sdk_new.html#112-%E5%BC%95%E5%85%A5%E5%B9%B6%E9%85%8D%E7%BD%AE%E5%8F%82%E6%95%B0');
      return;
    }
};

sa.status = {};

// 工具函数

var ArrayProto = Array.prototype,
  FuncProto = Function.prototype,
  ObjProto = Object.prototype,
  slice = ArrayProto.slice,
  toString = ObjProto.toString,
  hasOwnProperty = ObjProto.hasOwnProperty,
  LIB_VERSION = 'mp_sdk_version',
  LIB_NAME = 'MiniGame';

var source_channel_standard = 'utm_source utm_medium utm_campaign utm_content utm_term';
var latest_source_channel = ['$latest_utm_source', '$latest_utm_medium', '$latest_utm_campaign', '$latest_utm_content', '$latest_utm_term', 'latest_sa_utm'];

sa.status.referrer = '直接打开';

var mpshow_time = null;

var share_depth = 0;
var share_distinct_id = '';

var is_first_launch = false;

sa.lib_version = LIB_VERSION;


(function () {
  var nativeBind = FuncProto.bind,
    nativeForEach = ArrayProto.forEach,
    nativeIndexOf = ArrayProto.indexOf,
    nativeIsArray = Array.isArray,
    breaker = {};

  var each = _.each = function (obj, iterator, context) {
    if (obj == null) {
      return false;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0,
        l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
          return false;
        }
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) {
            return false;
          }
        }
      }
    }
  };

  _.logger = logger;
  // 普通的extend，不能到二级
  _.extend = function (obj) {
    each(slice.call(arguments, 1), function (source) {
      for (var prop in source) {
        if (source[prop] !== void 0) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };
  // 允许二级的extend
  _.extend2Lev = function (obj) {
    each(slice.call(arguments, 1), function (source) {
      for (var prop in source) {
        if (source[prop] !==
          void 0) {
          if (_.isObject(source[prop]) && _.isObject(obj[prop])) {
            _.extend(obj[prop], source[prop]);
          } else {
            obj[prop] = source[prop];
          }
        }
      }
    });
    return obj;
  };
  // 如果已经有的属性不覆盖,如果没有的属性加进来
  _.coverExtend = function (obj) {
    each(slice.call(arguments, 1), function (source) {
      for (var prop in source) {
        if (source[prop] !==
          void 0 && obj[prop] ===
          void 0) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  _.isArray = nativeIsArray ||
    function (obj) {
      return toString.call(obj) === '[object Array]';
    };

  _.isFunction = function (f) {
    try {
      return /^\s*\bfunction\b/.test(f);
    } catch (x) {
      return false;
    }
  };

  _.isArguments = function (obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  _.toArray = function (iterable) {
    if (!iterable) {
      return [];
    }
    if (iterable.toArray) {
      return iterable.toArray();
    }
    if (_.isArray(iterable)) {
      return slice.call(iterable);
    }
    if (_.isArguments(iterable)) {
      return slice.call(iterable);
    }
    return _.values(iterable);
  };

  _.values = function (obj) {
    var results = [];
    if (obj == null) {
      return results;
    }
    each(obj, function (value) {
      results[results.length] = value;
    });
    return results;
  };

  _.include = function (obj, target) {
    var found = false;
    if (obj == null) {
      return found;
    }
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
      return obj.indexOf(target) != -1;
    }
    each(obj, function (value) {
      if (found || (found = (value === target))) {
        return breaker;
      }
    });
    return found;
  };

})();

_.isObject = function (obj) {
  if(obj === undefined || obj === null){
    return false;
  }else{
    return (toString.call(obj) == '[object Object]');
  }
};

_.isEmptyObject = function (obj) {
  if (_.isObject(obj)) {
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

_.isUndefined = function (obj) {
  return obj ===
    void 0;
};

_.isString = function (obj) {
  return toString.call(obj) == '[object String]';
};

_.isDate = function (obj) {
  return toString.call(obj) == '[object Date]';
};

_.isBoolean = function (obj) {
  return toString.call(obj) == '[object Boolean]';
};

_.isNumber = function (obj) {
  return (toString.call(obj) == '[object Number]' && /[\d\.]+/.test(String(obj)));
};

_.isJSONString = function (str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
// gbk等编码decode会异常
_.decodeURIComponent = function (val) {
  var result = '';
  try {
    result = decodeURIComponent(val);
  } catch (e) {
    result = val;
  };
  return result;
};

_.encodeDates = function (obj) {
  _.each(obj, function (v, k) {
    if (_.isDate(v)) {
      obj[k] = _.formatDate(v);
    } else if (_.isObject(v)) {
      obj[k] = _.encodeDates(v);
      // recurse
    }
  });
  return obj;
};

_.formatDate = function (d) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds());
};

// 把日期格式全部转化成日期字符串
_.searchObjDate = function (o) {
  if (_.isObject(o)) {
    _.each(o, function (a, b) {
      if (_.isObject(a)) {
        _.searchObjDate(o[b]);
      } else {
        if (_.isDate(a)) {
          o[b] = _.formatDate(a);
        }
      }
    });
  }
};
// 把字符串格式数据限制字符串长度
_.formatString = function (str) {
  if (str.length > sa.para.max_string_length) {
    logger.info('字符串长度超过限制，已经做截取--' + str);
    return str.slice(0, sa.para.max_string_length);
  } else {
    return str;
  }
};

// 把字符串格式数据限制字符串长度
_.searchObjString = function (o) {
  if (_.isObject(o)) {
    _.each(o, function (a, b) {
      if (_.isObject(a)) {
        _.searchObjString(o[b]);
      } else {
        if (_.isString(a)) {
          o[b] = _.formatString(a);
        }
      }
    });
  }
};

// 数组去重复
_.unique = function (ar) {
  var temp,
    n = [],
    o = {};
  for (var i = 0; i < ar.length; i++) {
    temp = ar[i];
    if (!(temp in o)) {
      o[temp] = true;
      n.push(temp);
    }
  }
  return n;
};

// 只能是sensors满足的数据格式
_.strip_sa_properties = function (p) {
  if (!_.isObject(p)) {
    return p;
  }
  _.each(p, function (v, k) {
    // 如果是数组，把值自动转换成string
    if (_.isArray(v)) {
      var temp = [];
      _.each(v, function (arrv) {
        if (_.isString(arrv)) {
          temp.push(arrv);
        } else {
          logger.info('您的数据-', v, '的数组里的值必须是字符串,已经将其删除');
        }
      });
      if (temp.length !== 0) {
        p[k] = temp;
      } else {
        delete p[k];
        logger.info('已经删除空的数组');
      }
    }
    // 只能是字符串，数字，日期,布尔，数组
    if (!(_.isString(v) || _.isNumber(v) || _.isDate(v) || _.isBoolean(v) || _.isArray(v))) {
      logger.info('您的数据-', v, '-格式不满足要求，我们已经将其删除');
      delete p[k];
    }
  });
  return p;
};

// 去掉undefined和null
_.strip_empty_properties = function (p) {
  var ret = {};
  _.each(p, function (v, k) {
    if (v != null) {
      ret[k] = v;
    }
  });
  return ret;
};

_.utf8Encode = function (string) {
  string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  var utftext = '',
    start,
    end;
  var stringl = 0,
    n;

  start = end = 0;
  stringl = string.length;

  for (n = 0; n < stringl; n++) {
    var c1 = string.charCodeAt(n);
    var enc = null;

    if (c1 < 128) {
      end++;
    } else if ((c1 > 127) && (c1 < 2048)) {
      enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
    } else {
      enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
    }
    if (enc !== null) {
      if (end > start) {
        utftext += string.substring(start, end);
      }
      utftext += enc;
      start = end = n + 1;
    }
  }

  if (end > start) {
    utftext += string.substring(start, string.length);
  }

  return utftext;
};

_.base64Encode = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var o1,
    o2,
    o3,
    h1,
    h2,
    h3,
    h4,
    bits,
    i = 0,
    ac = 0,
    enc = '',
    tmp_arr = [];
  if (!data) {
    return data;
  }
  data = _.utf8Encode(data);
  do {
    o1 = data.charCodeAt(i++);
    o2 = data.charCodeAt(i++);
    o3 = data.charCodeAt(i++);

    bits = o1 << 16 | o2 << 8 | o3;

    h1 = bits >> 18 & 0x3f;
    h2 = bits >> 12 & 0x3f;
    h3 = bits >> 6 & 0x3f;
    h4 = bits & 0x3f;
    tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  } while (i < data.length);

  enc = tmp_arr.join('');

  switch (data.length % 3) {
    case 1:
      enc = enc.slice(0, -2) + '==';
      break;
    case 2:
      enc = enc.slice(0, -1) + '=';
      break;
  }

  return enc;
};

// 发数据预存队列
sa.initialState = {
  queue: [],
  isComplete: false,
  systemIsComplete: false,
  storeIsComplete: false,
  checkIsComplete: function () {
    if (this.systemIsComplete && this.storeIsComplete) {
      this.isComplete = true;
      if (this.queue.length > 0) {
        _.each(this.queue, function (content) {
          sa[content[0]].apply(sa, slice.call(content[1]));
        });
        this.queue = [];
      }
    }
  }
};

// 业务工具方法

//获取自定义key的utm值
_.getCustomUtmFromQuery = function (query, utm_prefix, source_channel_prefix,sautm_prefix) {
  if (!_.isObject(query)) {
    return {};
  }
  var result = {};
  if (query['sa_utm']) {
    for (var i in query) {
      if (i === 'sa_utm') {
        result[sautm_prefix + i] = query[i];
        continue;
      }
      if (_.include(sa.para.source_channel, i)) {
        result[source_channel_prefix + i] = query[i];
      }
    }
  } else {
    for (var i in query) {
      if ((' ' + source_channel_standard + ' ').indexOf(' ' + i + ' ') !== -1) {
        result[utm_prefix + i] = query[i];
        continue;
      }
      if (_.include(sa.para.source_channel, i)) {
        result[source_channel_prefix + i] = query[i];
      }
    }
  }
  return result;
};

_.getObjFromQuery = function (str) {
  var query = str.split('?');
  var arr = [];
  var obj = {};
  if (query && query[1]) {
    _.each(query[1].split('&'), function (value) {
      var arr = value.split('=');
      if (arr[0] && arr[1]) {
        obj[arr[0]] = arr[1];
      }
    });
  } else {
    return {};
  }
  return obj;
};

_.setStorageSync = function (key, value) {
  var fn = function () {
    wx.setStorageSync(key, value);
  };
  try {
    fn();
  } catch (e) {
    logger.info('set Storage fail --', e);
    try{
      fn();
    }catch(e2){
      logger.info('set Storage fail again --', e2);
    }
  }
};

_.getStorageSync = function(key) {
  var store = '';
  try {
    store = wx.getStorageSync(key);
  } catch (e) {
    try{
      store = wx.getStorageSync(key);
    }catch(e2){
      logger.info('getStorage fail');
    }
  }
  return store;
};

_.getMPScene = function (key) {
  if (typeof key === "number" || (typeof key === "string" && key !== "")) {
    key = String(key);
    return mp_scene[key] || key;
  } else {
    return "未取到值";
  }
};


_.getShareDepth = function () {
  if (typeof share_depth === 'number' && share_depth !== 0) {
    var current_id = sa.store.getDistinctId();
    var current_first_id = sa.store.getFirstId();
    var latest_id = share_distinct_id;
    if (latest_id && (latest_id === current_id || latest_id === current_first_id)) {
      return share_depth;
    } else {
      return (share_depth + 1);
    }
  } else {
    return 1;
  }
};

_.setShareInfo = function (para, prop) {
  var share = {};
  if (para && _.isObject(para.query) && para.query.sampshare) {
    share = _.decodeURIComponent(para.query.sampshare);
    if (_.isJSONString(share)) {
      share = JSON.parse(share);
    } else {
      return {};
    }
  } else {
    return {};
  }
  var depth = share.d;
  var id = share.i;
  if (typeof id === 'string') {
    prop.$share_distinct_id = id;
    share_distinct_id = id;
  } else {
    prop.$share_distinct_id = '取值异常';
  }
  if (typeof depth === 'number') {
    prop.$share_depth = depth;
    share_depth = depth;
  } else {
    prop.$share_depth = '-1';
  }
};

_.getShareInfo = function () {
  return JSON.stringify({
    i: sa.store.getDistinctId() || '取值异常',
    d: _.getShareDepth()
  });
};

// 筛选检测出para里的query，q，scene
_.detectOptionQuery = function(para){
  if (!para || !_.isObject(para.query)) {
    return {};
  }
  var result = {};
  // path的query
  result.query = _.extend({}, para.query);
  //如果query有scene，认为scene是b接口传过来的
  if (typeof result.query.scene === 'string' && isBScene(result.query)){
    result.scene = result.query.scene;
    delete result.query.scene;
  }
  //如果query有q
  if (para.query.q && para.query.scancode_time && String(para.scene).slice(0,3) === '101'){
    result.q = String(result.query.q);
    delete result.query.q;
    delete result.query.scancode_time;
  }
  function isBScene(obj) {
    var source = ['utm_source', 'utm_content', 'utm_medium', 'utm_campaign', 'utm_term', 'sa_utm'];
    var source_keyword = source.concat(sa.para.source_channel);
    var reg = new RegExp('(' + source_keyword.join('|') + ')%3D', 'i');
    var keys = Object.keys(obj);
    if(keys.length === 1 && keys[0] === 'scene' && reg.test(obj.scene)) {
      return true;
    } else {
      return false;
    }
  }

  return result;
};

// 从query,q,scene三个参数中，解析得到一个整合的query对象
_.getMixedQuery = function(para){
  var obj = _.detectOptionQuery(para);
  var scene = obj.scene;
  var q = obj.q;
// query
  var query = obj.query;
  for(var i in query) {
    query[i] = _.decodeURIComponent(query[i]);
  }
// scene
  if (scene) {
    scene = _.decodeURIComponent(scene);
    if (scene.indexOf("?") !== -1) {
      scene = '?' + scene.replace(/\?/g, '');
    } else {
      scene = '?' + scene;
    }
    _.extend(query, _.getObjFromQuery(scene));
  }

// 普通二维码的q
  if (q) {
    _.extend(query, _.getObjFromQuery(_.decodeURIComponent(q)));
  }


  return query;
};

// 解析参数中的utm，并添加
_.setUtm = function (para, prop) {
  var utms = {};
  var query = _.getMixedQuery(para);
  var pre1 = _.getCustomUtmFromQuery(query, '$', '_', '$');
  var pre2 = _.getCustomUtmFromQuery(query, '$latest_','_latest_', '$latest_');
  utms.pre1 = pre1;
  utms.pre2 = pre2;
  _.extend(prop, pre1);
  return utms;
};

_.wxrequest = function(obj){
  var rq = wx.request(obj);
  setTimeout(function(){
    if(_.isObject(rq) && _.isFunction(rq.abort)){
     rq.abort();
    }
  },sa.para.datasend_timeout);
};


_.info = {
  currentProps:{},
  properties: {
    $lib: LIB_NAME,
    $lib_version: String(LIB_VERSION)
  },
  getSystem: function () {
    var e = this.properties;
    var that = this;

    function getNetwork() {
      wx.getNetworkType({
        "success": function (t) {
          e.$network_type = t["networkType"]
        },
        "complete": getSystemInfo
      })
    }

    function formatSystem(system) {
      var _system = system.toLowerCase();
      if (_system === 'ios') {
        return 'iOS';
      } else if (_system === 'android') {
        return  'Android';
      } else {
        return system;
      }
    }

    function getSystemInfo() {
      wx.getSystemInfo({
        "success": function (t) {
          e.$manufacturer = t["brand"];
          e.$model = t["model"];
          e.$screen_width = Number(t["screenWidth"]);
          e.$screen_height = Number(t["screenHeight"]);
          e.$os = formatSystem(t["platform"]);
          e.$os_version = t["system"].indexOf(' ') > -1 ? t["system"].split(' ')[1] : t["system"];
        },
        "complete": function () {
          sa.initialState.systemIsComplete = true;
          sa.initialState.checkIsComplete();
        }
      })
    }

    getNetwork();
  }
};

sa._ = _;

sa.prepareData = function (p, callback) {

  var data = {
    distinct_id: this.store.getDistinctId(),
    lib: {
      $lib: LIB_NAME,
      $lib_method: 'code',
      $lib_version: String(LIB_VERSION)
    },
    properties: {}
  };

  _.extend(data, p);

  // 合并properties里的属性
  if (_.isObject(p.properties) && !_.isEmptyObject(p.properties)) {
    _.extend(data.properties, p.properties);
  }

  // profile时不传公用属性
  if (!p.type || p.type.slice(0, 7) !== 'profile') {
    if (sa.para.batch_send) {
      data._track_id = Number(String(Math.random()).slice(2, 5) + String(Math.random()).slice(2, 4) + String(Date.now()).slice(-4));
    }
    // 传入的属性 > 当前页面的属性 > session的属性 > cookie的属性 > 预定义属性
    data.properties = _.extend({}, _.info.properties, sa.store.getProps(), _.info.currentProps, data.properties);

    // 判断是否是首日访问，果子说要做
    if (typeof sa.store._state === 'object' && typeof sa.store._state.first_visit_day_time === 'number' && sa.store._state.first_visit_day_time > (new Date()).getTime()) {
      data.properties.$is_first_day = true;
    } else {
      data.properties.$is_first_day = false;
    }
  }
  // 如果$time是传入的就用，否则使用服务端时间
  if (data.properties.$time && _.isDate(data.properties.$time)) {
    data.time = data.properties.$time * 1;
    delete data.properties.$time;
  } else {
    if (sa.para.use_client_time) {
      data.time = (new Date()) * 1;
    }
  }

  _.searchObjDate(data);
  _.searchObjString(data);

  logger.info(data);

  sa.sendStrategy.send(data);
};

sa.store = {
  verifyDistinctId: function (id) {
    if (typeof id === 'number') {
      id = String(id);
      if (!/^\d+$/.test(id)) {
        id = 'unexpected_id';
      }
    }
    if (typeof id !== 'string' || id === '') {
      id = 'unexpected_id';
    }
    return id;
  },
  // 防止重复请求
  storageInfo: null,
  getUUID: function () {
    return "" + Date.now() + '-' + Math.floor(1e7 * Math.random()) + '-' + Math.random().toString(16).replace('.', '') + '-' + String(Math.random() * 31242).replace('.', '').slice(0, 8);

  },
  getStorage: function () {
    if (this.storageInfo) {
      return this.storageInfo;
    } else {
      this.storageInfo = sa._.getStorageSync("sensorsdata2015_wechat") || '';
      return this.storageInfo;
    }
  },
  _state: {},
  // 未存储到storage中的内存数据
  mem: {
    mdata: [],
    getLength: function(){
      return this.mdata.length;
    },
    add: function (data) {
      this.mdata.push(data);
    },
    clear: function (len) {
      this.mdata.splice(0, len);
    }
  },
  toState: function (ds) {
    var state = null;
    if (_.isJSONString(ds)) {
      state = JSON.parse(ds);
      if (state.distinct_id) {
        this._state = state;
      } else {
        this.set('distinct_id', this.getUUID());
      }
    } else if (_.isObject(ds)) {
      state = ds;
      if (state.distinct_id) {
        this._state = state;
      } else {
        this.set('distinct_id', this.getUUID());
      }
    } else {
      this.set('distinct_id', this.getUUID());
    }
  },
  getFirstId: function () {
    // 优先使用临时的 _first_id 属性 (使用.change()方法设置的)
    return this._state._first_id || this._state.first_id;
  },
  getDistinctId: function () {
    // 优先使用临时的 _distinct_id 属性 (使用.change()方法设置的)
    return this._state._distinct_id || this._state.distinct_id;
  },
  getProps: function () {
    return this._state.props || {};
  },
  setProps: function (newp, isCover) {
    var props = this._state.props || {};
    if (!isCover) {
      _.extend(props, newp);
      this.set('props', props);
    } else {
      this.set('props', newp);
    }
  },
  set: function (name, value) {
    var obj = {};
    if (typeof name === 'string') {
      obj[name] = value;
    } else if (typeof name === 'object') {
      obj = name;
    }
    this._state = this._state || {};
    for (var i in obj) {
      this._state[i] = obj[i];
      // 如果set('first_id') 或者 set('distinct_id')，删除对应的临时属性
      if (i === 'first_id') {
        delete this._state._first_id;
      } else if (i === 'distinct_id') {
        delete this._state._distinct_id;
      }
    }
    this.save();
  },
  change: function (name, value) {
    // 为临时属性名增加前缀 _ (下划线)
    this._state['_' + name] = value;
  },
  save: function () {
    // 深拷贝避免修改原对象
    var copyState = JSON.parse(JSON.stringify(this._state));
    // 删除临时属性避免写入微信 storage
    delete copyState._first_id;
    delete copyState._distinct_id;
    sa._.setStorageSync("sensorsdata2015_wechat", copyState);
  },
  init: function () {
    var info = this.getStorage();
    if (info) {
      this.toState(info);
    } else {
      is_first_launch = true;
      var time = (new Date());
      var visit_time = time.getTime();
      time.setHours(23);
      time.setMinutes(59);
      time.setSeconds(60);
      sa.setOnceProfile({$first_visit_time: new Date()});
      this.set({
        'distinct_id': this.getUUID(),
        'first_visit_time': visit_time,
        'first_visit_day_time': time.getTime()
      });
    }
  }
};

sa.setProfile = function (p, c) {
  sa.prepareData({
    type: 'profile_set',
    properties: p
  }, c);
};

sa.setOnceProfile = function (p, c) {
  sa.prepareData({
    type: 'profile_set_once',
    properties: p
  }, c);
};

sa.appendProfile = function(p, c) {
  if(!_.isObject(p)){
    return false;
  }
  _.each(p, function(value, key) {
    if (_.isString(value)) {
      p[key] = [value];
    } else if (_.isArray(value)) {

    } else {
      delete p[key];
      logger.info('appendProfile属性的值必须是字符串或者数组');
    }
  });
  sa.prepareData({
    type: 'profile_append',
    properties: p
  }, c);
};

sa.incrementProfile = function(p, c) {
  if(!_.isObject(p)){
    return false;
  }
  var str = p;
  if (_.isString(p)) {
    p = {}
    p[str] = 1;
  }
  sa.prepareData({
    type: 'profile_increment',
    properties: p
  }, c);
};

sa.track = function (e, p, c) {
  this.prepareData({
    type: 'track',
    event: e,
    properties: p
  }, c);
};

sa.identify = function (id, isSave) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    return false;
  }
  id = sa.store.verifyDistinctId(id);
  var firstId = sa.store.getFirstId();
  if (isSave === true) {
    if (firstId) {
      sa.store.set('first_id', id);
    } else {
      sa.store.set('distinct_id', id);
    }
  } else {
    if (firstId) {
      sa.store.change('first_id', id);
    } else {
      sa.store.change('distinct_id', id);
    }
  }
};

sa.trackSignup = function (id, e, p, c) {
  var original_id = sa.store.getFirstId() || sa.store.getDistinctId();
  sa.store.set('distinct_id', id);
  sa.prepareData({
    original_id: original_id,
    distinct_id: id,
    type: 'track_signup',
    event: e,
    properties: p
  }, c);
};


sa.registerApp = function (obj) {
  if (_.isObject(obj) && !_.isEmptyObject(obj)) {
    _.info.currentProps = _.extend(_.info.currentProps, obj);
  }
};

sa.register = function (obj) {
  if (_.isObject(obj) && !_.isEmptyObject(obj)) {
    sa.store.setProps(obj);
  }
};

sa.clearAllRegister = function () {
  sa.store.setProps({}, true);
};

sa.clearAllProps = function (arr) {
  var obj = sa.store.getProps();
  var props = {};
  if(_.isArray(arr)) {
    _.each(obj, function (value, key) {
      if (!_.include(arr, key)) {
        props[key] = value;
      }
    });
    sa.store.setProps(props, true);
  }
};

sa.clearAppRegister = function (arr) {
  if(_.isArray(arr)) {
    _.each(_.info.currentProps, function (value, key) {
      if (_.include(arr, key)) {
        delete _.info.currentProps[key];
      }
    });
  }
};

sa.setLatestChannel = function (channel) {
  if (!_.isEmptyObject(channel)) {
    if (includeChannel(channel, latest_source_channel)){
      sa.clearAppRegister(latest_source_channel);
      sa.clearAllProps(latest_source_channel);
    }
    sa.para.is_persistent_save ? sa.register(channel) : sa.registerApp(channel);
  }

  function includeChannel(channel, arr) {
    var found = false;
    for(var i in  arr) {
      if(channel[arr[i]]) {
        found = true;
      }
    }
    return found;
  }
}

sa.login = function (id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    return false;
  }
  id = sa.store.verifyDistinctId(id);
  var firstId = sa.store.getFirstId();
  var distinctId = sa.store.getDistinctId();
  if (id !== distinctId) {
    if (firstId) {
      sa.trackSignup(id, '$SignUp');
    } else {
      sa.store.set('first_id', distinctId);
      sa.trackSignup(id, '$SignUp');
    }
  }
};

// 获取openid，先从storage里获取，
sa.openid = {
  getRequest: function (callback) {
    wx.login({
      success: function (res) {
        if (res.code && sa.para.appid && sa.para.openid_url) {
          _.wxrequest({
            url: sa.para.openid_url + '&code=' + res.code + '&appid=' + sa.para.appid,
            method: 'GET',
            complete: function (res2) {
              if (_.isObject(res2) && _.isObject(res2.data) && res2.data.openid) {
                callback(res2.data.openid);
              } else {
                callback();
              }
            }
          });
        } else {
          callback();
        }
      }
    });
  },
  getWXStorage: function () {
    var storageInfo = sa.store.getStorage();
    if (storageInfo && _.isObject(storageInfo)) {
      return storageInfo.openid;
    }
  },
  getOpenid: function (callback) {
    if (!sa.para.appid) {
      callback();
      return false;
    }
    var storageId = this.getWXStorage();
    if (storageId) {
      callback(storageId);
    } else {
      this.getRequest(callback);
    }
  }
};

// 初始化 SDK 设备基本信息
sa.initial = function () {
  this._.info.getSystem();
  this.store.init();
};

// 初始化 SDK 数据发送
sa.init = function (obj) {
  if (this.hasInit === true) {
    return false;
  }
  this.hasInit = true;
  if (sa.para.batch_send) {
    sa.sendStrategy.batchInterval();
  }
  sa.initialState.storeIsComplete = true;
  sa.initialState.checkIsComplete();
};

sa.getPresetProperties = function () {
  if (_.info && _.info.properties && _.info.properties.$lib) {
    var builtinProps = {};
    _.each(_.info.currentProps, function(value, key) {
      if (key.indexOf('$') === 0) {
        builtinProps[key] = value;
      }
    });
    var obj = _.extend(builtinProps, _.info.properties, sa.store.getProps());
    delete obj.$lib;
    return obj;
  } else {
    return {};
  }
};

// 发送队列
_.autoExeQueue = function () {
  var queue = {
    // 简单队列
    items: [],
    enqueue: function (val) {
      this.items.push(val);
      this.start();
    },
    dequeue: function () {
      return this.items.shift();
    },
    getCurrentItem: function () {
      return this.items[0];
    },
    // 自动循环执行队列
    isRun: false,
    start: function () {
      if (this.items.length > 0 && !this.isRun) {
        this.isRun = true;
        this.getCurrentItem().start();
      }
    },
    close: function () {
      this.dequeue();
      this.isRun = false;
      this.start();
    }
  };
  return queue;
};

sa.requestQueue = function (para) {
  this.url = para.url;
};
sa.requestQueue.prototype.isEnd = function () {
  if (!this.received) {
    this.received = true;
    this.close();
  }
};
sa.requestQueue.prototype.start = function () {
  var me = this;
  setTimeout(function () {
    me.isEnd();
  }, sa.para.send_timeout);
  _.wxrequest({
    url: this.url,
    method: 'GET',
    complete: function () {
      me.isEnd();
    }
  });
};

sa.dataQueue = _.autoExeQueue();

sa.sendStrategy = {
  dataHasSend: true,
  dataHasChange: false,
  onAppHide: function(){
    if(sa.para.batch_send){
      this.batchSend();
    }
  },
  send: function (data) {
    if(!sa.para.server_url) {
      return false;
    }
    if (sa.para.batch_send) {
      this.dataHasChange = true;
      if(sa.store.mem.getLength() >= 300){
        logger.info('数据量存储过大，有异常');
        return false;
      }
      sa.store.mem.add(data);
      if(sa.store.mem.getLength() >= sa.para.batch_send.max_length){
        this.batchSend();
      }
    } else {
      this.queueSend(data);
    }
  },
  queueSend: function (url) {
    url = JSON.stringify(url);
    if (sa.para.server_url.indexOf('?') !== -1) {
      url = sa.para.server_url + '&data=' + encodeURIComponent(_.base64Encode(url));
    } else {
      url = sa.para.server_url + '?data=' + encodeURIComponent(_.base64Encode(url));
    }

    var instance = new sa.requestQueue({
      url: url
    });
    instance.close = function () {
      sa.dataQueue.close();
    };
    sa.dataQueue.enqueue(instance);
  },
  wxrequest: function (option) {
    if (_.isArray(option.data) && option.data.length > 0) {
      var now = Date.now();
      option.data.forEach(function (v) {
        v._flush_time = now;
      });
      option.data = JSON.stringify(option.data);
      _.wxrequest({
        url: sa.para.server_url,
        method: 'POST',
        dataType: 'text',
        data: 'data_list=' + encodeURIComponent(_.base64Encode(option.data)),
        success: function () {
          option.success(option.len);
        }
      });
    } else {
      option.success(option.len);
    }
  },
  batchSend: function () {
    if(this.dataHasSend){
      var data = sa.store.mem.mdata;
      var len = data.length;
      if (len > 0) {
        this.dataHasSend = false;
        this.wxrequest({
          data: data,
          len: len,
          success: this.batchRemove.bind(this)
        });
      }
    }
  },
  batchRemove: function (len) {
    sa.store.mem.clear(len);
    this.dataHasSend = true;
    this.dataHasChange = true;
    this.batchWrite();
  },
  is_first_batch_write: true,
  batchWrite: function () {
    var me = this;
    if (this.dataHasChange) {
      // 如果是首次写入数据，等待1s后，优先发送，优化那些来了就跑的人
      if(this.is_first_batch_write){
        this.is_first_batch_write = false;
        setTimeout(function(){
          me.batchSend();
        },1000);
      }

      this.dataHasChange = false;
      sa._.setStorageSync('sensors_mp_prepare_data', sa.store.mem.mdata);
    }
  },
  batchInterval: function () {
    var _this = this;
    // 每隔1秒，写入数据
    function loopWrite() {
      setTimeout(function () {
        _this.batchWrite();
        loopWrite();
      }, 500);
    }
    // 每隔6秒，发送数据
    function loopSend() {
      setTimeout(function () {
        _this.batchSend();
        loopSend();
      }, sa.para.batch_send.send_timeout);
    }
    loopWrite();
    loopSend();

  }

};

sa.setOpenid = function (openid, isCover) {
  sa.store.set('openid', openid);
  if (isCover) {
    sa.store.set('distinct_id', openid);
  } else {
    sa.identify(openid, true);
  }
};

sa.initWithOpenid = function (options, callback) {
  options = options || {};
  if(options.appid){
    sa.para.appid = options.appid;
  }
  sa.openid.getOpenid(function (openid) {
    if (openid) {
      sa.setOpenid(openid, options.isCoverLogin);
    }
    if (callback && _.isFunction(callback)) {
      callback(openid);
    }
    sa.init(options);
  });
};

// 对所有提供的方法做代理暂存
_.each(['login', 'setProfile', 'setOnceProfile', 'track', 'quick', 'incrementProfile', 'appendProfile'], function (method) {
  var temp = sa[method];
  sa[method] = function () {
    if (sa.initialState.isComplete) {
      temp.apply(sa, arguments);
    } else {
      sa.initialState.queue.push([method, arguments]);
    }
  };
});

// query 解析
_.setQuery = function (params, isEncode) {
  var url_query = '';
  if (params && _.isObject(params) && !_.isEmptyObject(params)) {
    var arr = [];
    _.each(params, function (value, key) {
      // 防止传统二维码的para.q这种异常query。另外异常的para.scene 不好判断，直接去掉。建议不要使用这个容易异意的参数
      if(!(key === 'q' && _.isString(value) && value.indexOf('http') === 0) && key !== 'scene')  {
        if(isEncode) {
          arr.push(key + '=' + value);
        }else {
          arr.push(key + '=' + _.decodeURIComponent(value));
        }
      }
    });
    return arr.join('&');
  } else {
    return url_query;
  }
};

sa.autoTrackCustom = {
  trackCustom: function (api, prop, event) {
    var temp = sa.para.autoTrack[api];
    var tempFunc = '';
    if (sa.para.autoTrack && temp) {
      if (typeof temp === 'function') {
        tempFunc = temp();
        if (_.isObject(tempFunc)) {
          _.extend(prop, tempFunc);
        }
      } else if (_.isObject(temp)) {
        _.extend(prop, temp);
        sa.para.autoTrack[api] = true;
      }
      sa.track(event, prop);
    }
  },
  appLaunch: function (para, not_use_auto_track) {
    // 注意：不要去修改 para

    if(typeof this === 'object' && !this['trackCustom']){
      this[sa.para.name] = sa;
    }

    var prop = {};
    // 设置分享的信息
    _.setShareInfo(para, prop);
    // 设置utm的信息
    var utms = _.setUtm(para, prop);
    if (is_first_launch) {
      prop.$is_first_time = true;
      if (!_.isEmptyObject(utms.pre1)) {
        sa.setOnceProfile(utms.pre1);
      }
    } else {
      prop.$is_first_time = false;
    }

    sa.setLatestChannel(utms.pre2);

    prop.$scene = _.getMPScene(para.scene);
    sa.registerApp({ $latest_scene: prop.$scene });

    prop.$url_query = _.setQuery(para.query);

    if (not_use_auto_track) {
      prop = _.extend(prop, not_use_auto_track);
      sa.track('$MPLaunch', prop);
    } else if (sa.para.autoTrack && sa.para.autoTrack.appLaunch) {
      sa.autoTrackCustom.trackCustom('appLaunch', prop, '$MPLaunch');
    }
    is_first_launch = false;
  },
  appShow: function (para, not_use_auto_track) {
    // 注意：不要去修改 para
    var prop = {};

    mpshow_time = (new Date()).getTime();
    // 设置分享的信息
    _.setShareInfo(para, prop);

    var utms = _.setUtm(para, prop);

    sa.setLatestChannel(utms.pre2);

    prop.$scene = _.getMPScene(para.scene);
    sa.registerApp({ $latest_scene: prop.$scene });

    prop.$url_query = _.setQuery(para.query);
    sa.autoTrackCustom.trackCustom('appShow', prop, '$MPShow');
  },
  appHide: function (not_use_auto_track) {
    var current_time = (new Date()).getTime();
    var prop = {};
    if (mpshow_time && (current_time - mpshow_time > 0) && ((current_time - mpshow_time) / 3600000 < 24)) {
      prop.event_duration = (current_time - mpshow_time) / 1000;
    }
    sa.autoTrackCustom.trackCustom('appHide', prop, '$MPHide');
        //在关闭前告诉批量发送
    sa.sendStrategy.onAppHide();
  }
};

sa.quick = function () {
  // 方法名
  var arg0 = arguments[0];
  // 传入的参数
  var arg1 = arguments[1];
  // 需要自定义的属性
  var arg2 = arguments[2];

  var prop = _.isObject(arg2) ? arg2 : {};
  if (arg0 === 'getAnonymousID') {
    if (_.isEmptyObject(sa.store._state)) {
      logger.info('请先初始化SDK');
    } else {
      // 优先使用临时属性
      return sa.store._state._first_id || sa.store._state.first_id || sa.store._state._distinct_id || sa.store._state.distinct_id;
    }
  } else if (arg0 === 'appLaunch' || arg0 === 'appShow') {
    if (arg1) {
      sa.autoTrackCustom[arg0](arg1, prop);
    } else {
      logger.info('App的launch和show，在sensors.quick第二个参数必须传入App的options参数');
    }
  } else if (arg0 === 'appHide') {
    prop = _.isObject(arg1) ? arg1 : {};
    sa.autoTrackCustom[arg0](prop);
  }
};

// 全局事件

const appLaunchFunc = (function() {
  var executed = false;
  return function() {
    if (!executed) {
      executed = true;
      if (sa.para.autoTrack && sa.para.autoTrack.appLaunch) {
        sa.quick('appLaunch', wx.getLaunchOptionsSync());
      }
    }
  }
})();

wx.onShow(res => {
  //logger.info('onShow, res:', res);
  appLaunchFunc();
  if (sa.para.autoTrack && sa.para.autoTrack.appShow) {
    sa.quick('appShow', res);
  }
});

wx.onHide(res => {
  if (sa.para.autoTrack && sa.para.autoTrack.appHide) {
    sa.quick('appHide');
  }
});

sa.onShareAppMessage = function(callback) {
  wx.onShareAppMessage(function() {
    sa.track('$MPShare', {
      $share_depth: _.getShareDepth()
    });
    if (typeof callback === 'function') {

      let returnValue = callback.call(wx);

      if (sa.para.allow_amend_share_path) {
        if (typeof returnValue !== 'object') {
          returnValue = {};
          returnValue.query = '';
        }
        returnValue.query = typeof returnValue.query === "string" ? returnValue.query : "";
        if (typeof returnValue === 'object' && typeof returnValue.query === 'string' && returnValue.query) {
          if (returnValue.query.slice(-1) !== '&') {
            returnValue.query = returnValue.query + '&';
          }
        }

        returnValue.query = returnValue.query + 'sampshare=' + encodeURIComponent(_.getShareInfo());
      }

      return returnValue;
    }
  });
};


sa.initial();

export default sa;
