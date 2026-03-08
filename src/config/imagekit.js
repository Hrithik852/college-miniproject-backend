const ImageKit = require('@imagekit/nodejs');

const imagekit = new ImageKit({
    privateKey: process.env['IMAGE-KIT']
});

module.exports = imagekit;
