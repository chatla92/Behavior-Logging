var urlregex = /^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com/;
var urlregex2 = /^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com\/questions\/[0-9]+/;
var cur_id;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	
	if (msg.text === 'pop') {
	    sendResponse({name: document.getElementsByClassName('login_link')[0].id,
	    			  id: document.getElementsByClassName('latest_cat')[0].id})
	}
});

window.addEventListener('load', function () {
	var time_spent = '';
	
	if (urlregex.test(window.location.href)) {

		$(window).focus(function() {
    		time_spent = Date.now()/1000
		});

		$(window).blur(function() {
    		time_spent = (Date.now()-time_spent)/1000;
    		chrome.runtime.sendMessage({handler:'get'},function(response){	
      			cur_id = response.id;
    		});
    		$.ajax({
  					type : 'POST',
  					crossDomain:true,
  					url : 'https://0.0.0.0:8000/log',
  					contentType: "text/plain",
  					data : 	(cur_id+','+window.location.href+',time_spent'+','+time_spent)
			});
		});

		if (urlregex2.test(window.location.href)){

			var votes = $('.vote-count-post ')[0].innerHTML;
			var no_answers = $('.vote-count-post ').length -1;
			var labels = $('.label-key');
			var activity = labels[0].innerHTML+' '+labels[1].title+','+labels[2].innerHTML+' '+labels[3].childNodes[1].innerHTML+','+labels[4].innerHTML+' '+$(".lastactivity-link")[0].title;
			activity = activity + ":::" + no_answers + ":::" + votes;
			chrome.runtime.sendMessage({handler:'get'},function(response){	
      			cur_id = response.id;
    		});
			$.ajax({
  				type : 'POST',
				crossDomain:true,
				url : 'https://0.0.0.0:8000/log',
				contentType: "text/plain",
				data : 	(cur_id+','+window.location.href+',question_details'+','+activity)
			});

			$.each($(".vote-down-off"),function(index,ele){
        		ele.addEventListener('click', function(event) {
        			chrome.runtime.sendMessage({handler:'get'},function(response){	
      					cur_id = response.id;
    				});
        			$.ajax({
  						type : 'POST',
  						crossDomain:true,
  						url : 'https://0.0.0.0:8000/log',
  						contentType: "text/plain",
  						data : 	(cur_id+','+window.location.href+',votedown'+','+this.parentNode.firstChild.value)
					});
				});
    		});

    		$.each($(".vote-up-off"),function(index,ele){
        		ele.addEventListener('click', function(event) {
        			chrome.runtime.sendMessage({handler:'get'},function(response){	
      					cur_id = response.id;
    				});
        			$.ajax({
  						type : 'POST',
  						crossDomain:true,
  						url : 'https://0.0.0.0:8000/log',
  						contentType: "text/plain",
  						data : 	(cur_id+','+window.location.href+',voteup'+','+this.parentNode.firstChild.value)
					});
				});
    		});

    		$("$submit_button").addEventListener('click', function(event) {
    			chrome.runtime.sendMessage({handler:'get'},function(response){	
      				cur_id = response.id;
    			});
    			$.ajax({
					type : 'POST',
					crossDomain:true,
					url : 'https://0.0.0.0:8000/log',
					contentType: "text/plain",
					data : 	(cur_id+','+window.location.href+',answered'+','+'User has posted answer')
				});
    		});
		}

		$.each($(".question-hyperlink"),function(index,ele){
        	ele.addEventListener('click', function(event) {
        		chrome.runtime.sendMessage({handler:'get'},function(response){	
      				cur_id = response.id;
    			});
        		$.ajax({
  					type : 'POST',
  					crossDomain:true,
  					url : 'https://0.0.0.0:8000/log',
  					contentType: "text/plain",
  					data : 	(cur_id+','+window.location.href+',click'+','+this.href)
				});
			});
    	});
	}
});