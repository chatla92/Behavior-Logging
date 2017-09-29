if(document.getElementById("vis")){
	$.ajax({
	   type : 'GET',
	   url: "http://0.0.0.0:8000/visulaize",
	   contentType: "text/plain",
	   success: function(response){
	   	var pie = new d3pie("myPie", {
	   	    header: {
	   	        title: {
	   	            text: "A very simple example pie"
	   	        }
	   	    },
	   	    data: {
	   	        content: [
	   	            { label: "JavaScript", value: 50 },
	   	            { label: "Ruby", value: 20 },
	   	            { label: "Java", value: 30},
	   	        ]
	   	     },
	   	});
	    }
	}
}
