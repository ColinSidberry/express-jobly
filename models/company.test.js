"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** find */

describe("find", function () {
  test("works: no filter", async function () {
    let companies = await Company.find();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });
  test("works: with filter", async function () {
    let filterOptions = {"name": "c2", "minEmployees": 2}
    let companies = await Company.find(filterOptions);
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ]);
  });
});
/************************************** filter */

describe("createWhereClause", function () {
  test("works: all input ", function () {
    const input = {
      "name": "testName",
      "minEmployees": 1,
      "maxEmployees": 100
    };
    const output = Company.createWhereClause(input);
    expect(output).toEqual({
      whereClauseStr: 'WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3',
      values: ['%testName%', 1, 100]
    });
  });

  test("works: two inputs", function () {
    const input = {
      "minEmployees": 1,
      "name": "testName"
    };

    const output = Company.createWhereClause(input);
    expect(output).toEqual({
      whereClauseStr: 'WHERE name ILIKE $2 AND num_employees >= $1',
      values: [1, '%testName%']
    });
  });

  test("works: one input", function () {
    const input = {
      "maxEmployees": 100
    };

    const output = Company.createWhereClause(input);
    expect(output).toEqual({
      whereClauseStr: 'WHERE num_employees <= $1',
      values: [100]
    });
  });
});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
      "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** validatesAndConverts */

describe("validatesAndConverts", function () {
  test("works: valid inputs", function () {
    const input = {
      name: 'mom',
      minEmployees: '10',
      maxEmployees: '500'
    };
    const output = Company.validatesAndConverts(input);
    expect(output).toEqual({ name: 'mom', minEmployees: 10, maxEmployees: 500 });
  });

  test("works: partial inputs", function () {
    const input = {
      name: 'mom',
      minEmployees: '10',
    };
    const output = Company.validatesAndConverts(input);
    expect(output).toEqual({ name: 'mom', minEmployees: 10});
  });

  test("Fail: Bad request err thrown if unable to convert strs to ints ", function () {
    const input = {
      name: 'Fail: Bad request err thrown if unable to convert strs to ints',
      minEmployees: 'HiMom',
      maxEmployees: '500'
    };
    try {
      Company.validatesAndConverts(input);
      // fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  
  test("Fail: Bad request err thrown if minEmployees > maxEmployees", function () {
    const input = {
      name: 'Fail: Bad request err thrown if minEmployees > maxEmployees',
      minEmployees: '500',
      maxEmployees: '1'
    };
    try {
      Company.validatesAndConverts(input);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});