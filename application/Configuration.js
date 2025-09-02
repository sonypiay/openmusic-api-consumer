export default {
    rabbitmq: {
        url: process.env.RABBITMQ_URL,
        timeout: 5000,
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM,
    },
}