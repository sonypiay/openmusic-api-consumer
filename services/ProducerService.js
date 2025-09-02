import RabbitMQConnection from "../application/RabbitMQConnection.js";

class ProducerService {
    constructor() {
        this.client = null;
        this.queue = null;
        this.channel = null;
        this.options = {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum',
            },
        };
    }

    async createChannel() {
        if( ! this.client ) {
            this.client = await RabbitMQConnection.connection();
        }

        if( ! this.channel ) {
            this.channel = await RabbitMQConnection.createChannel(this.client);
        }
    }

    async close() {
        if (this.channel) {
            await RabbitMQConnection.close(this.channel);
        }

        if (this.client) {
            await RabbitMQConnection.close(this.client);
        }
    }

    async setQueue(queue) {
        this.queue = queue;

        await this.channel.assertQueue(this.queue, this.getQueueOptions());
    }

    getQueue() {
        return this.queue;
    }

    setQueueOptions(options) {
        if( options ) {
            this.options = options;
        }
    }

    getQueueOptions() {
        return this.options;
    }

    setMessage(message, headers = {}) {
        this.message = message;

        if( headers ) {
            this.setHeaders(headers);
        }
    }

    getMessage() {
        return this.message;
    }

    setHeaders(headers) {
        if( headers ) {
            this.headers = headers;
        }
    }

    getHeaders() {
        return this.headers ?? {};
    }

    async send(queue) {
        await this.createChannel();

        if( queue ) {
            await this.setQueue(queue, this.getQueueOptions());
        }

        console.info(`Sending message to queue ${this.getQueue()}`);

        await this.channel.sendToQueue(
            this.getQueue(),
            Buffer.from(this.getMessage()),
            {
                headers: this.getHeaders(),
            }
        );

        await this.close();
    }
}

export default ProducerService;