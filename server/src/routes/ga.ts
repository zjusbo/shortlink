// Copyright 2018 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { GoogleAuth } = require("google-auth-library");

let client;

async function init() {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/analytics.readonly",
  });
  client = await auth.getClient();
}

/**
 * get access token. The library handles refreshing.
 * by default, the token lasts for one hour
 * Source code: https://github.com/googleapis/google-auth-library-nodejs/blob/master/src/auth/oauth2client.ts#L703
 *
 */
export async function getAccessToken(): Promise<string> {
  if (!client) {
    await init();
  }
  return (await client.getAccessToken()).token;
}

init().catch(console.error);
