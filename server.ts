/**
 * This is the starting point of the app.
 * Take note that we are using
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { engine as handlebarsEngine } from "express-handlebars";

import defaultRouter from "./routes/default-routes";

const PORT = process.env.PORT || 8686;
// const client_id = process.env.SPOTIFY_CLIENT_ID;
// const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
// const redirect_uri = `http://localhost:${PORT}/callback`; // Your redirect uri

// var access_token = "";
// var refresh_token = "";

var app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(cors())
  .use(cookieParser())
  .set("views", path.join(__dirname, "views"))
  .engine("handlebars", handlebarsEngine())
  .set("view engine", "handlebars") //Sets our app to use the handlebars engine
  .use("/", defaultRouter);

console.log("Listening on " + PORT);
app.listen(PORT);
