import Configuration from "./Configuration.js";
import amqp from "amqplib";

class RabbitMQConnection {
    async connection() {
        return await amqp.connect(Configuration.rabbitmq.url, {
            connectionTimeout: Configuration.rabbitmq.timeout,
        });
    }

    async createChannel(connection) {
        return await connection.createChannel();
    }

    async close(connection) {
        await connection.close();
    }
}

export default new RabbitMQConnection;