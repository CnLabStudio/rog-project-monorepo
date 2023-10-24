import { expect } from "chai";
import { eventJSON } from "../event";
import { mint } from "../handler";

describe('Lambda and DynamoDB Integration test', () => {

  /**
   * Note have an entry in the database with id 1. 
   * If the entry is not there the test case would fail for the first time.
   */
  describe('Lambda handler', () => {
    it('should put an item in the dynamodb table', async () => {

      const result: any = await mint(eventJSON);

      // Assert that the response from the Lambda handler is successful
      expect(result.statusCode).equal(200);

    });
  });
});