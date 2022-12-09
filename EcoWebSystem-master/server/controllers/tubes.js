const { response } = require('express');
const pool = require('../../db-config/mysql-config');

const addTube = async (req, res) => {
  let query = `
    SET @poliId:=;
    INSERT INTO poligon(
        Id_of_poligon ,
        line_collor_r ,
        line_color_g ,
        line_color_b ,
        line_alfa ,
        line_thickness ,
        name ,
        id_of_user ,
        type ,
        description) values(
            (select max(Id_of_poligon) from poligon)+1,
            ${req.body.line_collor_r},
            ${req.body.line_color_g},
            ${req.body.line_color_b},
            ${req.body.line_alfa},
            ${req.body.line_thickness},
            "${req.body.name}",
            ${req.body.id_of_user},
            "${req.body.type}",
            "${req.body.description}"
        );`;
  let Points = `
    INSERT into point_poligon(
        latitude,
        longitude,
        Id_of_poligon,
        order123) values 
        ${req.body.points.map(
          (el) => `(${el.longitude},${el.latitude},@poliId,${el.order123})`
        )}
    `;

  let resQuery = query + Points;
  pool.query(resQuery, (err) => {
    if (err) {
      console.log(err);
      console.log(query + Points);
      res.status(500).send({ message: err });
    } else {
      res.status(200).send({ message: 'OK' });
    }
  });
};

const getTube = async (req, res) => {
  const id = req.params.id;
  const tubePromise = new Promise((resolve, reject) => {
    const tableName = 'poligon';

    const query = `
          SELECT
          ??
          FROM
          ??
          WHERE
          ?? = ?
        `;

    const values = [
      [
        'brush_color_r',
        'bruch_color_g',
        'brush_color_b',
        'brush_alfa',
        'line_collor_r',
        'line_color_g',
        'line_color_b',
        'line_alfa',
        'line_thickness',
        'name',
        'id_of_user',
        'type',
        'description',
      ],
      tableName,
      'Id_of_poligon',
      id,
    ];

    pool.query(query, values, (error, rows) => {
      if (error) {
        reject(error);
      }

      if (rows[0]) {
        resolve(rows[0]);
      }
    });
  });

  return tubePromise
    .then((polygon) => res.send(polygon))
    .catch((error) => res.status(500).send({ message: error }));
};

const updateTube = (req, res) => {
  const id = req.params.id;
  const {
    brush_color_r,
    bruch_color_g,
    brush_color_b,
    brush_alfa,
    line_collor_r,
    line_color_g,
    line_color_b,
    line_alfa,
    line_thickness,
    name,
    description,
  } = req.body;

  const tubePromise = new Promise((resolve, reject) => {
    const tableName = 'poligon';
    const updatedValues = {
      brush_color_r,
      bruch_color_g,
      brush_color_b,
      brush_alfa,
      line_collor_r,
      line_color_g,
      line_color_b,
      line_alfa,
      line_thickness,
      name,
      description,
    };

    const query = `
        UPDATE
        ??
        SET
        ?
        WHERE
        ?? = ?
      `;

    const values = [tableName, updatedValues, 'Id_of_poligon', id];

    pool.query(query, values, (error, rows) => {
      if (error) {
        reject(error);
      }

      if (rows) {
        resolve();
      }
    });
  });

  return tubePromise
    .then(() => res.sendStatus(200))
    .catch((error) => res.status(500).send({ message: error }));
};

module.exports = {
  addTube,
  getTube,
  updateTube,
};
