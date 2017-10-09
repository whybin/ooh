const { Buffer } = require('buffer');
const Through    = require('through2');

const convertData = function (file, encoding, callback) {
    let contents  = file.contents.toString();
    let json      = JSON.parse(contents)['_default'];
    let data      = [];
    for (let i in json) {
        data.push(json[i]);
    }

    contents      = JSON.stringify(data);
    file.contents = Buffer.from(contents);
    file.path     = file.path.replace('.json', '.js');


    this.push(file);
    callback();
};

module.exports = function () {
    return Through.obj(convertData);
};
