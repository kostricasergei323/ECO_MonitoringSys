const pool = require('../../db-config/mysql-config');
const { removeDuplicates } = require('../utils/duplicateRemover');

const getTasks = (req, res) => {
  pool.query(
    `select id_of_object,  (select issues.name from issues where issue_id = map_object_dependencies.id_of_ref) as name from map_object_dependencies where type_obj=0 and type_rel=0;`,
    (err, rows) => {
      if (err) {
        console.log(err);
      } else {
        res.send(rows);
      }
    }
  );
};

const getCalculationsInfo = (req, res) => {
  pool.query(
    `SELECT calculations_description.calculation_name, calculations_result.date_of_calculation, formulas.name_of_formula , calculations_result.result  FROM map_object_dependencies 
            inner join calculations_result on map_object_dependencies.id_of_ref = calculations_result.calculation_number
            inner join calculations_description on calculations_description.calculation_number = calculations_result.calculation_number
            inner join formulas on formulas.id_of_formula = calculations_result.id_of_formula
             where map_object_dependencies.id_of_object = ${req.params.id} and map_object_dependencies.type_rel =1;`,
    (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).send({
          message: 'err',
        });
      } else {
        res.send(
          rows.map((el) => {
            return {
              name: el.calculation_name,
              date: el.date_of_calculation,
              formula: el.name_of_formula,
              result: el.result,
            };
          })
        );
      }
    }
  );
};

const getPossibleTasks = (req, res) => {
  let whereClause = {
    experts: '',
    env: '',
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

  pool.query(
    `SELECT DISTINCT
                issues.issue_id,
                issues.name
              FROM  poi
              INNER JOIN user ON poi.id_of_user = user.id_of_user
              ${
                req.query.env
                  ? 'INNER JOIN emissions_on_map ON  poi.Id = emissions_on_map.idPoi'
                  : ''
              }
              INNER JOIN map_object_dependencies on poi.Id = map_object_dependencies.id_of_object
              INNER JOIN issues on map_object_dependencies.id_of_ref = issues.issue_id
              WHERE map_object_dependencies.type_obj=0 
              ${whereClause.env}
              ${whereClause.experts};
              
              SELECT DISTINCT
                issues.issue_id,
                issues.name
              FROM  poligon
              INNER JOIN user ON poligon.id_of_user = user.id_of_user
              ${
                req.query.env
                  ? 'INNER JOIN emissions_on_map ON  poligon.Id_of_poligon = emissions_on_map.idPoligon'
                  : ''
              }
              INNER JOIN map_object_dependencies on poligon.Id_of_poligon = map_object_dependencies.id_of_object
              INNER JOIN issues on map_object_dependencies.id_of_ref = issues.issue_id
              WHERE map_object_dependencies.type_obj=1
              ${whereClause.env}
              ${whereClause.experts} 
              `,
    (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).send({ err: 'Problem loading data' });
      } else {
        res.status(200).send(removeDuplicates(rows[0].concat(rows[1])));
      }
    }
  );
};

module.exports = {
  getTasks,
  getCalculationsInfo,
  getPossibleTasks,
};
