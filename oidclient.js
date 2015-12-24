/**
 * Instance of client
 * @param options
 *  {
 *    response_type: "token" or "code",
 *    scope: "openid profile",
 *    client_id: "aaabbbccc",
 *    redirect_uri: "https://example.com/",
 *  }
 * @constructor
 */
var OIDClient = function(options) {
  if(!options.client_id) {
    throw Error('Parameter "client_id" is required!');
  }

  this.provider_uri = options.provider_uri || 'http://biom.io:5001';
  this.response_type = options.response_type || 'code';
  this.scope = options.scope || 'openid profile';
  this.client_id = options.client_id;
  this.redirect_uri = options.redirect_uri || window.location.protocol + "//" + window.location.host + window.location.pathname;
  this.user = null;

  /** check if user is authorized or in URL we have response from OpenID provider */
  if (this.checkResponse()) {
    if (window.localStorage["access_token"]) {
      this.loadUserInfo();
    }
  }

};

/**
 * Load user info from API
 */
OIDClient.prototype.loadUserInfo = function() {
  var self = this;
  if (!window.localStorage["access_token"]) {
    throw new Error('Can not load user info, access_token is required!');
  }

  var url = this.provider_uri + '/api/user?access_token=' + window.localStorage["access_token"];

  self.makeRequest(url, function(err, data) {
    if (!err && data) {
      self.user = data.user;
    }
  });
}

OIDClient.prototype.makeRequest = function(url, done) {
  var httpRequest = new XMLHttpRequest();

  if (!httpRequest) {
    throw new Error('Cannot create an XMLHTTP instance');
  }

  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        done(null, httpRequest.responseText);
      } else {
        done('There was a problem with the request.');
      }
    }
  };

  httpRequest.open('GET', url);
  httpRequest.send();
}


/**
 * Generate random string
 * @param size
 * @returns {*}
 */
OIDClient.prototype.random = function(size) {
  size = size || 8;
  var result = '';
  var crypto = window.crypto || window.msCrypto;;
  if(crypto && crypto.getRandomValues) {
    var D = new Uint32Array(1);
    crypto.getRandomValues(D);
    result = D[0].toString(size);
  } else {
    while (result.length < size) {
      result += Math.random().toString(36).substring(2);
    }
    result =  result.substring(0, size);
  }

  return result;
};

/**
 * Parse URL
 * @returns {{}}
 */
OIDClient.prototype.parseFragment = function() {
  var params = {};
  var queryString = location.hash.substring(1);
  var regex = /([^&=]+)=([^&]*)/g;
  var m;

  while (m = regex.exec(queryString)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  return params;
};

OIDClient.prototype.isAuth = function() {
  if(window.localStorage["access_token"] != null || window.localStorage["id_token"] != null) {
    return true;
  } else {
    return false;
  }
};

OIDClient.prototype.checkResponse = function() {
  var fragment = this.parseFragment();

  if(fragment != {} && fragment.state === window.localStorage['state']) {
    if(fragment.access_token) {
      window.localStorage["access_token"] = fragment["access_token"];
    }

    if(fragment.id_token) {
      window.localStorage["id_token"] = fragment["id_token"];
    }
  }

  return this.isAuth();
};

/**
 * Open authorization popup or redirect user to authorization page
 * @param external_token - unique id of user
 * @param type - "redirect" or "popup"
 */
OIDClient.prototype.login = function(external_token, type) {
  external_token = external_token || null;
  type = (type === 'redirect') ? 'redirect' : 'popup';

  this.nonce = window.localStorage["nonce"] = window.localStorage["nonce"] || this.random(8);
  this.state = window.localStorage["state"] = window.localStorage["state"] || this.random(8);

  var url = this.provider_uri
    + '/user/authorize'
    + '?response_type=' + this.response_type
    + '&external_token=' + external_token
    + '&scope=' + this.scope
    + '&client_id=' + this.client_id
    + '&nonce=' + this.nonce
    + '&state=' + this.state
    + '&redirect_uri=' + this.redirect_uri;

  if (type === 'popup') {
    window.open(url, 'null', 'width=460, height=485, location=no');
  } else {
    window.location.href = url;
  }
}