const { convert } = require('html-to-text');
const Hapi = require('@hapi/hapi');
const delay = require('delay');
const bodyParser = require('body-parser');
const rp = require('request-promise');
var url = require('url');
const request_ = require('request');
const fs = require('fs');
const PDFGenerator = require('pdfkit');
const { callbackify } = require('util');
const num = 3;

const findMostFrequent = (str = '', num = 1) => {
   const strArr = str.split(' ');
   const map = {};
   strArr.forEach(word => {
      if(word.length > 3){
        if(map.hasOwnProperty(word)){
            map[word]++;
        }else{
            map[word] = 1;
        }
      }
   });
   const frequencyArr = Object.keys(map).map(key => [key, map[key]]);
   frequencyArr.sort((a, b) => b[1] - a[1]);
   return frequencyArr.slice(0, num).map(el => el[0]);
};
async function createserver(){
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
 });
 await server.register(require('@hapi/inert'));
 return server;
}

async function str_create(key) {
  var res_str = "";
  var a = await rp(key, function (err, res, body) {
    var text = convert(body, { wordwrap: 130 })
    var url_str = key.toString();
    var words_str = findMostFrequent(text, 3).toString();
    res_str = url_str + " -> " + words_str + "\n\n";
  });
  return res_str;
}

async function process_request(request) {
  let theOutput = new PDFGenerator
  theOutput.pipe(fs.createWriteStream('./output.pdf'))
  theOutput.font('./fonts/DejaVuSans.ttf')
  var result_str = "";
  const searchParams = new URLSearchParams(request.url.search);
  for (const key of searchParams.values()) {
    result_str += await str_create(key);
  }
  theOutput.text(result_str)
  theOutput.end()
}

const start = async () => {
  server = await createserver()
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, hnd) => {
        return 'Hello!';
    }
  });

  server.route ({
    method: 'POST',
    path: '/',
    handler: async (request, hnd) => {
       await process_request(request);
       await delay(10);
       return hnd.file('./output.pdf')       
    }
    
});
  await server.start();
  console.log('Server running at', server.info.uri);
};
 
process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
start();
