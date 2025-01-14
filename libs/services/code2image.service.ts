// import puppeteer from 'puppeteer';
import { Global, Inject, Injectable } from '@nestjs/common';
import chromium from 'chrome-aws-lambda';
import { HOST } from 'libs/constants/provider.constant';
import { LanguageEnum } from '../enums/language.enum';
import { ThemeEnum } from '../enums/theme.enum';
import { FONTS } from '../constants/font.constant';
import { GenerateImagePramType } from '../types/generate-image-param.type';
import { Code2ImageInterface } from '../interfaces/code2image.interface';
import { BACKGROUND_COLORS } from 'libs/constants/background-colors.constant';

@Global()
@Injectable()
export class Code2ImageService implements Code2ImageInterface {
    #PAGE_URL: string = '';
    #DEFAULTS = {
        VIEWPORT: {
            WIDTH: 900,
            HEIGHT: 900,
            DEVICE_SCALE_FACTOR: 1
        },
        INDEX_PAGE: 'preview.html'
    };
    #WIDTH: number = this.#DEFAULTS.VIEWPORT.WIDTH;
    #SCALE_FACTOR: number = this.#DEFAULTS.VIEWPORT.DEVICE_SCALE_FACTOR;
    #BACKGROUND_PADDING: string | number = '5';
    #BACKGROUND_IMAGE: string = '';
    #IS_SHOW_BACKGROUND: string = 'true';
    #LINE_NUMBERS: string = 'false';

    constructor(@Inject(HOST) private host: string) { }

    #getRandomBackgroundRadialGradient(): string {
        const randomIndex = Math.floor(Math.random() * BACKGROUND_COLORS.length);
        return BACKGROUND_COLORS[randomIndex];
    }

    #trimLineEndings(text: string): string {
        let trimmedText = text;
        if (text && typeof text === 'string') {
            trimmedText = text
                .split('\n')
                .map((line) => line.trimEnd())
                .join('\n');
        }
        return trimmedText;
    }

    #validateLanguage(language: LanguageEnum): this {
        if (!language || Object.values(LanguageEnum).indexOf(language) === -1) {
            console.log('❌ ', !language ? 'Language not specified' : `Unknown language '${language}'`);
            throw new Error('Invalid language');
        }

        return this;
    }

    #validateTheme(theme: ThemeEnum): this {
        if (!theme || Object.values(ThemeEnum).indexOf(theme) === -1) {
            console.log('❌ ', `Unknown theme '${theme}'`);
            throw new Error('Invalid theme');
        }

        return this;
    }

    #setBackgroundPadding(customizeBackgroundPadding?: string): this {
        try {
            const padding = parseInt(customizeBackgroundPadding || (this.#BACKGROUND_PADDING as string));
            this.#BACKGROUND_PADDING = Math.min(Math.max(0, padding), 10); // Make sure number is in range between 1-10
        } catch (error) {
            this.#BACKGROUND_PADDING = '';
        }

        return this;
    }

    #setScaleFactor(customizeScale?: number): this {
        try {
            const scaleFactor = customizeScale || this.#DEFAULTS.VIEWPORT.DEVICE_SCALE_FACTOR;
            this.#SCALE_FACTOR = Math.min(Math.max(1, scaleFactor), 5); // Make sure number is in range between 1-5
        } catch (e) {
            this.#SCALE_FACTOR = this.#DEFAULTS.VIEWPORT.DEVICE_SCALE_FACTOR;
        }

        return this;
    }

    #setWidth(customizeWidth?: number): this {
        try {
            const width = customizeWidth || this.#DEFAULTS.VIEWPORT.WIDTH;
            this.#WIDTH = Math.min(Math.abs(width), 1920);
        } catch (e) {
            this.#WIDTH = this.#DEFAULTS.VIEWPORT.WIDTH;
        }

        return this;
    }

    #generatePreviewUrl(code: string, theme: string, language: string): this {
        const queryParams = new URLSearchParams();

        const trimmedCodeSnippet: string = this.#trimLineEndings(code);

        theme && queryParams.set('theme', theme);
        language && queryParams.set('language', language);

        queryParams.set('code', trimmedCodeSnippet);
        queryParams.set('padding', this.#BACKGROUND_PADDING as string);
        queryParams.set('background-image', this.#BACKGROUND_IMAGE);
        queryParams.set('background-color', this.#getRandomBackgroundRadialGradient());
        queryParams.set('line-numbers', this.#LINE_NUMBERS);
        queryParams.set('show-background', this.#IS_SHOW_BACKGROUND);

        const queryParamsString = queryParams.toString();
        this.#PAGE_URL = `${this.host}/preview.html?${queryParamsString}`;

        return this;
    }

    async #loadFonts(): Promise<void> {
        await Promise.all(
            FONTS.map((font) => {
                const fontUrl = `https://github.com/harrylowkey/code2image/blob/develop/libs/public/fonts/${font}`;
                return chromium.font(fontUrl);
            })
        );
    }

    async #generatePreviewImage(): Promise<Buffer> {
        // console.log('🛠 ', 'Preview Page URL', this.#PAGE_URL);
        const browser = await chromium.puppeteer.launch({
            args: [...chromium.args, '--disable-gpu'],
            defaultViewport: chromium.defaultViewport,
            headless: true,
            ignoreHTTPSErrors: true,
            // executablePath: '/usr/bin/google-chrome'
            executablePath: await chromium.executablePath
        });

        const page = await browser.newPage();
        await page.goto(this.#PAGE_URL, {
            waitUntil: 'networkidle2'
        });

        await page.evaluate(() => {
            let background = '';
            const codeContainer = document.getElementById('code-container');
            const windowHeader = document.getElementById('header');
            if (codeContainer && windowHeader) {
                background = window.getComputedStyle(codeContainer, null).getPropertyValue('background');
                windowHeader.style.background = background;
            }
            return background;
        });

        await page.setViewport({
            deviceScaleFactor: this.#SCALE_FACTOR,
            width: this.#WIDTH,
            height: this.#DEFAULTS.VIEWPORT.HEIGHT,
            isMobile: true
        });

        const codeView = await page.$(this.#IS_SHOW_BACKGROUND ? '#container' : '#window');
        const image = (await codeView.screenshot()) as Buffer;

        await page.close();
        await browser.close();

        return image;
    }

    async generateImage(params: GenerateImagePramType): Promise<Buffer> {
        const { code, theme, language, scale, width, backgroundPadding } = params;

        this.#validateTheme(theme)
            .#validateLanguage(language)
            .#setWidth(width)
            .#setScaleFactor(scale)
            .#setBackgroundPadding(backgroundPadding)
            .#generatePreviewUrl(code, theme, language);

        await this.#loadFonts();
        return this.#generatePreviewImage();
    }
}
