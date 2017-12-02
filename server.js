var http = require('http');
var fs = require('fs');
var url = require('url');
var mongo = require('mongodb');
const alpha = require('alphavantage')({key: '13H9GAWTQGC51OLB'});

setInterval(function(){ get_quote("LAC"); }, 120 * 1000);
setInterval(function(){ get_quote("WEED"); }, 120 * 1000);
setInterval(function(){ storeChange(); }, 120 * 1000);

var MongoClient = require('mongodb').MongoClient;
var urlDB = "mongodb://localhost:27017/mydb";

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

	if(req.url != "/favicon.ico"){
		logUserTime(req);
	}
}).listen(8080); //the server object listens on port 8080

function logUserTime(req){
	var ipAddress = req.connection.remoteAddress != '::1' ? req.connection.remoteAddress : 'Possibly local host';

	fs.appendFile('log.txt', 'User logged at ' + getTimeNow() + ' on IP: ' + ipAddress + '\n', function (err) {
		if (err) throw err;
	});
}

function get_change(res){
	MongoClient.connect(urlDB, function(err, db) {
		if (err) throw err;
		
		db.collection('stocks').find({}).toArray(function(err,arr){
			if (err) throw err;
			displaystuff(arr,res);	
		});
		
		db.close();
	});
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

function storeChange(){
	var now = new Date();
	var min = now.getMinutes();
	var hrs = now.getHours();
	
	if((hrs > 9 || (hrs === 9 && min > 15)) && (hrs < 16 || ( hrs === 16 && min < 15))){		
		var total = 0;
		var idx = 0;
		
		MongoClient.connect(urlDB, function(err, db) {
			if (err) throw err;
			db.collection('stocks').find({}).toArray(function(err,results){
				if (err) throw err;
				
				for(var i in results){
					var obj = results[i];
					
					var change = ((obj.value-obj.initvalue)*obj.amount - 9.99).toFixed(3);
					total += parseFloat(change);
					
					if (idx === results.length - 1){
						console.log("Total change has been stored at: " + getTimeNow())
						console.log("Total Change " + total.toFixed(2));
					}
					idx++;
				}		
			});
			db.close();
		});
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
		
		MongoClient.connect(urlDB, function(err, db) {
			if (err) throw err;
			var myquery = { "name": ticker };
			var newvalues = { $set : {value: curPrice } };
			db.collection("stocks").updateOne(myquery, newvalues, function(err, result) {
				if (err) throw err;
				console.log(ticker + " stock updated");
				db.close();
			});
		});
	}).catch(function () {
		console.log("Promise Rejected for " + ticker);
	});
}
