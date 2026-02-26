const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('resume.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
});
