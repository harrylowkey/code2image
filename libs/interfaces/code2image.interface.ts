import { GenerateImagePramType } from '../types/generate-image-param.type';

export interface Code2ImageInterface {
    generateImage(param: GenerateImagePramType): Promise<Buffer>;
}
