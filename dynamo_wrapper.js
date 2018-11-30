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



// /*
//   Sends a request based on options
//   Do not change.
// */
// async function send_request(){
//     request(options, (error, response, body)=>{
//   });
// };



/*
  Creates a connection with the designated Dynamo endpoint. POST REQUEST
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
        }
      });
  });
  return sql_connection;
}


/*
  TODO: Relates two ids together. Useful for relating a document and a fund.
*/
async function Document_relate(id_1, id_2) {
  body = `{"_id1":"${id_1}","_id2":"${id_2}"}`;
  response = await create_entity('Document_Activity', body);
  return response;
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
  return response;
}


/*
  Same thing as upload_document just adds a tag field.
  Sends a document to api Document endpoint through POST request. 
              Parameters: title       => Name of documents
                          extension   => document type 
                                          e.g. DOC, pdf, msg
                          content     => string base64 encoded senst from document.
                          tag         => tag id of L_Document_categories.
                                          e.g. 38b1ef39-b22f-48bb-a44b-339e18f644e6
*/
async function upload_document_with_tag(title, extension, content, tag){
  body = `{"Title":"${title}","Extension":".${extension}","_content":"${content}", "Documentcategories":[{"id":"${tag}", "es":"L_Document_categories"}] }`;
  response = await create_entity('Document', body);
  // console.log("Dynamo: ", response);
  return response;
}


/*
  Gets an array of all funds.
  Internal Helper Function. Do not touch.
*/
async function get_entity_ids(entity){
  var entities = new Promise(async(resolve, reject)=>{
    response = await get_create_entity(entity);
    let j = JSON.parse(response.body);
    let data = j.data;
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
    var count = 1;
    for (let i = 0; i<funds.length; i++) {
      console.log(funds[i].Identifier);
      if(funds[i].Identifier == fund_name){
        resolve(funds[i]._id);
        break;
      }
      count ++;
    }
    if(count > funds.length){
    reject("Couldn't find fund id for ", fund_name);
  }
  });
  return fund_info;
}




/*
  TODO: Adding a relation between each of the documents.
            Paramaters: array_of_documents    => Array of document ids that should be related.
                                                 e.g. ["89880200-670a-47a1-abb3-e31d4de38d6b", "b3ea377e-3bab-4bbb-be81-e7347638146a", "0eee90ba-8932-4d92-8871-87c6ea9ea6a8"]

*/
async function add_relation(array_of_documents){
  for (doc in array_of_documents){

  }
}

/*
  Gets all the available document tags.
                  Parameter: tag_name           => type of id you are looking for. 
                             relationship_table => Which table to look for the relationship
                                                   e.g. L_Document_categories
*/
async function get_relation(tag_name, relationship_table){
  var doc_tag = new Promise(async(resolve, reject)=>{
    tags = await get_entity_ids(relationship_table);
    // console.log(tags);
    var count = 0;
    for (let i = 0; i<tags.length; i++) {
      count++;
      if(tags[i].LookupName == tag_name){
        resolve(tags[i]._id);
        break;
      }
    }
    if(count == tags.length){
      log_text = `Updating document tage from ${tag_name} to Misc`
      //Insert Misc _ID and resolve the id.
      reject("Couldn't find ", tag_name);
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
  return response.body.data._id;
}





/*
  Exporting modules... There has got to be a better way to do this.
*/
module.exports.upload_document = upload_document;
module.exports.create_entity = create_entity;
// module.exports.send_request = send_request;
module.exports.add_manager = add_manager;
module.exports.get_fund_id = get_fund_id;
module.exports.get_relation = get_relation;
module.exports.upload_document_with_tag = upload_document_with_tag;



