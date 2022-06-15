import fs from "fs";
import * as fastCSV from "fast-csv";

import SongModel from "./models/song-model";
import { SpotifyService } from "./services/spotify-service";

import 'dotenv/config'

const data: SongModel[] = [];

fs.createReadStream("./spotify-data/top-200.csv")
  .pipe(fastCSV.parse({ headers: true }))
  .on("error", (error) => console.error(error))
  .on("end", async () => {
    const track1To50 = data.slice(1, 50);
    const track51To100 = data.slice(51, 100);
    const track101To150 = data.slice(101, 150);
    const track151To200 = data.slice(151, 200);

    try {
      const hipHopTracks = [
        ...(await SpotifyService.getSongDataInBatches(track1To50)),
        ...(await SpotifyService.getSongDataInBatches(track51To100)),
        ...(await SpotifyService.getSongDataInBatches(track101To150)),
        ...(await SpotifyService.getSongDataInBatches(track151To200)),
      ];
      console.log("Hip Hop Tracks::: ", hipHopTracks);
    } catch (error: any) {
      console.error(error);
    }
  })
  .on("data", (row) => {
    const name = row.track_name;
    const rank = Number(row.rank);
    const songSpotifyID = row.uri.split(":")[2];
    const numOfStreams = Number(row.streams);

    const song = new SongModel(name, rank, songSpotifyID, numOfStreams);
    data.push(song);
  });
