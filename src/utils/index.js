const mapDBToModelAlbum = ({ ...rest }) => ({
  ...rest,
});

const mapDBToModelSong = ({ ...rest }) => ({
  ...rest,
});

const mapDBToModelPlaylist = (row) => ({
  id: row.id,
  name: row.name,
  username: row.username, 
});

const mapDBToModelPlaylistSongs = (playlistData, songsData) => ({
  id: playlistData.id,
  name: playlistData.name,
  username: playlistData.username,
  songs: songsData.map((song) => ({
    id: song.id,
    title: song.title,
    performer: song.performer,
  })),
});

module.exports = {
  mapDBToModelAlbum,
  mapDBToModelSong,
  mapDBToModelPlaylist,
  mapDBToModelPlaylistSongs,
};
