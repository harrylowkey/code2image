# Code2Image

## Description

This repo has been forked from [code2img](https://github.com/cyberpirate92/code2img)

## Installation

```bash
$ npm i @harrylowkey/code2image
$ npm i mkdir
$ npm i ncp
```

## Usage

Import Code2ImageModule in your Nest application.

```typescript
import { Module } from '@nestjs/common';
import { Code2ImageModule } from '@harrylowkey/code2image';

@Module({
  imports: [ Code2ImageModule.forRoot({ host: 'http://localhost:3000' || 'your backend url' }) ]
})
export class ApplicationModule {}
```

Import ServeStaticModule in your Nest application.

```typescript
import { ServeStaticModule } from '@nestjs/serve-static';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', 'public'),
        serveRoot: '/'
    })
  ]
})
export class ApplicationModule {}

```

Add the copy-code2image-public script in `package.json` to copy the code2image public director to your build folder.
Update the build/start:dev/start:debug script to use the copy-code2image-public script.

```json
"scripts": {
    "copy-code2image-public": "mkdirp dist/public && ncp node_modules/@harrylowkey/code2image/public dist/public",
    "build": "npm run copy-code2image-public && nest build",
    "start:dev": "npm run copy-code2image-public && nest start --watch",
    "start:debug": "npm run copy-code2image-public && nest start --debug --watch",
}
```

Inject the Code2ImageService in your Nest application.

```typescript
import { Injectable } from '@nestjs/common';
import { Code2ImageService, LanguageEnum, ThemeEnum, GenerateImagePramType } from '@harrylowkey/code2image';

@Injectable()
export class PostBuilderService implements PostBuilderInterface {
    constructor(private code2ImageService: Code2ImageService) {}

    #randomLanguage(): LanguageEnum {
        const languages = Object.values(LanguageEnum);
        return languages[Math.floor(Math.random() * languages.length)];
    }

    #randomTheme(): ThemeEnum {
        const themes = Object.values(ThemeEnum);
        return themes[Math.floor(Math.random() * themes.length)];
    }

    async generateImage(): string {
        const params: GenerateImagePramType = {
            code: 'console.log("Hello World")',
            theme: this.#randomTheme(),
            language: this.#randomLanguage(),
        };
        const image = await this.code2ImageService.generateImage({ ...params, code })
    }
```

## Example
To learn more about the usage of this repository, visit: [instagram-coding-easily-api](https://github.com/harrylowkey/instagram-coding-easily-api)
