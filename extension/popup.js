document.addEventListener('DOMContentLoaded', function() {

  var user_id;
  chrome.tabs.getSelected(null, function(tab) {
    
    chrome.runtime.sendMessage({handler:'get'},function(response){
      document.getElementById('user').innerHTML = response.name;
      document.getElementById('user').title = response.id;
      user_id = response.id;
    });

    var url= tab.url;

    if (url === 'https://0.0.0.0:8000/home') {
      chrome.tabs.sendMessage(tab.id, {text: 'pop'}, function(response){
        document.getElementById('user').innerHTML = response.name;
        document.getElementById('user').title = response.id;
        user_id = response.id;
        chrome.runtime.sendMessage({handler:'set', data : response});
      });
    }

  });

  var checkPageButton = document.getElementById('checkPage');
  var urlregex = /^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com/;
  
  checkPageButton.addEventListener('click', function() {  
    var win = window.open('https://0.0.0.0:8000/home', '_blank');
    win.focus();
  },false);

}, false);