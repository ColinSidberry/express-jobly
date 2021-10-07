"use strict";

const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate} = require("./sql");
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


