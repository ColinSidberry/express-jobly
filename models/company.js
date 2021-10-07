"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { validateNumber } = require("../helpers/_utils");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Returns companies based on filtered options.
   * Returns all companies if no filter given.
   * 
   * Takes in {name, minEmployees, maxEmployees} or undefined for filter options.
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async find(validatedFilterOptions) {
    let whereClauseStr;
    let values;

    if (validatedFilterOptions === undefined) {
      whereClauseStr = "";
      values = [];
    }
    else {
      whereClauseStr = Company.createWhereClause(validatedFilterOptions).whereClauseStr
      values = Company.createWhereClause(validatedFilterOptions).values
    }

    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ${whereClauseStr}
           ORDER BY name`, values);
    return companiesRes.rows;
  }


  /** createWhereClause method: Convert JS input data to sql where clause for validatedFilterOptions.
   *
   * Takes in validatedFilterOptions data and converts it to the SQL WHERE condition. 
   * Returns an object of SQL to input in the query and it's values
   *
   * Ex input: {"name": "testName", "minEmployees": 1,"maxEmployees": 100} ====>
   *    output: {whereClauseStr: 'WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3',
              values: ['%testName%', 1, 100]}
   */

  static createWhereClause(validatedFilterOptions) {
    const { name, minEmployees, maxEmployees } = validatedFilterOptions;
    const keys = Object.keys(validatedFilterOptions);

    let values = Object.values(validatedFilterOptions);

    let parts = [];
    parts.push(
        name ? `name ILIKE $${keys.indexOf('name') + 1}` : "");
    parts.push(
        minEmployees ? `num_employees >= $${keys.indexOf('minEmployees') + 1}` : "");
    parts.push(
        maxEmployees ? `num_employees <= $${keys.indexOf('maxEmployees') + 1}` : "");

    parts = parts.filter(clause => clause !== "");
    let whereClauseStr = parts.join(" AND ");
    whereClauseStr = "WHERE " + whereClauseStr;

    if (name) {
      values[keys.indexOf('name')] = `%${name}%`;
    }

    return {
      whereClauseStr,
      values
    };
  }


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }


  /** Checks if inputs meet min requirements:
   * -  minEmployee converts to int
   * -  maxEmployee converts to int
   * -  maxEmployee > minEmployee
   *  else throws NotFoundError
   *  
   *  input: { name: 'mom', minEmployees: '10', maxEmployees: '500' } ==> 
   *  output: { name: 'mom', minEmployees: 10, maxEmployees: 500 }
   **/

  static validatesAndConverts(filterOptions) {
    let { name, minEmployees, maxEmployees } = filterOptions;

    let validatedFilterOptions = {};

    minEmployees = validateNumber(minEmployees);
    maxEmployees = validateNumber(maxEmployees);

    if (minEmployees > maxEmployees) {
      throw new BadRequestError("MinEmployees must be less than or equal to maxEmployees")
    }

    //Question: IS it best practice to be explicit here and say name !== undefined 
    // or can we rely on the JS truthy/falsey values?
    if (name) validatedFilterOptions['name'] = name;
    if (minEmployees || minEmployees === 0) validatedFilterOptions['minEmployees'] = minEmployees;
    // if (!minEmployees.isNaN())
    // if (minEmployees != NaN)
    if (maxEmployees || maxEmployees === 0) validatedFilterOptions['maxEmployees'] = maxEmployees;

    return validatedFilterOptions;
  }
}





module.exports = Company;
