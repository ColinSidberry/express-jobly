"use strict";
const { validateNumber } = require("../helpers/_utils");
const { BadRequestError } = require("../expressError");

describe("validateNumber", function () {

    test("works: strNum => num", function () {
        const num = validateNumber("10");
        expect(num).toEqual(10);
    });

    test("fail: str throws BadRequestError", function () {
        try {
            validateNumber("Not an integer");
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("fail: undefined => NaN", function () {
        const notANumber = validateNumber(undefined);
        expect(notANumber).toEqual(NaN);
    });
});