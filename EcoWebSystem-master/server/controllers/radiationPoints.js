const pool = require('../../db-config/mysql-config');

const iconsMapPromise = require('../utils/iconsMap')();

const getPoints = async (req, res) => {
  const query = `
    SELECT
        poi.Id,
        poi.id_of_user,
        poi.Coord_Lat,
        poi.Coord_Lng,
        poi.Description,
        poi.Name_object,
        poi.Type,
        type_of_object.id as Object_Type_Id,
        type_of_object.Name as Object_Type_Name,
        owner_type as owner_type_id, 
        owner_types.type as owner_type_name,
        user.id_of_expert
    FROM radiation_poi_calculation
    INNER JOIN poi ON radiation_poi_calculation.idPoi = poi.Id
    INNER JOIN type_of_object ON poi.Type = type_of_object.id
    INNER JOIN owner_types ON poi.owner_type = owner_types.id
    INNER JOIN user ON poi.id_of_user = user.id_of_user
    GROUP BY poi.Id;`;

  const pointsPromise = new Promise((resolve, reject) => {
    pool.query(query, (error, rows) => {
      if (error) {
        console.log(error);
        reject(error);
      }

      resolve(rows);
    });
  });
  try {
    const [points, iconsMap] = await Promise.all([
      pointsPromise,
      iconsMapPromise,
    ]);
    const mapped = points.map(
      ({
        Id,
        id_of_user,
        id_of_expert,
        owner_type_id,
        owner_type_name,
        Coord_Lat,
        Coord_Lng,
        Description,
        Name_object,
        Type,
        Object_Type_Id,
        Object_Type_Name,
      }) => {
        return {
          Id,
          id_of_user,
          id_of_expert,
          owner_type: {
            id: owner_type_id,
            name: owner_type_name,
          },
          coordinates: [Coord_Lat, Coord_Lng],
          Description,
          Name_object,
          Image: iconsMap.get(+Type),
          Object_Type_Id,
          Object_Type_Name,
        };
      }
    );
    return res.status(200).send(mapped);
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
};

module.exports = {
  getPoints,
};
