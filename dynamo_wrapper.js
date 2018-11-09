const request = require('request');
const auth = require('./private/auth.json');

var options = {
  url: 'https://apiuat.dynamosoftware.com/api/v2.0/entity',
  proxy: auth.proxy,
  headers: {
    'Content-Type' : 'application/json',
    'Authorization' : auth.api,
    'Accept': 'application/json'
  },
};

/*
  Sends a request based on options
  Do not change.
*/
async function send_request(){
    request(options, (error, response, body)=>{
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the page
  });
};



/*
  Creates a connection with the designated Dynamo endpoint. 
              Parameters: entityType  => The type of data from the Dynamo endpoint you are trying to view or upload
                                          e.g. 'Document', 'Contacts/total' 
                          body        => Body of message to be sent to Dynamo Endpoing
                                          e.g. DOC, pdf, msg
*/
async function create_entity(entityType, body) {
  var sql_connection = new Promise(async(resolve, reject)=>{
    options.url =  `https://apiuat.dynamosoftware.com/api/v2.0/entity/${entityType}`
    options.body = body;  
      await request.post(options, (error, response, body)=>{
        if(error) {
          console.log('error:', error); // Print the error if one occurred
          reject(error);
        }
        else {
          resolve({response, body});
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          console.log('body:', body); // Print the HTML for the page
        }
      });
  });
  return sql_connection;
}



/*
  Sends a document to api Document endpoint through POST request. 
              Parameters: title       => Name of documents
                          extension   => document type 
                                          e.g. DOC, pdf, msg
                          content     => string base64 encoded senst from document.
*/
async function upload_document(title, extension, content){
  body = `{"Title":"${title}","Extension":".${extension}","_content":"${content}"}`;
  response = await create_entity('Document', body);
  //console.log(response);
  return response;
}


/*
  performs a post request to https://apiuat.dynamosoftware.com/api/v2.0/entity/Contact with optional fields added to body.
          Parameters: last_name, first_name, title, company, email, street_line, city, state, country, zip_code, phone
          
          Returns:    _id => id of manager returned from Dyanmo
*/
async function add_manager({last_name = "", first_name = "", title = "", company = "", email = "", street_line = "", city = "", state = "", country = "", zip_code = "", phone = "" })
{
  body = `{"LastName":"${last_name}","FirstName":"${first_name}","Jobtitle":"${title}","Company":"${company}","ContactInfo_Email":"${email}","ContactInfo_BusinessAddress_Street":"${street_line}","ContactInfo_HomeAddress_City":"${city}","ContactInfo_BusinessAddress_State":"${state}","ContactInfo_BusinessAddress_Country":"${country}","ContactInfo_BusinessAddress_Zip":"${zip_code}","ContactInfo_BusinessPhone":"${phone}"}`;
  response = await create_entity('Contact', body);
  console.log("RETURNING");
  return response.body.data._id;
}





/*
  Exporting modules... There has got to be a better way to do this.
*/
module.exports.upload_document = upload_document;
module.exports.create_entity = create_entity;
module.exports.send_request = send_request;
module.exports.add_manager = add_manager;



