const config = {
    'site.name': 'Occupational Outlook Handbook',
    'site.url': 'http://ooh.gov',
    'site.shorturl': 'ooh.gov',
    'env': {
        'view engine': 'pug',
        'views': './views'
    }
};

/**
 * Retrieves value for a given configuration key.
 * @param {string} key
 * @returns {any}
 *
 * @throws {ReferenceError}
 */
const get = function (key) {
    if (key in config == false) {
        throw new ReferenceError('No config value for key: ' + key);
    }

    return config[key];
};

module.exports.get = get;
