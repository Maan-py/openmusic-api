/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addConstraint("playlists", "fk_playlists.owner_users.id", {
    foreignKeys: {
      columns: "owner",
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("playlists", "fk_playlists.owner_users.id");
};
