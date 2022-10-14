const pool = require('../../db-config/mysql-config');

const getCities = (req, res) => {
  pool.query('SELECT Name, Longitude, Latitude FROM cities', (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      res.send(
        rows.map((el) => ({
          Name: el.Name,
          lon: el.Longitude,
          lat: el.Latitude,
        }))
      );
    }
  });
};

module.exports = {
  getCities,
};
