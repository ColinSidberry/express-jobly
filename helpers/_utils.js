"use strict";

const { BadRequestError } = require("../expressError");

/* Takes in string input. 
  Checks to see if input is undefined and can be a valid integer.
  If false => throws err
  else => returns integer value. 
  */

function validateNumber(str) {
    if (str !== undefined && Number(str) !== Number(str)) {
        throw new BadRequestError("Given input must be an integer");
    }

    return Number(str);

}

module.exports = {validateNumber};