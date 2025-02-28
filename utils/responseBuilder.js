exports.buildResponse = (success, message, data = null) => {
    const response = {
        success,
        message
    };
  
    if (data) {
        response.data = data;
    }
  
    return response;
};