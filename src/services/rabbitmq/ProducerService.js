const amqp = require("amqplib");

class ProducerService {
  constructor() {
    this._channel = null;
  }

  async _initializeChannel() {
    if (!this._channel) {
      const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
      this._channel = await connection.createChannel();
      await this._channel.assertQueue("export:playlist", { durable: true });
    }
  }

  async sendMessage(queue, message) {
    await this._initializeChannel();
    this._channel.sendToQueue(queue, Buffer.from(message));
  }
}

module.exports = ProducerService;
