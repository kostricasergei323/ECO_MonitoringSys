const pool = require('../../db-config/mysql-config');
const { noLockQuery } = require('../utils/helpers');

const {
  insertEmissionOnMap,
  getEmissionsOnMap,
  SOURCE_POLYGON,
} = require('./emissionsOnMap');

const mapPolygonPoints = (polygonPoints, idOfPolygon) => {
  return polygonPoints
    .filter(({ Id_of_poligon }) => Id_of_poligon === idOfPolygon)
    .map(({ latitude, longitude }) => [longitude, latitude]);
};

const getPolygons = (req, res) => {
  const { idEnvironment } = req.query;

  const queryGetPolygons = `
    SELECT 
      poligon.id_of_poligon,
      poligon.brush_color_r,
      poligon.bruch_color_g,
      poligon.brush_color_b,
      poligon.brush_alfa,
      poligon.line_collor_r,
      poligon.line_color_g,
      poligon.line_color_b,
      poligon.line_alfa,
      poligon.line_thickness,
      poligon.name,
      poligon.type,
      poligon.id_of_user,
      user.user_name,
      user.id_of_expert,
      emissions_on_map.idEnvironment
    FROM poligon
      INNER JOIN user ON poligon.id_of_user = user.id_of_user
      LEFT JOIN emissions_on_map ON poligon.id_of_poligon = emissions_on_map.idPoligon
    ;
  `;

  let queryGetPolygonPoints = `
    SELECT
      point_poligon.longitude,
      point_poligon.latitude,
      point_poligon.Id_of_poligon
    FROM point_poligon
    ORDER BY
      point_poligon.Id_of_poligon ASC,
      point_poligon.order123 ASC;
  `;

  const getPolygonsPromise = new Promise((resolve, reject) => {
    pool.query(queryGetPolygons, (error, polygons) => {
      if (error) {
        reject(error);
      }

      return resolve(polygons);
    });
  });

  const getPolygonPointsPromise = new Promise((resolve, reject) => {
    pool.query(queryGetPolygonPoints, (error, polygonPoints) => {
      if (error) {
        reject(error);
      }

      return resolve(polygonPoints);
    });
  });

  return Promise.all([getPolygonsPromise, getPolygonPointsPromise])
    .then(([polygons, polygonPoints]) => {
      return polygons.map((polygon) => {
        const mappedPolygonPoints = mapPolygonPoints(
          polygonPoints,
          polygon.id_of_poligon
        );

        return {
          poligonId: polygon.id_of_poligon,
          brushAlfa: polygon.brush_alfa,
          brushColorR: polygon.brush_color_r,
          brushColorG: polygon.bruch_color_g,
          brushColorB: polygon.brush_color_b,
          lineAlfa: polygon.line_alfa,
          lineCollorR: polygon.line_collor_r,
          lineColorB: polygon.line_color_b,
          lineColorG: polygon.line_color_g,
          lineThickness: polygon.line_thickness,
          name: polygon.name,
          type: polygon.type,
          polygonPoints: mappedPolygonPoints,
          id_of_user: polygon.id_of_user,
          user_name: polygon.user_name,
          id_of_expert: polygon.id_of_expert,
          idEnvironment: polygon.idEnvironment,
        };
      });
    })
    .then((mappedPolygons) => {
      const mappedPolygonsPromises = mappedPolygons.map(async (polygon) => {
        const emissionsOnMapPromise = getEmissionsOnMap(
          SOURCE_POLYGON,
          polygon.poligonId,
          idEnvironment
        );
        const emissions = await emissionsOnMapPromise;
        return {
          ...polygon,
          emissions,
          Environments: [],
        };
      });

      return Promise.all(mappedPolygonsPromises).then((polygons) =>
        res.send(polygons)
      );
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({
        message: error,
      });
    });
};

const getAdvancedPolygons = (req, res) => {
  const { idEnvironment } = req.query;

  let whereClause = {
    experts: '',
    env: '',
    issue: '',
  };
  if (req.query.env) {
    whereClause.env = 'and (';
    req.query.env.forEach((el, i) => {
      whereClause.env +=
        i == req.query.env.length - 1
          ? `emissions_on_map.idEnvironment = ${el})`
          : `emissions_on_map.idEnvironment = ${el} or `;
    });
  }
  if (req.query.experts) {
    whereClause.experts = 'and (';
    req.query.experts.forEach((el, i) => {
      whereClause.experts +=
        i == req.query.experts.length - 1
          ? `user.id_of_expert = ${el})`
          : `user.id_of_expert = ${el} or `;
    });
  }
  if (req.query.issue) {
    whereClause.issue = 'and (';
    req.query.issue.forEach((el, i) => {
      whereClause.issue +=
        i == req.query.issue.length - 1
          ? `map_object_dependencies.id_of_ref = ${el});`
          : `map_object_dependencies.id_of_ref = ${el} or `;
    });
  }

  const queryGetPolygons = `
    SELECT 
      poligon.id_of_poligon,
      poligon.brush_color_r,
      poligon.bruch_color_g,
      poligon.brush_color_b,
      poligon.brush_alfa,
      poligon.line_collor_r,
      poligon.line_color_g,
      poligon.line_color_b,
      poligon.line_alfa,
      poligon.line_thickness,
      poligon.name,
      poligon.type,
      poligon.id_of_user,
      user.user_name,
      user.id_of_expert 
    FROM poligon
      INNER JOIN user ON poligon.id_of_user = user.id_of_user
      ${
        req.query.env
          ? 'INNER JOIN emissions_on_map ON poligon.id_of_poligon = emissions_on_map.idPoligon'
          : ''
      }
      ${
        req.query.issue
          ? 'LEFT JOIN map_object_dependencies on poligon.id_of_poligon =  map_object_dependencies.id_of_object'
          : ''
      }
      WHERE poligon.type='polygon'
      ${whereClause.env}
      ${whereClause.experts}
      ${whereClause.issue}
    ;
  `;

  let queryGetPolygonPoints = `
    SELECT
      point_poligon.longitude,
      point_poligon.latitude,
      point_poligon.Id_of_poligon
    FROM point_poligon
    ORDER BY
      point_poligon.Id_of_poligon ASC,
      point_poligon.order123 ASC;
  `;

  const getPolygonsPromise = new Promise((resolve, reject) => {
    pool.query(queryGetPolygons, (error, polygons) => {
      if (error) {
        reject(error);
      }

      return resolve(polygons);
    });
  });

  const getPolygonPointsPromise = new Promise((resolve, reject) => {
    pool.query(queryGetPolygonPoints, (error, polygonPoints) => {
      if (error) {
        reject(error);
      }

      return resolve(polygonPoints);
    });
  });

  return Promise.all([getPolygonsPromise, getPolygonPointsPromise])
    .then(([polygons, polygonPoints]) => {
      return polygons.map((polygon) => {
        const mappedPolygonPoints = mapPolygonPoints(
          polygonPoints,
          polygon.id_of_poligon
        );

        return {
          poligonId: polygon.id_of_poligon,
          brushAlfa: polygon.brush_alfa,
          brushColorR: polygon.brush_color_r,
          brushColorG: polygon.bruch_color_g,
          brushColorB: polygon.brush_color_b,
          lineAlfa: polygon.line_alfa,
          lineCollorR: polygon.line_collor_r,
          lineColorB: polygon.line_color_b,
          lineColorG: polygon.line_color_g,
          lineThickness: polygon.line_thickness,
          name: polygon.name,
          type: polygon.type,
          polygonPoints: mappedPolygonPoints,
          id_of_user: polygon.id_of_user,
          user_name: polygon.user_name,
          id_of_expert: polygon.id_of_expert,
          idEnvironment: polygon.idEnvironment,
        };
      });
    })
    .then((mappedPolygons) => {
      const mappedPolygonsPromises = mappedPolygons.map((polygon) => {
        const emissionsOnMapPromise = getEmissionsOnMap(
          SOURCE_POLYGON,
          polygon.poligonId,
          req.query.env ? req.query.env : null
        );
        return emissionsOnMapPromise.then((emissions) => ({
          ...polygon,
          emissions,
          Environments: req.query.env ? req.query.env : [],
        }));
      });

      return Promise.all(mappedPolygonsPromises).then((polygons) =>
        res.send(polygons)
      );
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({
        message: error,
      });
    });
};

const addPolygon = (req, res) => {
  const lastIdPromise = new Promise((resolve, reject) => {
    const lastIdQuery = `
    SELECT
      MAX(??) as maxId
    FROM ??
    ;`;

    pool.query(lastIdQuery, ['id_of_poligon', 'poligon'], (error, rows) => {
      if (error) {
        reject(error);
      }

      resolve(rows[0].maxId);
    });
  });

  lastIdPromise
    .then((maxId) => {
      const id = maxId + 1;
      const { points, emission, ...values } = req.body;

      const insertPolygonPromise = new Promise((resolve, reject) => {
        const insertPolygonQuery = `
        INSERT INTO
        ??
        VALUES
        (?)
      `;

        pool.query(
          insertPolygonQuery,
          ['poligon', [id, ...Object.values(values)]],
          (error) => {
            if (error) {
              reject(error);
            }

            resolve(id);
          }
        );
      });

      return insertPolygonPromise.then((id) => id);
    })
    .then((id) => {
      const { emission } = req.body;

      if (!!emission) {
        emission.idPolygon = id;
        return insertEmissionOnMap(SOURCE_POLYGON, emission).then(() => id);
      }

      return id;
    })
    .then((id) => {
      const { points } = req.body;
      const insertPolygonPointsPromises = points.map(
        ({ latitude, longitude, order123 }) => {
          return new Promise((resolve, reject) => {
            const insertPolygonPointsQuery = `
          INSERT INTO
          ??
          VALUES
          (?)
          `;
            pool.query(
              insertPolygonPointsQuery,
              ['point_poligon', [latitude, longitude, id, order123]],
              (error) => {
                if (error) {
                  reject(error);
                }

                resolve();
              }
            );
          });
        }
      );

      return Promise.all(insertPolygonPointsPromises);
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      res.status(500).send({
        message: error,
      });
    });
};

const getPolygon = (req, res) => {
  const id = req.params.id;
  const polygonPromise = new Promise((resolve, reject) => {
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

  return polygonPromise
    .then((polygon) => res.send(polygon))
    .catch((error) => res.status(500).send({ message: error }));
};

const updatePolygon = (req, res) => {
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
    emission,
  } = req.body;

  const polygonPromise = new Promise((resolve, reject) => {
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

  return polygonPromise
    .then(() => {
      if (!!emission) {
        emission.idPolygon = +id;
        return insertEmissionOnMap(SOURCE_POLYGON, emission);
      }
    })
    .then(() => res.sendStatus(200))
    .catch((error) => res.status(500).send({ message: error }));
};

module.exports = {
  getPolygons,
  getAdvancedPolygons,
  addPolygon,
  getPolygon,
  updatePolygon,
};
