import fs from "fs";
import * as fastCSV from "fast-csv";

import SongModel from "./models/song-model";
import { SpotifyService } from "./services/spotify-service";

export function readSongsFromTop200CSV(): Promise<SongModel[]> {
  return new Promise<SongModel[]>((resolve, reject) => {
    const data: SongModel[] = [];

    fs.createReadStream("./spotify-data/top-200.csv")
      .pipe(fastCSV.parse({ headers: true }))
      .on("error", (error) => {
        console.error(error);
        reject(error);
      })
      .on("end", async () => {
        resolve(data);
      })
      .on("data", (row) => {
        const name = row.track_name;
        const rank = Number(row.rank);
        const songSpotifyID = row.uri.split(":")[2];
        const numOfStreams = Number(row.streams);

        const song = new SongModel(name, rank, songSpotifyID, numOfStreams);
        data.push(song);
      });
  });
}
