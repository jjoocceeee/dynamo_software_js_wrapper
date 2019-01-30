const request = require('request');
const auth = require('./private/auth.json');
const fs = require('fs');
const async = require('async');
 


//TODO: remove before pushing to production
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';






/*
  Creates a connection with the designated Dynamo endpoint. POST REQUEST
              Parameters: entityType  => The type of data from the Dynamo endpoint you are trying to view or upload
                                          e.g. 'Document', 'Contacts/total' 
                          body        => Body of message to be sent to Dynamo Endpoing
                                          e.g. DOC, pdf, msg
*/
async function create_entity(entityType, body) {
  var connection = new Promise(async(resolve, reject)=>{
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
    options.url =  `https://api.dynamosoftware.com/api/v2.0/entity/${entityType}`
    options.body = body;  
    // console.log(options);
    try{
      await request.post(options, (error, response, body)=>{
        if(error) {
          console.log('error:', error); // Print the error if one occurred
          reject(error);
        }
        else {
          console.log('statusCode:', response.statusCode);
          if(response.statusCode != 200){
            console.log(`\n\nError creating ${options.url} for ${entityType} \nStatus code ${response.statusCode}\n ${response.headers}`);
            reject(`\n\nError creating ${options.url} Status code ${response.statusCode}\n ${response.headers}`)
          }
          else{
            resolve({response, body});
          }
        }
      }); 
    }
    catch{
      reject("Couldn't create entity");
    }
  });
  return connection;
}


/*
  TODO: wrap this in a promise. 
  Relates two ids together. Useful for relating a document and a fund.
*/
async function Document_relate(relation_type, id_1, id_2) {
  var Doc_rel = new Promise(async(resolve, reject)=>{
    // lock.acquire('log', async ()=>{
    body = `{"_id1":"${id_1}","_id2":"${id_2}"}`;
    try{
     response = await create_entity(relation_type, body);
     console.log("SUCCCCCCCCCCCCCCCCCCCCCCEEEEEESSSSSS: ", id_2, ":", id_1);
     resolve(response);
    //  console.log(`Successfully related ${id_1} to ${id_2}`);
    } catch {
      // console.log(`ERROR Wasn't able to realate ${relation_type} ${id_1} to  ${id_2}`);
      fs.appendFile("Fix.txt", `Error== ${relation_type}=${id_1}:${id_2}\n`, (err) => {
        if (err) throw err;
      });
      reject(`ERROR Wasn't able to realate ${relation_type} ${id_1} to ${id_2}`);
      
      }
      // done(err, ret);
    }, (err, ret)=>{
      if(err)
        console.log("Too many threads!!!! ", err);

    });
  // });
  return Doc_rel;
}

async function array_of_relations_helper(relations_array, id){
  var relations = new Promise(async(resolve, reject)=>{
  var total = relations_array.length;
  for(var j = 0; j< total - 1; j++){
    for(var k = j+1; k< total; k++){
      try{
        await Document_relate("Document_Document", relations_array[j], relations_array[k], id);
        resolve(id);
      }
      catch{
        errors ++;
        reject(`UNRELATED: relate ${relations_array[j]} to ${relations_array[k]}`);
        }
      }
    }
  });
  return relations;
}



async function array_of_relations(relations_array, id){
  var relations = new Promise(async(resolve, reject)=>{
    try{
    var yay = async.asyncify(array_of_relations_helper(relations_array), id);
    resolve(yay);
    return(yay);
    }
    catch{
      reject("Unnsuccessfully added all array relations.");
    }
  });
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
    options.url =  `https://api.dynamosoftware.com/api/v2.0/entity/${entityType}`;
    try{
      await request.get(options, (error, response, body)=>{
        if(error) {
          console.log('error:', error); // Print the error if one occurred
          reject(error);
        }
        else {
          resolve({response, body});
        }
      });
    }catch{
      reject("Couldn't get_create_entity");
    }
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
  var upload = new Promise(async(resolve, reject)=>{
    body = `{"Title":"${title}","Extension":".${extension}","_content":"${content}"}`;
    try{
      response = await create_entity('Document', body);
      resolve(response);
    } catch{
      console.log("Didn' upload document correctly.");
      reject("Didn't upload document", title);
    }
});
    return upload;
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
async function upload_document_with_tag(title, extension, content, tag, Document_Date){
  var doc_response = new Promise(async(resolve, reject)=>{
    body = `{"Title":"${title}","Extension":".${extension}","_content":"${content}", "Documentcategories":[{"id":"${tag}", "es":"L_Document_categories"}], "Documentdate":"${Document_Date}" }`;
    try{
      response = await create_entity('Document', body);
      resolve(response);
    } catch{
      reject(`ERROR: The document ${title} wasn't uploaded correctly.\n response: ${response}  \n URI: Document `);
      fs.appendFile("error.txt", `ERROR: The document ${title} wasn't uploaded correctly.\n response: ${response}  \n URI: Document`, (err) => {
        if (err) throw err;
      });
    }
  });
  return doc_response;
}



/*
  Gets an array of all funds.
  Internal Helper Function. Do not touch.
*/
async function get_entity_ids_pagination(entity){
  
  var entities = new Promise(async(resolve, reject)=>{
    try{
      response = await get_create_entity(entity);
      let j = JSON.parse(response.body);
      let data = j.data;
      let links = j.links;
      if(data != undefined){  
        resolve({data, links});
        }
        else{
          reject("Data is undefined");
        }
    }
    catch{
      //Catches if the data isn't a JSON object.
      //UnhandledPromiseRejectionWarning: SyntaxError: Unexpected token < in JSON at position 0
      reject("Data is undefined! ");
    }

  });
  return entities;
}





/*
  Gets an array of all funds.
  Internal Helper Function. Do not touch.
*/
async function get_entity_ids(entity){
  var entities = new Promise(async(resolve, reject)=>{
    response = await get_create_entity(entity);
    try{
      let j = JSON.parse(response.body);
      let data = j.data;
      if(data != undefined){  
      resolve(data);
      }
      else{
        reject("Data is undefined");
      }
    }
    catch{
      reject("Data-JSON is undefined");
    }
});
  return entities;
}

/*
  Gets the entity ID that is associated with the entity name.
                  Parameter: entity_name      => Name of Entity
*/
async function get_id(entity_id, entity_name){
  // console.log("Getting entity id.");
  let entity_info = new Promise(async(resolve, reject)=>{
    var cont = 1;
    var entity_link = entity_id;
    while(cont){
      try{
        let entitys_links = await get_entity_ids_pagination(entity_link);

        var entitys = entitys_links.data;
        var links = entitys_links.links;
        for (let i = 0; i<entitys.length; i++) {
            console.log(entitys[i].Identifier)
          if(entitys[i].Identifier == entity_name){
            // console.log(`Found the ${entity_id} id for ${entity_name}: ${entitys[i]._id}`);
            resolve(entitys[i]._id);
            return(entitys[i]._id);
          }
        }
          if(links.next != null){
            var next_link = links.next.split("?");
            entity_link = `${entity_id}/?${next_link[1]}`;
            // console.log("entity LINK ", entity_link);
          }
          else{
        // console.log("KEY: ", key);
        // console.log(`couldn't find ${entity_name} you are looking for.`);
            reject(`couldn't find ${entity_name} you are looking for.`);
            cont = 0;
        }
      }
      catch{
        //nothing
      }
    } 
  });
  return entity_info;
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
module.exports.get_id = get_id;
module.exports.get_relation = get_relation;
module.exports.upload_document_with_tag = upload_document_with_tag;
module.exports.Document_relate = Document_relate;
module.exports.array_of_relations = array_of_relations;



