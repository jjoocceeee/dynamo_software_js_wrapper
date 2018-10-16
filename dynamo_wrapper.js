const request = require('request');
const auth = require('./private/auth.json');

var options = {
  url: 'https://apiuat.dynamosoftware.com/api/v2.0/entity',
  proxy: auth.proxy,
  headers: {
    'Content-Type' : 'application/json',
    'Authorization' : auth.api
  },
  //body: "",
};

function send_request(){
    request(options, (error, response, body)=>{
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the page
  });
};


/*
  performs a post request to https://apiuat.dynamosoftware.com/api/v2.0/entity/entityType
          Parameters: entityType  => The entity that you want to create. Example Contact
                      body        => Body of information you would like to send. Must be a json object.
*/
function create_entity (entityType, body){
  //update the url.
  options.url =  `https://apiuat.dynamosoftware.com/api/v2.0/entity/${entityType}`
  options.body = body;      //TODO: Check to make sure that this works.
  console.log(options);
  request.post(options, (error, response, body)=>{
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the page
  });
};



/*
  performs a post request to https://apiuat.dynamosoftware.com/api/v2.0/entity/Contact with optional fields added to body.
          Parameters: last_name, first_name, title, company, email, street_line, city, state, country, zip_code, phone
*/
function add_manager(last_name = "", first_name = "", title = "", company = "", email = "", street_line = "", city = "", state = "", country = "", zip_code = "", phone = "" )
{
  body = `
  {
    "LastName":${last_name},
    "FirstName":${first_name},
    "title":${title},
    "company":${company},
    "email":${email},
    "street":${street_line},
    "city":${city},
    "state":${state},
    "country":${country},
    "zip_code":${zip_code},
    "phone":${phone}
  }`;
  create_entity('Contact', body);
}

module.exports.create_entity = create_entity;
module.exports.send_request = send_request;
module.exports.add_manager = add_manager;



