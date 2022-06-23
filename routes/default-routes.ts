import { Router } from "express";
import axios from "axios";
import qs from "qs";

import { readSongsFromTop200CSV as extractSongsFromTop200CSV } from "../read-csv";
import { SpotifyService } from "../services/spotify-service";
import SongModel from "../models/song-model";

const router = Router();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const PORT = process.env.PORT || 8686;
const redirect_uri = `http://localhost:${PORT}/callback`; // Your redirect uri

// var access_token = "";
// var refresh_token = "";

var hipHopSongs: SongModel[] = [];

router.get("/handle", function (req, res) {
  res.render("home");
});
router.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  console.log("Client ID", client_id);
  console.log("Client Secret", client_secret);

  // your application requests authorization
  var scope =
    "user-read-private user-read-email playlist-modify-public playlist-modify-private user-library-read";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      qs.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

router.get("/callback", async function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  console.log("Callback Called!!!!");
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        qs.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
    };

    const authResponse = await axios.post(
      authOptions.url,
      qs.stringify(authOptions.form),
      {
        headers: authOptions.headers,
      }
    );

    if (authResponse.status !== 200) {
      // throw Error("Auth request failed");
      res.redirect(
        "/#" +
          qs.stringify({
            error: "invalid_token",
          })
      );
    }

    const access_token = authResponse.data.access_token;
    const refresh_token = authResponse.data.refresh_token;

    var tokenReqOptions = {
      url: "https://api.spotify.com/v1/me",
      headers: { Authorization: "Bearer " + access_token },
    };

    // use the access token to access the Spotify Web API
    const tokenResponse = await axios.get(tokenReqOptions.url, {
      headers: tokenReqOptions.headers,
    });

    console.log(tokenResponse);

    // we can also pass the token to the browser to make requests from there
    res.redirect(
      "/#" +
        qs.stringify({
          access_token: access_token,
          refresh_token: refresh_token,
        })
    );
  }
});

router.get("/refresh_token", async function (req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
  };

  const response = await axios.post(
    authOptions.url,
    qs.stringify(authOptions.form),
    {
      headers: authOptions.headers,
    }
  );

  if (response.status === 200) {
    const access_token = response.data.access_token;
    res.send({
      access_token: access_token,
    });
  } else {
    res.redirect(
      "/#" +
        qs.stringify({
          error: "Token Refresh failed",
        })
    );
  }
});

router.get("/retrieve-playlists", async function (req, res) {
  const accessToken = req.query.accessToken as string;
  const url =
    "https://api.spotify.com/v1/playlists/37i9dQZF1DWUHcUDX0za7N/tracks";
  const headers = { Authorization: "Bearer " + accessToken };

  // use the access token to access the Spotify Web API
  const playlistResponse = await axios.get(url, { headers: headers });

  if (playlistResponse.status === 200) {
    console.log(
      "*******************************************************************************************"
    );
    console.log(playlistResponse.data);
    console.log(
      "*******************************************************************************************"
    );
    console.log(playlistResponse.data.items[0]);
    // const playlists = body.items;
    // console.log(playlists);
    // const naijaBarsPlaylist = playlists.find(
    //   (element) => element.id === "37i9dQZF1DWUHcUDX0za7N"
    // );
    // console.log(naijaBarsPlaylist);

    // we can also pass the token to the browser to make requests from there
    res.send(playlistResponse.data.items);
  }
});

router.get("/prepare-rap-playlist", async function (req, res) {
  const accessToken = req.query.accessToken as string;
  const top200Songs = await extractSongsFromTop200CSV();
  try {
    console.log("Access Token", accessToken);
    hipHopSongs = await SpotifyService.extractHipHopSongs(
      top200Songs,
      accessToken
    );
    console.log(
      "*******************************************************************************************"
    );
    // console.log("Hip Hop Tracks::: ", hipHopSongs);
    // res.send(hipHopTracks);
    res.render("hip-hop-songs", {
      hipHopSongs,
      accessToken,
    });
  } catch (error: any) {
    console.error(error);
  }
});

router.post("/update-playlist-on-spotify", async function (req, res) {
  try {
    const accessToken = req.query.accessToken as string;
    // hipHopSongs = req.body.hipHopSongs;
    // console.log("Access token", req.body.accessToken);
    console.log("Hip Hop Songs", hipHopSongs);
    const result = await SpotifyService.updateSpotifyPlaylist(
      hipHopSongs,
      accessToken
    );
    if (result) {
      res.send("<h4>Playlist Update Successful</h4>");
    } else {
      res.send("<h4>Playlist Update Failed</h4>");
    }
  } catch (error: any) {
    if (error.response?.data) {
      console.log(error.response.data);
    } else {
      console.error(error);
    }
    res.send("<h4>Playlist Update Failed</h4>");
  }
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length: number): string {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

export default router;
