const { Buffer } = require('buffer');
const Through    = require('through2');

const convertData = function (file, encoding, callback) {
    let contents  = file.contents.toString();
    let json      = JSON.parse(contents)['_default'];
    let stem      = file.relative.split('.')[0];
    contents      = 'this.DATA = this.DATA || {}; this.DATA["' + stem + '"] = '
        + JSON.stringify(Object.values(json)) + ';';

    file.contents = Buffer.from(contents);
    file.path     = file.path.replace('.json', '.js');

    this.push(file);
    callback();
};

module.exports = function () {
    return Through.obj(convertData);
};
