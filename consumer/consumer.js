require("dotenv").config();
const amqp = require("amqplib");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

const sendEmail = async (targetEmail, playlistData) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: targetEmail,
    subject: `Ekspor Playlist: ${playlistData.playlist.name}`,
    text: JSON.stringify(playlistData, null, 2),
  };

  await transporter.sendMail(mailOptions);
};

const getPlaylistData = async (playlistId) => {
  const pool = new Pool();
  const playlistQuery = await pool.query("SELECT id, name FROM playlists WHERE id = $1", [playlistId]);

  if (!playlistQuery.rows.length) throw new Error("Playlist tidak ditemukan");

  const songsQuery = await pool.query(
    `SELECT songs.id, songs.title, songs.performer
     FROM songs
     JOIN playlist_songs ON songs.id = playlist_songs.song_id
     WHERE playlist_songs.playlist_id = $1`,
    [playlistId]
  );

  await pool.end();

  return {
    playlist: {
      id: playlistQuery.rows[0].id,
      name: playlistQuery.rows[0].name,
      songs: songsQuery.rows,
    },
  };
};

const consumeMessages = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
  const channel = await connection.createChannel();
  await channel.assertQueue("export:playlist", { durable: true });

  console.log("Consumer berjalan, menunggu pesan...");

  channel.consume("export:playlist", async (message) => {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());
      const playlistData = await getPlaylistData(playlistId);
      await sendEmail(targetEmail, playlistData);
      console.log(`Email berhasil dikirim ke ${targetEmail}`);
      channel.ack(message);
    } catch (error) {
      console.error("Gagal memproses pesan:", error);
    }
  });
};

consumeMessages();
