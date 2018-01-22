(function (Leanplum, $) {

  Utilities.lpInit();

  // Utilities.lpEnablePauseResumeSession();

  $(document).ready(function () {

    var varsCallback = function() {
      var variables = Leanplum.getVariables();
      console.log('Variables Callback', Leanplum.getVariables());
      console.log('Variables Callback', variables.theme);
      var lpVars = Leanplum.getVariables();
      if(lpVars && lpVars.theme){
        $('#theme').text(lpVars.theme);
      }
    };
    Leanplum.addVariablesChangedHandler(varsCallback);

    $(document).find("span#user-id").text(Leanplum._userId);

// Login: Set User Id dialog
$("#btn-login").click(function (sender) {
  $( "#dialog-message" ).dialog({
    modal: true,
    draggable: false,
    resizable: false,
    buttons: {
      "Login": function () {
        var userId =$( this ).find('#input-login').val();
        Utilities.lpAction(() => {
          Leanplum.setUserId(userId);
          Utilities.lpForceContentUpdate();
          $(document).find("span#user-id").text(Leanplum._userId);
        })
        $( this ).dialog( "close" );
      },
      Cancel: function() {
        $( this ).dialog( "close" );
      }
    },
    dialogClass: 'no-close'
  });
});

// Search: Event with parameter
$("#btn-search").click(function (sender) {
  var text = $("#input-search").val();
  if (text) {
    Leanplum.track("Search", {'text': text.toLowerCase()});
  }
});

// Web Push
$("#btn-reg-push").click(function (sender) {
  console.log('reg-push');
  var registerForWebPushPromise = Leanplum.registerForWebPush('/vendor/sw/sw.min.js');
  registerForWebPushPromise.then(function(subscriptionStatus) {
    console.log('Subscription status: ' + subscriptionStatus);
  });
});

$("#btn-unreg-push").click(function (sender) {
  console.log('unreg-push');
  Leanplum.unregisterFromWebPush().then(function() {
    console.log('Unregistered');
  });
});

// AB Tests
var setThemeEnabledAttrValue = function(value){
  Utilities.lpAction(() => {
    var key = Constants.LEANPLUM_USER_ATTRIBUTES.THEME_ENABLED;
      // If used {key:value} the key is set as "key"
      var attr = {};
      attr[key] = value;
      Leanplum.setUserAttributes(attr);
      Utilities.lpForceContentUpdate(true);
    });
};

$("#btn-opt-in").click(function (sender) {
  setThemeEnabledAttrValue(true);
});

$("#btn-opt-out").click(function (sender) {
  setThemeEnabledAttrValue(false);
});

// App-Inbox
$("#btn-get-messages").click(function(){
  Utilities.lpGetNewsFeedMessages().then(function(messages){
    // TODO: Sort by delivered timestamp
    if(messages && Object.keys(messages).length > 0){
      var messagesToRender = [];
      for (var msg in messages) {
        var inboxMsg = messages[msg];
        inboxMsg.id = msg;
        messagesToRender.push(inboxMsg);
      }
      var helpers = {
        dateTime: function(val) { return new Date(val); },
      };
      var tmpl = $.templates("#inbox-template");
      var html = tmpl.render(messagesToRender, helpers);
      var messagesTemplate = $(document).find("#messages");
      messagesTemplate.html(html);
      messagesTemplate.on('click', '.btn-read', function(){
       var messageId = $(this).data('id');
       Utilities.lpMarkNewsFeedMessageAsRead(messageId).then(function(){
        console.log("Read");
      });
     });
      messagesTemplate.on('click', '.btn-delete', function(){
       var messageId = $(this).data('id');
       Utilities.lpDeleteNewsFeedMessage(messageId).then(function(){
        console.log("Deleted");
      });
     });
    } else {
      // If No messages are returned after delete and without page refresh
      $(document).find("#messages").text("No messages.");
    }
    $(document).find("#messages").show();
  })
});
});

}(Leanplum, jQuery));