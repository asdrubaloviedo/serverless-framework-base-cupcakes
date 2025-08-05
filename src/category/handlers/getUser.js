require('module-alias/register');

const hello = async (event, context) => {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const seconds = new Date().getSeconds();
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hola mundo - ${hour}:${minute}:${seconds}`
    })
  };
};

module.exports = {
  hello
};
