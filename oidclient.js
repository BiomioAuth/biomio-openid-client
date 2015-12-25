/**
  How to use

  OIDClient.init({
    response_type: "token" or "code",
    scope: "openid profile",
    client_id: "aaabbbccc",
    redirect_uri: "https://example.com/",
  });

  OIDClient.login('hello@mail.com', 'popup');

  OIDClient.getUser();
  OIDClient.getAccessToken();

 */


var OIDClient = (function() {
  var user = null;
  var provider_uri;
  var response_type;
  var scope;
  var client_id;
  var redirect_uri;

  var init = function(options) {
    if(!options.client_id) {
      throw new Error('Parameter "client_id" is required!');
    }

    /** set options */
    provider_uri = options.provider_uri || 'http://biom.io:5001';
    response_type = options.response_type || 'code';
    scope = options.scope || 'openid profile';
    client_id = options.client_id;
    redirect_uri = options.redirect_uri || window.location.protocol + "//" + window.location.host + window.location.pathname;

    /** check if in URL we have response from OpenID provider */
    if (checkResponse()) {
      if (window.localStorage['access_token']) {
        loadUserInfo();
      }
    }
  };

  var logout = function() {
    deleteCookie('nonce');
    deleteCookie('state');
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('id_token');
  };

  var login = function(external_token, type) {
    external_token = external_token || null;
    type = (type === 'redirect') ? 'redirect' : 'popup';

    logout();

    var nonce = random(8);
    var state = random(8);
    setCookie('nonce', nonce);
    setCookie('state', state);

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
  };

  var getUser = function() {
    return user;
  };

  var getAccessToken = function() {
    return window.localStorage["access_token"];
  };

  var getIdToken = function() {
    return window.localStorage["id_token"];
  };

  var isAuth = function() {
    if(window.localStorage["access_token"] != null || window.localStorage["id_token"] != null) {
      return true;
    } else {
      return false;
    }
  };

  var checkResponse = function() {
    var fragment = parseFragment();
    if (fragment === {}) {
      return false;
    }

    var isStateValid = (fragment.state === getCookie('state'));

    if(isStateValid) {
      if(fragment.access_token) {
        window.localStorage["access_token"] = fragment["access_token"];
      }

      if(fragment.id_token) {
        window.localStorage["id_token"] = fragment["id_token"];
      }
      return true;
    }

    return false
  };

  /**
   * Load user info from API
   */
  var loadUserInfo = function() {
    var access_token = window.localStorage["access_token"];
    if (!access_token) {
      throw new Error('Can not load user info, access_token is required!');
    }

    var url = provider_uri + '/api/user?access_token=' + access_token;

    makeRequest('GET', url, function(err, data) {
      if (!err && data) {
        user = data.user;
      }
    });
  }

  var makeRequest = function(method, url, done) {
    var httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
      throw new Error('Cannot create an XMLHTTP instance');
    }

    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          try {
            var result = JSON.parse(httpRequest.responseText);
          } catch (Ex) {
            result = httpRequest.responseText;
          }
          done(null, result);
        } else {
          done('There was a problem with the request.');
        }
      }
    };

    httpRequest.open(method, url);
    httpRequest.send();
  };

  /**
   * Generate random string
   * @param size
   * @returns {*}
   */
  var random = function(size) {
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
  var parseFragment = function() {
    var params = {};
    var queryString = location.hash.substring(1);
    var regex = /([^&=]+)=([^&]*)/g;
    var m;

    while (m = regex.exec(queryString)) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
  };

  var getCookie = function(name) {
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  };

  var setCookie = function(name, value, options) {
    options = options || {};

    var expires = options.expires;

    if (typeof expires == "number" && expires) {
      var d = new Date();
      d.setTime(d.getTime() + expires * 1000);
      expires = options.expires = d;
    }
    if (expires && expires.toUTCString) {
      options.expires = expires.toUTCString();
    }

    value = encodeURIComponent(value);

    var updatedCookie = name + "=" + value;

    for (var propName in options) {
      updatedCookie += "; " + propName;
      var propValue = options[propName];
      if (propValue !== true) {
        updatedCookie += "=" + propValue;
      }
    }

    document.cookie = updatedCookie;
  };

  var deleteCookie = function(name) {
    setCookie(name, "", {expires: -1});
  };

  return {
    init: init,
    login: login,
    logout: logout,
    isAuth: isAuth,
    getUser: getUser,
    getIdToken: getIdToken,
    getAccessToken: getAccessToken
  }
})();
