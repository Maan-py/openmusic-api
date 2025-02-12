const mapDBToModelAlbum = ({ ...rest }) => ({
  ...rest,
});

const mapDBToModelSong = ({ ...rest }) => ({
  ...rest,
});

module.exports = { mapDBToModelAlbum, mapDBToModelSong };
