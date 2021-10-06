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

function queryToSQLWhereClause(filterOptions) {
  const { name, minEmployees, maxEmployees } = filterOptions;
  const keys = Object.keys(filterOptions);
  console.log("keys from queryToSQLWhereClause in sql.js from helpers: ", keys);
  console.log("keys.findIndex(name) from queryToSQLWhereClause in sql.js from helpers: ", keys.indexOf('name'));
  let values = Object.values(filterOptions);
  // let whereClause = "WHERE ";
  let whereClauseArr = [];
  whereClauseArr.push(name ? `name ILIKE $${keys.indexOf('name')+1}` : "");
  whereClauseArr.push(minEmployees ? `num_employees >= $${keys.indexOf('minEmployees')+1}` : "");
  whereClauseArr.push(maxEmployees ? `num_employees <= $${keys.indexOf('maxEmployees')+1}` : "");

  whereClauseArr = whereClauseArr.filter(clause => clause !== "");
  let whereClauseStr = whereClauseArr.join(" AND ");
  whereClauseStr = "WHERE " + whereClauseStr;

  if (name) {
    values[keys.indexOf('name')] = `%${name}%`;
  }
  //make array of keys
  //if key is name

  // if name provide 
  //result = "where clause with name"
  // if min provided
  //result append to where clause min 

  return {
    whereClauseStr,
    values
  };
}

module.exports = {
  sqlForPartialUpdate,
  queryToSQLWhereClause
};
