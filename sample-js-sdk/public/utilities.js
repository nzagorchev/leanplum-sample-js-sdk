  var Utilities = (function (Leanplum) {

  // lpAction(() => Leanplum.setUserAttributes({'action-enabled': false}))
  var lpAction = function(delegate){
    delegate();
    updateActiveTime();
  }

  var updateActiveTime = function(){
    saveToLocalStorage(Constants.LEANPLUM_KEYS.ACTIVE_TIME, new Date());
  }

// Session is limited to 2 hours server side
// Paused session is closed after 30 minutes server side
// Next send action will create a new session in the above cases
var isInSession = function(){
  var activeTime = getFromLocalStorage(Constants.LEANPLUM_KEYS.ACTIVE_TIME);
  if (activeTime){
    var sessionMinutesLater = new Date(activeTime);
    sessionMinutesLater.setMinutes(sessionMinutesLater.getMinutes() + Constants.LEANPLUM_CONST.SESSION_ACTIVITY_TIME);

    if(sessionMinutesLater > new Date()){
      return true;
    }
  }

  return false;
}

var saveToLocalStorage = function(key, value) {
  try {
    localStorage[key] = value;
  } catch (e) {
      // TODO: Add localStorage alternative if localStorage is not available
    }
  };

  var getFromLocalStorage = function(key) {
    var value = null;

    try {
      value = localStorage[key];
    } catch (e) {
      // TODO: Add localStorage alternative if localStorage is not available
    }

    return value;
  };

// NOTE: This uses Leanplum internal logic currently exposed.
// Otherwise update the vars in localStorage manually
// Use native SDK method when implemented
var lpForceContentUpdate = function (delay) {
  if(delay){
    setTimeout(function(){ lpForceContentUpdate(false); }, 1000);
  } else {
    var params = {
      appId:Constants.LEANPLUM_CONFIG.PROD.ID,
      clientKey:Constants.LEANPLUM_CONFIG.PROD.KEY,
      userId: Leanplum._userId,
      deviceId:Leanplum._deviceId,
      includeDefaults:false,
      apiVersion: Constants.LEANPLUM_CONFIG.API_VERSION
    };
    $.ajax({
      url:"https://www.leanplum.com/api?action=getVars",
      method: "GET",
      data: params,
      success: function (data) {
        let getVarsResponse = data.response[0];
        if (getVarsResponse.success) {
          let values = getVarsResponse["vars"];
          let variants = getVarsResponse["variants"];
          let actionMetadata = getVarsResponse["__leanplum_action_metadata"];
          if (!_.isEqual(values, Leanplum._diffs)) {
            // Executes variablesChanged callbacks
            Leanplum._setContent(values, variants, actionMetadata);
          }
        } else {console.log("Error on lpForceContentUpdate: " + data);}
      },
      error: function (xhr) {
        console.log("Error on lpForceContentUpdate: " + xhr);
      }
    });
  }
};

var lpGetNewsFeedMessages = function () {
  return new Promise((resolve, reject) => {
    var deviceId = Leanplum._deviceId;
    var userId = Leanplum._userId;
    if(deviceId && userId) {
      var params = {
        appId:Constants.LEANPLUM_CONFIG.PROD.ID,
        clientKey:Constants.LEANPLUM_CONFIG.PROD.KEY,
        userId: Leanplum._userId,
        deviceId:Leanplum._deviceId,
        apiVersion: Constants.LEANPLUM_CONFIG.API_VERSION
      };
      $.ajax({
        url:"https://www.leanplum.com/api?action=getNewsfeedMessages",
        method: "GET",
        data: params,
        success: function (data) {
          console.log(data);
          if(data && data["response"][0]["success"]) {
            var messages = data["response"][0]["newsfeedMessages"];
            return resolve(messages);
          } else{
            return reject('Error processing app-inbox messages.');
          }
        },
        error: function (xhr){
          return reject('Error fetching app-inbox messages.');
        }
      });
    }});
};

var lpNewsFeedMessageAction = function (action, messageId) {
  return new Promise((resolve, reject) => {
    var deviceId = Leanplum._deviceId;
    var userId = Leanplum._userId;
    if(deviceId && userId && action && messageId) {
      var params = {
        action:action,
        appId:Constants.LEANPLUM_CONFIG.PROD.ID,
        clientKey:Constants.LEANPLUM_CONFIG.PROD.KEY,
        userId: Leanplum._userId,
        deviceId:Leanplum._deviceId,
        newsfeedMessageId:messageId,
        apiVersion: Constants.LEANPLUM_CONFIG.API_VERSION
      };
      $.ajax({
        url:"https://www.leanplum.com/api",
        method: "GET",
        data: params,
        success: function (data) {
          console.log(data);
          if(data && data["response"][0]["success"]) {
            return resolve(data);
          } else{
            return reject('Error processing app-inbox messages.');
          }
        },
        error: function (xhr){
          return reject('Error fetching app-inbox messages.');
        }
      });
    }});
};

var lpMarkNewsFeedMessageAsRead = function (messageId) {
  return lpNewsFeedMessageAction('markNewsfeedMessageAsRead', messageId);
};

var lpDeleteNewsFeedMessage = function (messageId) {
  return lpNewsFeedMessageAction('deleteNewsfeedMessage', messageId);
};

var lpInit = function (isDevelopmentMode) {

 if (isDevelopmentMode) {
   Leanplum.setAppIdForDevelopmentMode(Constants.LEANPLUM_CONFIG.DEV.ID, Constants.LEANPLUM_CONFIG.DEV.KEY);
 } else {
   Leanplum.setAppIdForProductionMode(Constants.LEANPLUM_CONFIG.PROD.ID, Constants.LEANPLUM_CONFIG.PROD.KEY);
 }

 Leanplum.setVariables(Constants.LEANPLUM_VARIABLES);

 Leanplum.setAppVersion(Constants.LEANPLUM_CONST.APP_VERSION);

 Leanplum.setRequestBatching(false);

 Utilities.lpAction(() => {
  if(isInSession()) {
    console.log('Is In Session');
    // Prepopulate Leanplum user id and device id
    var userId = Leanplum._getFromLocalStorage("__leanplum_user_id");
    Leanplum._deviceId = Leanplum._getFromLocalStorage("__leanplum_device_id");
    Leanplum.startFromCache(userId, function(success) {
     console.log('Success: ' + success);
     console.log('Variables', Leanplum.getVariables());
   });
  } else {
    console.log('Is NOT In Session');
    Leanplum.start(function(success) {
     console.log('Success: ' + success);
     console.log('Variables', Leanplum.getVariables());
   });
  }
});
};

// Custom visibility tracking function
var onVisibilityChange = function(callback) {
  var visible = true;

  if (!callback) {
    throw new Error('No callback provided');
  }

  function focused() {
    if (!visible) {
      callback(visible = true);
    }
  }

  function unfocused() {
    if (visible) {
      callback(visible = false);
    }
  }

    // Standards:
    if ('hidden' in document) {
      document.addEventListener('visibilitychange',
        function() {(document.hidden ? unfocused : focused)()});
    }
    if ('mozHidden' in document) {
      document.addEventListener('mozvisibilitychange',
        function() {(document.mozHidden ? unfocused : focused)()});
    }
    if ('webkitHidden' in document) {
      document.addEventListener('webkitvisibilitychange',
        function() {(document.webkitHidden ? unfocused : focused)()});
    }
    if ('msHidden' in document) {
      document.addEventListener('msvisibilitychange',
        function() {(document.msHidden ? unfocused : focused)()});
    }
    // IE 9 and lower:
    if ('onfocusin' in document) {
      document.onfocusin = focused;
      document.onfocusout = unfocused;
    }
    // All others:
    window.onpageshow = window.onfocus = focused;
    window.onpagehide = window.onblur = unfocused;
  };

  var lpEnablePauseResumeSession = function () {
    onVisibilityChange(function(visible) {
      visible ? Leanplum.pauseSession() : Leanplum.resumeSession();
      console.log('The page is now', visible ? 'focused' : 'unfocused');
    });
  }

  return {
    lpAction: lpAction,
    isInSession: isInSession,
    lpForceContentUpdate: lpForceContentUpdate,
    lpInit:lpInit,
    lpEnablePauseResumeSession: lpEnablePauseResumeSession,
    lpGetNewsFeedMessages: lpGetNewsFeedMessages,
    lpMarkNewsFeedMessageAsRead: lpMarkNewsFeedMessageAsRead,
    lpDeleteNewsFeedMessage: lpDeleteNewsFeedMessage
  }

}(Leanplum));