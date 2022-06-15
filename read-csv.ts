import fs from "fs";
import * as fastCSV from "fast-csv";

import SongModel from "./models/song-model";

import "dotenv/config";

const data: SongModel[] = [];

fs.createReadStream("./spotify-data/top-200.csv")
  .pipe(fastCSV.parse({ headers: true }))
  .on("error", (error) => console.error(error))
  .on("end", async () => {
    console.log(data);
  })
  .on("data", (row) => {
    const name = row.track_name;
    const rank = Number(row.rank);
    const songSpotifyID = row.uri.split(":")[2];
    const numOfStreams = Number(row.streams);

    const song = new SongModel(name, rank, songSpotifyID, numOfStreams);
    data.push(song);
  });
