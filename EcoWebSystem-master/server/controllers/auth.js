const pool = require('../../db-config/mysql-config');
const isEmpty = require('is-empty');

const login = (req, res) => {
  const { login, password } = req.body;

  const query = `
    SELECT
      user.user_name,
      user.id_of_expert,
      user.id_of_user,
      expert.expert_name,
      expert.expert_FIO
    FROM user
    INNER JOIN expert ON user.id_of_expert = expert.id_of_expert
    WHERE user.user_name = '${login}' AND user.password = '${password}'
    LIMIT 1;`;

  return pool.query(query, [], (error, rows) => {
    if (error) {
      return res.status(500).send({
        message: error,
      });
    }

    if (!isEmpty(rows)) {
      const row = rows[0];
      const response = {
        user_name: row.user_name,
        id_of_expert: row.id_of_expert,
        id_of_user: row.id_of_user,
        expert_name: row.expert_name,
        FIO: row.expert_FIO,
      };

      return res.send(JSON.stringify(response));
    } else {
      return res.status(202).send();
    }
  });
};

module.exports = {
  login,
};
