const dotenv = require("dotenv");
dotenv.config();

export default {
  db: process.env.DBG_DB,
  token: process.env.DBG_TOKEN
}
