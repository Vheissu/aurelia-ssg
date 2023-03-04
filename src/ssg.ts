import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

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
    const urlParam = request.query.url as string;
  
    if (!urlParam) {
      return response.sendStatus(400);
    }
  
    const url = `http://localhost:9000${urlParam}`;
  
    const html = await render(url);
  
    // Generate static file
    const filePath = path.join(__dirname, 'public', `${urlParam.replace(/\//g, '_')}.html`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
  
    console.log(`Rendering: ${url}`);
  
    return response.status(200).send(html);
}

async function render(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      args: [
        '--enable-features=ExperimentalJavaScript'
      ]
    });
  
    const page = await browser.newPage();
    try {
      await page.goto(url, { timeout: 15000 });
  
      // Wait for the my-app element to have child elements
      await page.waitForFunction(() => {
        const myApp = document.querySelector('my-app');
        return myApp && myApp.childElementCount > 0;
      }, { timeout: 5000 });
  
      const html = await page.content();
  
      await page.close();
      await browser.close();
  
      return html;
    } catch (err) {
      console.error(`Error rendering ${url}: ${err}`);
      await page.close();
      await browser.close();
      throw err;
    }
  }
  

init();