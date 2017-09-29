var persistent_data = {
  
  name :'',

  id :'',
  
  init : function(){
    
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg.handler in persistent_data){
        persistent_data[msg.handler](msg, sender, sendResponse);
      }
    });

  },

  set: function(msg, sender, sendResponse){
    this.name = msg.data.name,
    this.id = msg.data.id
  },

  get: function(msg, sender, sendResponse){
    sendResponse({name:this.name,id:this.id});
  },
  
};

persistent_data.init();