/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("playlist_songs", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    playlist_id: {
      type: "VARCHAR(50)",
      references: '"playlists"',
      onDelete: "CASCADE",
    },
    song_id: {
      type: "VARCHAR(50)",
      references: '"songs"',
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("playlist_songs", "unique_playlist_id_and_song_id", {
    unique: ["playlist_id", "song_id"],
  });
};

exports.down = (pgm) => {
  pgm.dropTable("playlist_songs");
};
