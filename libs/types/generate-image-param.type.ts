import { ThemeEnum } from '../enums/theme.enum';
import { LanguageEnum } from '../enums/language.enum';

export type GenerateImagePramType = {
    code: string;
    language: LanguageEnum;
    theme: ThemeEnum;
    scale?: number;
    width?: number;
    backgroundPadding?: string;
};
