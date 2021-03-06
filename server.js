var http = require('http');
var fs = require('fs');
var url = require('url');
const alpha = require('alphavantage')({key: '13H9GAWTQGC51OLB'});

//create a server object:
http.createServer(function (req, res) {
	var q = url.parse(req.url, true);

	var filename;
	if(q.pathname === '/') {
		filename = './index.html';
	}else{
		filename = '.' + q.pathname + '.html';
	}

	fs.readFile(filename, function(err,data) {
		if(err) {
			res.writeHead('404', {'Content-type': 'text/html'});
			return res.end('404 not found');
		}

		res.writeHead('200', {'Content-type': 'text/html'});
		//res.write(data); //write a response to the client

		get_change(res);
	});
}); //the server object listens on port 8080

var port = process.env.PORT || 8000; 
http.listen(port, function() {
    console.log("App is running on port " + port);
});

function get_change(res){
	res.write("we good");
	return res.end();
}
function displaystuff(results,res){
	var now = new Date();
	var total = 0;
	var idx = 0;

	for(var i in results){
		var obj = results[i];

		var change = ((obj.value-obj.initvalue)*obj.amount - 9.99).toFixed(3);

		res.write(obj.name + ": " + change + "</br>");
		total += parseFloat(change);
		if (idx === results.length - 1){
			res.write("</br>Total: " + total.toFixed(2));
			res.end();
		}
		idx++;
	}
}

function getTimeNow(){
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var date = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();
	if(minute < 10){
		minute = '0' + minute;
	}
	return year + "-" + month + "-" + date + " " + hour + ":" + minute;
}

function get_quote(ticker) {
	alpha.data.intraday(ticker).then((data) => {
		var now = new Date();

		var dayobj = data['Time Series (1min)'];

		for (var props in dayobj) {
			var time = props;
			break;
		}

		var timeobj = dayobj[time];
		var curPrice = timeobj['4. close'];
	}).catch(function () {
		console.log("Promise Rejected for " + ticker);
	});
}
