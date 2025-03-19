exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("user_album_likes", {
    id: {
      type: "SERIAL",
      primaryKey: true,
    },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    album_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    created_at: {
      type: "TIMESTAMP", // Waktu ketika like dibuat
      default: pgm.func("CURRENT_TIMESTAMP"), // Timestamp default saat like dibuat
    },
  });

  pgm.addConstraint("user_album_likes", "unique_user_album", {
    unique: ["user_id", "album_id"],
  });

  pgm.addConstraint("user_album_likes", "fk_user_album_likes_user_id", {
    foreignKeys: {
      columns: ["user_id"],
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("user_album_likes", "fk_user_album_likes_album_id", {
    foreignKeys: {
      columns: ["album_id"],
      references: "albums(id)",
      onDelete: "CASCADE",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("user_album_likes");
};
