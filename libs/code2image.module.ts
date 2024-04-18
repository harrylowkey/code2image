import { DynamicModule, Global, Module } from '@nestjs/common';
import { Code2ImageOptions } from './types/code2image-option.type';
import { HOST } from './constants/provider.constant';
import { Code2ImageService } from './services/code2image.service';

@Global()
@Module({})
export class Code2ImageModule {
    public static forRoot(options: Code2ImageOptions): DynamicModule {
        const { host } = options;

        const code2ImageOptionsProvider = {
            provide: HOST,
            useValue: host
        };

        return {
            providers: [code2ImageOptionsProvider, Code2ImageService],
            exports: [code2ImageOptionsProvider, Code2ImageService],
            imports: [],
            module: Code2ImageModule
        };
    }
}
