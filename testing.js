const dynamo = require("./dynamo_wrapper");


new_manager = dynamo.add_manager({first_name:"JoCee", last_name:"porter", phone: "8015555555"});
console.log(new_manager);