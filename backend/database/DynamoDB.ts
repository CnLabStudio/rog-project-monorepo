"use strict";

import { DynamoDB } from "aws-sdk";
// uncommon on local test use
// import dotenv from "dotenv";
// dotenv.config();

let options = {};

// connect to local DB if running offline
if (process.env.IS_OFFLINE) {
    options = {
        region: process.env.REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
        },
    };
}

export const client = new DynamoDB.DocumentClient(options);
