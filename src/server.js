require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const Inert = require("@hapi/inert");
const path = require("path");
const ClientError = require("./exceptions/ClientError");

// Import modules
const albums = require("./api/albums");
const AlbumsService = require("./services/postgres/AlbumsService");
const AlbumsValidator = require("./validator/albums");

const songs = require("./api/songs");
const SongsService = require("./services/postgres/SongsService");
const SongsValidator = require("./validator/songs");

const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

const playlists = require("./api/playlists");
const PlaylistsService = require("./services/postgres/PlaylistsService");
const PlaylistsValidator = require("./validator/playlists");

const playlistSongs = require("./api/playlistSongs");
const PlaylistSongsService = require("./services/postgres/PlaylistSongsService");
const PlaylistSongsValidator = require("./validator/playlistSongs");

const collaborations = require("./api/collaborations");
const CollaborationsService = require("./services/postgres/CollaborationsService");
const CollaborationsValidator = require("./validator/collaborations");

const ExportsService = require("./services/rabbitmq/ProducerService");
const ExportsValidator = require("./validator/exports");
const exportsPlugin = require("./api/exports");

const authentications = require("./api/authentications");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

const StorageService = require("./services/storage/StorageService");
const UploadsValidator = require("./validator/uploads");
const uploadsPlugin = require("./api/uploads");

const LikesService = require("./services/postgres/LikesService");
const LikesHandler = require("./api/likes");
const LikesValidator = require("./validator/likes");

const init = async () => {
  // Inisialisasi service
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const playlistSongsService = new PlaylistSongsService(collaborationsService);
  const exportsService = new ExportsService();
  const authenticationsService = new AuthenticationsService();
  const likesService = new LikesService();
  const storageService = new StorageService(path.resolve(__dirname, "api/uploads/file/images"));

  // Konfigurasi server
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "localhost",
    routes: {
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["*"],
      },
    },
  });

  // Registrasi plugin eksternal
  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  // Mendefinisikan strategy autentikasi JWT
  server.auth.strategy("openmusic_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: Number(process.env.ACCESS_TOKEN_AGE),
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: { id: artifacts.decoded.payload.id },
    }),
  });

  // Registrasi plugin internal
  await server.register([
    { plugin: albums, options: { service: albumsService, validator: AlbumsValidator } },
    { plugin: songs, options: { service: songsService, validator: SongsValidator } },
    { plugin: users, options: { service: usersService, validator: UsersValidator } },
    { plugin: playlists, options: { service: playlistsService, validator: PlaylistsValidator } },
    { plugin: playlistSongs, options: { service: playlistSongsService, validator: PlaylistSongsValidator } },
    { plugin: collaborations, options: { service: collaborationsService, playlistsService, usersService, validator: CollaborationsValidator } },
    { plugin: exportsPlugin, options: { service: exportsService, playlistsService, validator: ExportsValidator } },
    { plugin: authentications, options: { authenticationsService, usersService, tokenManager: TokenManager, validator: AuthenticationsValidator } },
    {
      plugin: uploadsPlugin,
      options: {
        storageService,
        albumsService, // Kirim albumsService sebagai opsi
        validator: UploadsValidator,
      },
    },
    { plugin: LikesHandler, options: { service: likesService, validator: LikesValidator } }, // Registrasi plugin LikesHandler
  ]);

  // Penanganan error global
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        return h.response({ status: "fail", message: response.message }).code(response.statusCode);
      }

      if (!response.isServer) {
        return h.continue;
      }

      console.error(response); // Log error agar bisa dianalisis
      return h.response({ status: "error", message: "Terjadi kegagalan pada server kami" }).code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
