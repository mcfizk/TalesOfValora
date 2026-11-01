const fs=require('node:fs'),path=require('node:path');
const directory=path.resolve(__dirname,'../QA');fs.mkdirSync(directory,{recursive:true});module.exports=directory;
