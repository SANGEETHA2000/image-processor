const { v4: uuidv4 } = require('uuid');

exports.generateRequestId = () => {
    return uuidv4();
};