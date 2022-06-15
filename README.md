This is the Node JS Project that extracts and updates the ["Naija Rap Countdown"](https://open.spotify.com/playlist/1F0OT9u0RJ7qBwkB7bRo2O?si=SfZN8h-ZQ2aJU51gIfkRiw) Playlist on Spotify.



The Project is supposed to be live but [Spotify Charts](https://charts.spotify.com/) does not allow web scraping . 

hence for now someone has to manually download the top 200 songs csv file from [Spotify Charts](https://charts.spotify.com/) and run the project. 
Currently looking into any workarounds for this, any help or suggestion will be appreciated. 

The Project takes the csv file provided, extract the neccessary track data. 

Then makes calls to [Spotify Web Api](https://developer.spotify.com/documentation/web-api), to retrieve information about the genres of each tracks
(Note due to Spotify not providing the genres of each track, the tracks are categorised using the genres of the artists)

After the genres of the Tracks have been retrieved. songs that are not categorised as hip hop or rap songs are filtered out. 

The remaining songs are then used to update the countdown/playlist. 

Note::: Project is still a work in progress, code to automatically update the playlist has not written yet. 
(for now the playlist is edited manulally using the filtered songs)