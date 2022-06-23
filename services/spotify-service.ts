import SongModel from "../models/song-model";
import axios from "axios";
import qs from "qs";

interface Artist {
  name: string;
  id: string;
}

export class SpotifyService {
  private static accessToken = "";

  static nonHipArtists: Artist[] = [
    {
      name: "Davido",
      id: "0Y3agQaa6g2r0YmHPOO9rh",
    },
    {
      name: "Burna Boy",
      id: "3wcj11K77LjEY1PkEazffa",
    },
    {
      name: "Adekunle Gold",
      id: "2IK173RXLiCSQ8fhDlAb3s",
    },
    {
      name: "Wizkid",
      id: "3tVQdUvClmAT7URs9V3rsp",
    },
    {
      name: "Wande Coal",
      id: "1fYVmAFB7sC7eDoF3mJXla",
    },
    {
      id: "3bxZkzk0PLHcetO9o4oxXn",
      name: "Reekado Banks",
    },
    {
      id: "1X6cBGnXpEpN7CmflLKmLV",
      name: "Kizz Daniel",
    },
    {
      id: "3a1tBryiczPAZpgoZN9Rzg",
      name: "Asake",
    },
    {
      id: "3DNCUaKdMZcMVJIS7yTskd",
      name: "Mayorkun",
    },
    {
      id: "75VKfyoBlkmrJFDqo1o2VY",
      name: "Fireboy DML",
    },
    {
      id: "5yOvAmpIR7hVxiS6Ls5DPO",
      name: "Omah Lay",
    },
    {
      id: "3zaDigUwjHvjOkSn0NDf9x",
      name: "BNXN fka Buju",
    },
    {
      id: "687cZJR45JO7jhk1LHIbgq",
      name: "Tems",
    },
    {
      name: "Mr Eazi",
      id: "4TAoP0f9OuWZUesao43xUW",
    },
  ];

  static knownHipHopArtists: Artist[] = [
    {
      name: "Ladipoe",
      id: "379IT6Szv0zgnw4xrdu4mu",
    },
    {
      id: "2LiqbH7OhqP0yuaG8VL1wJ",
      name: "Black Sherrif",
    },
    {
      id: "7oVwzvvrXEC8LbXhaNjTi4",
      name: "Ajebo Hustlers",
    },
    {
      id: "4Hyl7QROvzELSzMO7OXdjr",
      name: "Psycho YP",
    },
  ];

  /// Expects an array of 200 songs;
  static async extractHipHopSongs(
    tracks: SongModel[],
    accessToken: string
  ): Promise<SongModel[]> {
    this.accessToken = accessToken;
    const track1To50 = tracks.slice(1, 50);
    const track51To100 = tracks.slice(51, 100);
    const track101To150 = tracks.slice(101, 150);
    const track151To200 = tracks.slice(151, 200);

    return [
      ...(await SpotifyService.extractHipHopSongsInBatches(
        track1To50,
        accessToken
      )),
      ...(await SpotifyService.extractHipHopSongsInBatches(
        track51To100,
        accessToken
      )),
      ...(await SpotifyService.extractHipHopSongsInBatches(
        track101To150,
        accessToken
      )),
      ...(await SpotifyService.extractHipHopSongsInBatches(
        track151To200,
        accessToken
      )),
    ];
  }

  private static async getAccessToken(): Promise<string> {
    /// If access token has already been retrieved, return it, no need to make repeated calls
    if (this.accessToken.length !== 0) {
      console.log("Access Token Found");
      return this.accessToken;
    }

    console.log("No Access Token Found");
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      data: {
        grant_type: "client_credentials",
      },
      json: true,
    };
    const response = await axios.post(
      authOptions.url,
      qs.stringify(authOptions.data),
      {
        headers: authOptions.headers,
      }
    );
    // console.log("Point B");
    if (!(response.status == 200)) {
      throw Error("Auth request failed");
    }

    /// save accessToken so as to prevent unnecessary repeated api calls
    this.accessToken = response.data.access_token;

    return this.accessToken;
  }

  private static nonHipHopArtistsIDs = this.nonHipArtists.map(
    (artist) => artist.id
  );

  private static knownHipHopArtistsIDs = this.knownHipHopArtists.map(
    (artist) => artist.id
  );

  static async checkIfHipHopOrRap(song: SongModel): Promise<SongModel> {
    // your application requests authorization

    try {
      // use the access token to access the Spotify Web API
      const token = await this.getAccessToken();
      const options = {
        url: `https://api.spotify.com/v1/tracks/${song.spotifyID}`,
        headers: {
          Authorization: "Bearer " + token,
        },
      };

      const res = await axios.get(options.url, {
        headers: options.headers,
      });
      // console.log("Point C");

      if (!(res.status == 200)) {
        throw Error("Track Data request failed");
      }
      const songOwner = res.data.artists[0];

      song.artistID = songOwner.id;
      song.artistName = songOwner.name;

      /// if artist is a known non rap artist, such as Davido or Wande Coal
      /// no need to check their genres
      if (this.isKnownNonRapArtist(songOwner.id)) {
        song.isHipHop = false;
        return song;
      }

      const artistReqOptions = {
        url: `https://api.spotify.com/v1/artists/${songOwner.id}`,
        headers: {
          Authorization: "Bearer " + token,
        },
        json: true,
      };

      const artistRes = await axios.get(artistReqOptions.url, {
        headers: artistReqOptions.headers,
      });

      if (!(artistRes.status === 200)) {
        throw Error("Artist Data request failed");
      }
      const genres = artistRes.data.genres;
      if (!genres) {
        return song;
      }
      const isHipHopOrRap = this.hasHipHopOrRapGenre(genres);

      song.isHipHop = isHipHopOrRap;
      song.genres = genres;
      return song;
    } catch (error: any) {
      if (error.response) {
        console.log("Response Status::", error.response.status);
        console.log(error.response.statusText);
      } else {
        console.log(error);
      }
      return song;
    }
  }
  // tracks must not be more than 50
  private static async extractHipHopSongsInBatches(
    tracks: SongModel[],
    accessToken: string
  ): Promise<SongModel[]> {
    if (tracks.length > 50) {
      throw Error("Limit is 50 tracks per batch");
    }

    let trackIdsQuery = "";

    tracks.forEach((track) => {
      trackIdsQuery += track.spotifyID + ",";
    });

    trackIdsQuery = trackIdsQuery.slice(0, trackIdsQuery.length - 1);

    // use the access token to access the Spotify Web API
    // const token = await this.getAccessToken();
    const token = accessToken;

    const options = {
      url: `https://api.spotify.com/v1/tracks?ids=${trackIdsQuery}`,
      headers: {
        Authorization: "Bearer " + token,
      },
    };

    const res = await axios.get(options.url, {
      headers: options.headers,
    });

    if (!(res.status == 200)) {
      throw Error("Track Data request failed");
    }

    const spotifyTrackData: any[] = res.data.tracks;

    const songsWitHData = spotifyTrackData.map((trackData) => {
      const song = tracks.find(
        (element) => trackData.id === element.spotifyID
      )!;

      if (song) {
        const songOwner = trackData.artists[0];

        song.artistID = songOwner.id;
        song.artistName = songOwner.name;
        song.imageUrl = trackData.album.images[0].url;
      }

      return song;
    });

    /// if artist is a known non rap artist, such as Davido or Wande Coal
    /// no need to check their genres
    const filteredSongs = songsWitHData.filter(
      (element) => !this.isKnownNonRapArtist(element?.artistID!)
    );
    let artistIdsQuery = "";

    filteredSongs.forEach((track) => {
      artistIdsQuery += track.artistID! + ",";
    });

    artistIdsQuery = artistIdsQuery.slice(0, artistIdsQuery.length - 1);

    const artistReqOptions = {
      url: `https://api.spotify.com/v1/artists?ids=${artistIdsQuery}`,
      headers: {
        Authorization: "Bearer " + token,
      },
      json: true,
    };

    const artistRes = await axios.get(artistReqOptions.url, {
      headers: artistReqOptions.headers,
    });

    // console.log("Point D");

    if (!(artistRes.status === 200)) {
      throw Error("Artist Data request failed");
    }
    // console.log(artistRes.data);
    const returnedArtists: any[] = artistRes.data.artists;
    /// We work with the assumption that Spotify returns the artists in the order in which we entered the IDs
    const songsWithGenreData = returnedArtists.map((artist: any, index) => {
      // const song = filteredSongs.find(
      //   (element) => artist.id === element.artistID!
      // )!;

      const song: SongModel = filteredSongs[index];

      if (artist.id !== song.artistID) {
        throw Error(
          "Error, Spotify did not return data in the we based our assumption on"
        );
      }

      const genres = artist.genres;
      if (!genres) {
        return song;
      }

      if (!song) {
        console.log(artist);
      }

      const isHipHopOrRap = this.hasHipHopOrRapGenre(genres);

      song.isHipHop = isHipHopOrRap;
      song.genres = genres;
      return song;
    });

    return songsWithGenreData.filter(
      (element) => element.isHipHop || this.isKnownRapArtist(element?.artistID!)
    );
  }
  catch(error: any) {
    console.log(error);
  }

  /// Check if Artist is a known non rap artists
  private static isKnownNonRapArtist(artistID: string): boolean {
    return this.nonHipHopArtistsIDs.includes(artistID);
  }

  /// Check if Artist is a known rap artist
  private static isKnownRapArtist(artistID: string): boolean {
    return this.knownHipHopArtistsIDs.includes(artistID);
  }

  private static hasHipHopOrRapGenre(genres: string[]): boolean {
    return genres.some((genre) => {
      return (
        (genre.includes("hip hop") || genre.includes("rap")) &&
        !genre.includes("nigerian pop")
      );
    });
  }

  static async getSongDetails(songSpotifyId: string) {
    try {
      // use the access token to access the Spotify Web API
      console.log("Fire 1");
      const token = await this.getAccessToken();
      console.log("Fire 2");
      const options = {
        url: `https://api.spotify.com/v1/tracks/${songSpotifyId}`,
        headers: {
          Authorization: "Bearer " + token,
        },
      };

      console.log(options);

      const res = await axios.get(options.url, {
        headers: options.headers,
      });
      // console.log("Point C");

      if (!(res.status == 200)) {
        throw Error("Track Data request failed");
      }
      const songOwner = res.data.artists[0];

      const artistReqOptions = {
        url: `https://api.spotify.com/v1/artists/${songOwner.id}`,
        headers: {
          Authorization: "Bearer " + token,
        },
        json: true,
      };

      const artistRes = await axios.get(artistReqOptions.url, {
        headers: artistReqOptions.headers,
      });

      if (!(artistRes.status === 200)) {
        throw Error("Artist Data request failed");
      }
      const genres = artistRes.data.genres;
      if (!genres) {
        songOwner.isHipHop = false;
        return songOwner;
      }
      const isHipHopOrRap = this.hasHipHopOrRapGenre(genres);

      songOwner.isHipHop = isHipHopOrRap;
      songOwner.genres = genres;
      return songOwner;
    } catch (error: any) {
      if (error.response) {
        console.log(error.response);
        console.log("Response Status::", error.response.status);
        console.log(error.response.statusText);
      } else {
        console.log(error);
      }
      return;
    }
  }

  static async updateSpotifyPlaylist(
    hipHopSongs: SongModel[],
    accessToken: string
  ) {
    const url = `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`;
    // const token = await this.getAccessToken();
    const headers = {
      Authorization: "Bearer " + accessToken,
    };
    // let uris = "";
    const uris = hipHopSongs.map((song) => {
      return `spotify:track:${song.spotifyID}`;
    });

    /// remove trailing comma ','
    // uris = uris.slice(0, uris.length - 1);
    const payload = {
      uris,
    };
    console.log(payload);
    const response = await axios.put(url, payload, { headers });
    if (response.status !== 201) {
      console.log(response.data);
      console.log(response.status, response.statusText);
      throw Error("Playlist Upadate failed");
    }

    return true;
  }
}
