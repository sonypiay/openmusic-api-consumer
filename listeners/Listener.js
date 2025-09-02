import { existsSync } from "node:fs";

class Listener {
    constructor(args) {
        this.args = args;
        this.path = `./listeners`;
    }

    getFilename() {
        const classArgs = this.args.find(arg => arg.startsWith('--class='));

        if( ! classArgs ) {
            console.error('Invalid arguments, use --class=');
            process.exit(1);
        }

        const filename = `./${classArgs.split('=')[1]}.js`;

        if( ! existsSync(`${this.path}/${filename}`) ) {
            console.error(`File ${filename} not found`);
            process.exit(1);
        }

        return filename;
    }

    getMaxRetry() {
        const maxRetryArgs = this.args.find(arg => arg.startsWith('--max-retry='));
        return maxRetryArgs ? parseInt(maxRetryArgs.split('=')[1]) : 0;
    }

    getRetryDelay() {
        const retryDelayArgs = this.args.find(arg => arg.startsWith('--retry-delay='));
        return retryDelayArgs ? parseInt(retryDelayArgs.split('=')[1]) : 0;
    }

    async run() {
        const module = await import(`./${this.getFilename()}`);
        const className = new module.default;

        if( this.getMaxRetry() !== 0 ) {
            className.setMaxRetry(this.getMaxRetry());
        }

        if( this.getRetryDelay() !== 0 ) {
            className.setRetryDelay(this.getRetryDelay());
        }

        className.handle();
    }
}

const listener = new Listener(process.argv.slice(2));
await listener.run();