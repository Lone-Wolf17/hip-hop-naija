export default class SongModel {
  top200Rank: number;
  spotifyID: string;
  numOfStreams: number;
  isHipHop: boolean = false;
  name: string;
  genres: string[] = [];
  artistID? : string;
  artistName? : string;
  imageUrl?: string;

  constructor(
    name: string,
    top200Rank: number,
    spotifyID: string,
    numOfStreams: number
  ) {
    this.name = name;
    this.top200Rank = top200Rank;
    this.spotifyID = spotifyID;
    this.numOfStreams = numOfStreams;
  }
}
