import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.post("/", function(req, res) {
  console.log(req);
});

app.listen(port, function() {
  console.log("app listening on ", port);
});
