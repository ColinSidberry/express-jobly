"use strict";
const { BadRequestError } = require("../expressError");

/** Helper Function: Convert JS input data to sql data for update requests.
 *
 * Allows users to input only the JSON data for the keys and
 * values that they want to update. If input column names are camelCase, this converts them to snake_case. 
 * Returns object of columns to change and their new values (see example below)
 *
 * Ex input: { "name": "Hall-Davis1", "description": "A company that designs halls", "numEmployees": 65} ====>
 *    output: {setCols: ' "name"=$1, "description"=$2, "num_employees"=$3 ',  
 *            values:[ 'Hall-Davis1', 'A company that designs halls', 65 ]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  
  const keys = Object.keys(dataToUpdate);

  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
