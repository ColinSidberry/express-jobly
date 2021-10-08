"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ id, title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT id
           FROM jobs
           WHERE id = $1`,
      [id]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${id}`);

    const result = await db.query(
      `INSERT INTO jobs(
          id,
          title,
          salary,
          equity,
          company_handle)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        id,
        title,
        salary,
        equity,
        companyHandle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Returns all jobs
   * 
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {

    const jobsRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity AS "numEmployees",
                company_handle AS "companyHandle"
           FROM companies
           ORDER BY title`);
    return jobsRes.rows;
  }



  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT j.id,
                j.title,
                j.salary,
                j.equity,
                j.company_handle AS "companyHandle",
                c.name, 
                c.description, 
                c.numEmployees, 
                c.logoUrl
           FROM jobs AS j
           JOIN companies AS c ON j.company_handle = c.handle
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return {
      id: job.id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      company: {
        handle: job.handle,
        name: job.name,
        description: job.description,
        numEmployees: job.numEmployees,
        logoUrl: job.logoUrl
      }
    };
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}





module.exports = Job;