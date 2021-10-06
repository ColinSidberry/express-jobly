"use strict";

const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate, queryToSQLWhereClause } = require("./sql");
const { SECRET_KEY } = require("../config");


describe("convertInputToSql", function () {
    test("works: company update", function () {
        const input = {
            "name": "Hall-Davis1",
            "description": "A company that designs halls",
            "numEmployees": 65
        }
        const jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        }
        const output = sqlForPartialUpdate(input, jsToSql);
        expect(output).toEqual({
            setCols: '"name"=$1, "description"=$2, "num_employees"=$3',
            values: ['Hall-Davis1', 'A company that designs halls', 65]
        });
    });

    test("works: user update", function () {
        const input = {
            "firstName": "Lizzy",
            "lastName": "Ahler",
            "email": "email@email.com"
        }
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        const output = sqlForPartialUpdate(input, jsToSql);
        expect(output).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2, "email"=$3',
            values: ['Lizzy', 'Ahler', "email@email.com"]
        });
    });
});


describe("test query inputs to SQL WHERE clause", function () {
    test("works: user update", function () {
        const input = {
            "name": "testName",
            "minEmployees": 1,
            "maxEmployees": 100
        };

        const output = queryToSQLWhereClause(input);//FIXME: Change when help function is written
        expect(output).toEqual({
            whereClauseStr: 'WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3',
            values: ['%testName%', 1, 100]
        });
    });

    test("works: user update", function () {
        const input = {
            "minEmployees": 1,
            "name": "testName"
        };

        const output = queryToSQLWhereClause(input);
        expect(output).toEqual({
            whereClauseStr: 'WHERE name ILIKE $2 AND num_employees >= $1',
            values: [1, '%testName%']
        });
    });

    test("works: user update", function () {
        const input = {
            "maxEmployees": 100
        };

        const output = queryToSQLWhereClause(input);
        expect(output).toEqual({
            whereClauseStr: 'WHERE num_employees <= $1',
            values: [100]
        });
    });
});