import ConsumerService from "../services/ConsumerService.js";
import ProducerService from "../services/ProducerService.js";

class DeadLetterListener {
    constructor() {
        this.consumerService = new ConsumerService();
        this.retryCount = 0;
        this.setQueue('dlq');
    }

    setQueue(queue) {
        this.queue = queue;
    }

    getQueue() {
        return this.queue;
    }

    setRetryDelay(retryDelay) {
        this.retryDelay = retryDelay;
    }

    setMaxRetry(maxRetry) {
        this.maxRetry = maxRetry;
    }

    getRetryDelay() {
        return this.retryDelay;
    }

    getMaxRetry() {
        return this.maxRetry;
    }

    incrementRetryCount() {
        this.retryCount++;
    }

    resetRetryCount() {
        this.retryCount = 0;
    }

    async handle() {
        await this.consumerService.listen(this.getQueue(), this.callbackListener.bind(this));
    }

    async callbackListener(message) {
        if( ! message ) return;

        const headers = message.properties.headers;
        const data = message.content.toString();
        const queueFrom = headers['x-queue-from'];

        await this.sendQueue(data, queueFrom);
    }

    async sendQueue(data, queue) {
        try {
            const producerService = new ProducerService();

            producerService.setQueueOptions({
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum',
                },
            });

            producerService.setMessage(data);
            await producerService.send(queue);
        } catch (error) {
            console.error(`There was an error while sending message to queue ${queue}: ${error.message}`);
            console.error(`Retrying send message to ${queue} after ${this.retryCount} retries`);

            if( this.retryCount < this.getMaxRetry() ) {
                setTimeout(async() => {
                    await this.sendQueue(data, queue);
                    this.incrementRetryCount();
                }, this.getRetryDelay());
            } else {
                this.resetRetryCount();
                console.error(`Failed to send message to ${queue} after ${this.retryCount} retries`);
            }
        }
    }
}

export default DeadLetterListener;