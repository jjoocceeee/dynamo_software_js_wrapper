const dynamo = require("./dynamo_wrapper");


body = `{
    "FirstName":"JoCee", 
    "LastName":"Porter"
}`;
dynamo.create_entity('Contact', body );