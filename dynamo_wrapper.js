const request = require('request');
const auth = require('./private/auth.json');


//TODO: remove before pushing to production
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


var options = {
  url: 'https://api.dynamosoftware.com/api/v2.0/entity',
  proxy: auth.proxy,
  headers: {
    'Content-Type' : 'application/json',
    'Authorization' : auth.api,
    'Accept': 'application/json',
    'User-Agent': 'request'
  },
};



/*
  Sends a request based on options
  Do not change.
*/
async function send_request(){
    request(options, (error, response, body)=>{
    // console.log('error:', error); // Print the error if one occurred
    // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    //console.log('body:', body); // Print the HTML for the page
  });
};



/*
  Creates a connection with the designated Dynamo endpoint. POST REQUEST
              Parameters: entityType  => The type of data from the Dynamo endpoint you are trying to view or upload
                                          e.g. 'Document', 'Contacts/total' 
                          body        => Body of message to be sent to Dynamo Endpoing
                                          e.g. DOC, pdf, msg
*/
async function create_entity(entityType, body) {
  // console.log("Promise");
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
          // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          //console.log('body:', body); // Print the HTML for the page
        }
      });
  });
  return sql_connection;
}




/*
  Creates a connection with the designated Dynamo endpoint. GET REQUEST
              Parameters: entityType  => The type of data from the Dynamo endpoint you are trying to view or upload
                                          e.g. 'Document', 'Contacts/total' 
                          body        => Body of message to be sent to Dynamo Endpoing
                                          e.g. DOC, pdf, msg
*/
async function get_create_entity(entityType) {
  var sql_connection = new Promise(async(resolve, reject)=>{
    options.url =  `https://apiuat.dynamosoftware.com/api/v2.0/entity/${entityType}`
      await request.get(options, (error, response, body)=>{
        if(error) {
          console.log('error:', error); // Print the error if one occurred
          reject(error);
        }
        else {
          resolve({response, body});
          // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          //console.log('body:', body); // Print the HTML for the page
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
  console.log("awaiting reaponse");
  response = await get_create_entity('Document', body);
  // console.log(response);
  return response;
}
//TODOO:
//"Documentdate": "2018-09-07T16:55:12"
//"Funds": "",
//Get Fund ID name so I can create a relation.



/*
  Gets an array of all funds.
*/
async function get_entity_ids(entity){
  var entities = new Promise(async(resolve, reject)=>{
    response = await get_create_entity(entity);
    let j = JSON.parse(response.body);
    let data = j.data;
    // for(let i = 0; i< 10; i++){
    //   console.log(data[i].Identifier);
    // }
    if(data != undefined){  
    resolve(data);
    }
    else{
      reject("Data is undefined");
    }
  });
  return entities;
}

/*
  Gets the fund ID that is associated with the fund name.
                  Parameter: fund_name      => Name of fund
*/
async function get_fund_id(fund_name){
  let fund_info = new Promise(async(resolve, reject)=>{
    funds = await get_entity_ids('Fund');
    var count = 0;
    console.log(fund_name);
    for (let i = 0; i<funds.length; i++) {
      // console.log(funds[i].Identifier);
      if(funds[i].Identifier == fund_name){
        console.log("Funds match!!");
        resolve(funds[i]._id);
      }
    }
  });
  return fund_info;
}

/*
  Gets all the available document tags.
                  Parameter: fund_name      => Name of fund
*/
async function get_Doc_tag(tag_name){
  var doc_tag = new Promise(async(resolve, reject)=>{
    tags = await get_entity_ids('L_Document_categories');
    // console.log(tags);
    var count = 0;
    for (let i = 0; i<tags.length; i++) {
      console.log(tags[i].LookupName);
      if(tags[i].LookupName == tag_name){
        resolve(tags[i]._id);
      }
    }
  });
  return doc_tag;
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
module.exports.get_fund_id = get_fund_id;
module.exports.get_Doc_tag = get_Doc_tag;



