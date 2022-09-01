import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import { resolve } from 'path';

function init() {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use((err: Response, request: Request, response: Response, next: NextFunction) => {
        response.sendStatus(err.statusCode);
    });

    app.get('/', (request: Request, response: Response) => response.status(200).send('SSG running'));
    app.get('/render', async (request: Request, response: Response) => await processRenderRequest(request, response));
    app.all('*', (request: Request, response: Response) => response.sendStatus(400));

    app.listen(5000, () => console.log('Listening on port 5000'));
}

async function processRenderRequest(request: Request, response: Response) {
    let url = request.originalUrl.split('/render?url=')[1];

    const page = await render(url);

    console.log(`Rendering: ${page}`);

    return response.status(200).send(page);
}

async function render(url: string): Promise<string> {
    const browser = await puppeteer.launch({
        args: [
            '--enable-features=ExperimentalJavaScript'
        ]
    });
    const page = await browser.newPage();

    await page.goto(url, { timeout: 15000 });
    const html = await page.content();

    page.close();

    return html;
}

init();