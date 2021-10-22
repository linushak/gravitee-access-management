var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("graviteeam");
    dbo.collection("domains").findOne({}, function(err, result) {
      if (err) throw err;
      if (result == "linus") {
        console.log("success");
      }
      db.close();
    });
  });
