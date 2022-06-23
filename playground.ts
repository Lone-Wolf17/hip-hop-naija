import { SpotifyService } from "./services/spotify-service";
import "dotenv/config";

async function checkSongDetails() {
  console.log(await SpotifyService.getSongDetails("6GbCVFzQZXgP2yd3EQv4hp"));
}

checkSongDetails();
