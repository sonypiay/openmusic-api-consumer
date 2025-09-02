import ConsumerService from "../services/ConsumerService.js";
import Mailer from "../helper/Mailer.js";
import ProducerService from "../services/ProducerService.js";
import PlaylistsSongRepository from "../repositories/PlaylistsSongRepository.js";

class EmailListener {
    constructor() {
        this.consumerService = new ConsumerService();
        this.mailer = new Mailer();
        this.deadQueue = 'dlq';
        this.retryCount = 0;

        this.setQueue('email');
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
        const data = JSON.parse(message.content.toString());
        this.retryCount = headers['x-retry-count'] ?? this.retryCount;

        try {
            const emailContent = `<p>Halo <strong>${data.email}</strong>,</p> <p>Playlist <strong>${data.name}</strong> telah diexport ke email anda.</p>`;
            const playlistsSongRepository = new PlaylistsSongRepository;
            const contentPlaylist = JSON.stringify({
                id: data.id,
                name: data.name,
                songs: await playlistsSongRepository.getByPlaylistId(data.playlistId),
            });

            this.mailer.setSubject(`Playlist ${data.name}`);
            this.mailer.setContent(emailContent);
            this.mailer.setRecipient(data.email);
            this.mailer.setAttachments({
                filename: data.file,
                content: contentPlaylist,
            });

            await this.mailer.send();
        } catch (error) {
            console.error(`There was an error while sending email: ${error.message}`);

            if( this.retryCount < this.getMaxRetry() ) {
                await this.handleRetryQueue(data, this.retryCount);
                this.incrementRetryCount();
            } else {
                await this.handleDeadQueue(data);
                this.resetRetryCount();
            }
        }
    }

    async handleDeadQueue(data) {
        console.error(`Failed to send email to ${data.email} after ${this.retryCount} retries`);
        const producerService = new ProducerService();

        producerService.setQueueOptions({
            durable: true,
            arguments: {
                'x-queue-type': 'quorum',
            },
        });

        producerService.setMessage(JSON.stringify(data), {
            'x-queue-from': this.getQueue(),
        });

        await producerService.send(this.deadQueue);
        console.info(`Email to ${data.email} moved to dead queue: ${this.deadQueue}`);
    }

    async handleRetryQueue(data) {
        console.info(`Retrying to send email to ${data.email}`);
        const producerService = new ProducerService();

        setTimeout(async() => {
            producerService.setMessage(JSON.stringify(data), {
                'x-retry-count': this.retryCount,
            });
            await producerService.send(this.getQueue());
        }, this.getRetryDelay());
    }
}

export default EmailListener;