import nodemailer from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
import Configuration from "../application/Configuration.js";

class Mailer {
    constructor() {
        this.email = [];
        this.subject = '';
        this.content = '';
        this.attachments = [];
    }

    createTransport() {
        const config = {
            host: Configuration.smtp.host,
            port: Configuration.smtp.port,
            secure: Configuration.smtp.secure,
        };

        if( Configuration.smtp.user && Configuration.smtp.password ) {
            config.auth = {
                user: Configuration.smtp.user,
                pass: Configuration.smtp.password,
            };
        }

        return nodemailer.createTransport(config);
    }

    setRecipient(email) {
        this.email.push(email);
    }

    getRecipient() {
        return this.email;
    }

    setSubject(subject) {
        this.subject = subject;
    }

    getSubject() {
        return this.subject;
    }

    setContent(content) {
        this.content = content;
    }

    getContent(isSanitized = true) {
        return isSanitized
            ? sanitizeHtml(this.content, {
                allowedTags: [],
                allowedAttributes: {},
            })
            : this.content;
    }

    setAttachments(attachments) {
        this.attachments.push(attachments);
    }

    getAttachments() {
        return this.attachments;
    }

    async send() {
        const transport = this.createTransport();

        const data = {
            to: this.getRecipient(),
            subject: this.getSubject(),
            text: this.getContent(true),
            html: this.getContent(false),
        };

        if( this.getAttachments().length > 0 ) {
            data.attachments = this.getAttachments();
        }

        const info = await transport.sendMail(data);

        console.info(`Message sent: ${info.messageId}`);
    }
}

export default Mailer;