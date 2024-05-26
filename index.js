
// set false to use for production release.
const DEBUG = true;


/**
 * 
 * @param {ImageData} pixels 
 * @returns {ImageData}
 */
export const transpose = pixels => {
    if (!(pixels instanceof ImageData)) {
        throw new Error('This is not an "ImageData" Object!');
    }

    const result = new ImageData(pixels.height, pixels.width);

    for (let y = 0; y < pixels.height; y++) {
        for (let x = 0; x < pixels.width; x++) {
            const i = (y * 4) * pixels.width + x * 4;
            const j = (x * 4) * pixels.height + y * 4;

            result.data[j] = pixels.data[i];
            result.data[j + 1] = pixels.data[i + 1];
            result.data[j + 2] = pixels.data[i + 2];
            result.data[j + 3] = pixels.data[i + 3];
        }
    }

    return result;
};


export const file2imagedata = async (file, { size = -1 } = {}) => {
    if (!(file instanceof File)) {
        throw new Error('This is not an "File" Object!');
    }

    const isImage = (_ => {
        return file.type?.split('/')[0] === 'image';
    })();
    if (!isImage) {
        throw new Error('not Image');
    }

    size = Number(size) || -1;
    if (size >= 65536) {
        throw new Error('big size');
    }
    if (size < 0) {
        size = Infinity;
    }


    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');


    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL( file );
        img.onerror = reject;
        img.onload = _ => {
            let [sx, sy, sWidth, sHeight] = [0, 0, img.naturalWidth, img.naturalHeight];
            const SIDE = Math.min(size, sWidth, sHeight);
    
            if (sWidth <= sHeight) {
                canvas.width = SIDE;
                canvas.height = Math.floor( SIDE * sHeight / sWidth );
            } else {
                canvas.width = Math.floor( SIDE * sWidth / sHeight );
                canvas.height = SIDE;
            }
    
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    
    
            if (DEBUG) {
                console.debug('DEBUG: input info', {
                    file,
                    size,
                    sWidth,
                    sHeight,
                    ['canvas.width']: canvas.width,
                    ['canvas.height']: canvas.height
                });
            }
    
    
            resolve( ctx.getImageData(0, 0, canvas.width, canvas.height) );
        }
    });
}


// export const toGrayScale = pixels => {
//     let raw = new Uint8ClampedArray( Math.floor( pixels.data.length / 4 ) );
//     let j = 0;
//     for (let y = 0; y < pixels.height; y++) {
//         for (let x = 0; x < pixels.width; x++) {
//             const i = (y * 4) * pixels.width + x * 4;
//             const rgb = Math.round( ( pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2] ) / 3 );
//             // gray_pixels.data[i] = rgb;
//             // gray_pixels.data[i + 1] = rgb;
//             // gray_pixels.data[i + 2] = rgb;
//             // gray_pixels.data[i + 3] = pixels.data[i + 3];

//             raw[j] = rgb;
//             j++;
//         }
//     }
// };


class GrayData {
    constructor(pixels) {
        if (!(pixels instanceof ImageData)) {
            throw new Error('This is not an "ImageData" Object!');
        }
        if ( pixels.height < pixels.width ) {
            throw new Error();
        }

        this.width = pixels.width;
        this.height = pixels.height;

        let data = new Uint8ClampedArray( Math.floor( pixels.data.length / 4 ) );
        let j = 0;

        for (let y = 0; y < pixels.height; y++) {
            for (let x = 0; x < pixels.width; x++) {
                const i = (y * 4) * pixels.width + x * 4;
                const gray = Math.round( ( pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2] ) / 3 );

                data[j] = gray;
                j++;
            }
        }

        this.data = data;
    }

    computeEntropy() {
        let debug = [];
        let result = {
            row: 0,
            entropy: 0
        };


        const number_of_pixels_all = this.width ** 2;
        const n = number_of_pixels_all;


        let k = 0;
        while ( k <= ( this.height - this.width ) ) {
            const start_byte = k * this.width;
            const end_byte = start_byte + number_of_pixels_all;

            const number_of_pixels_level = new Uint32Array(256);
            this.data.slice(start_byte, end_byte)
                     .forEach(v => number_of_pixels_level[v] += 1);

            let entropy = 0;
            for (let ni of number_of_pixels_level) {
                if (ni === 0) continue;

                const pi = ni / n;
                entropy = entropy - ( pi * Math.log2(pi) );
            };

            if (DEBUG) {
                debug.push({
                    box: [k, 0, this.width, this.width],
                    entropy
                });
            }

            if (entropy > result.entropy) {
                result.row = k;
                result.entropy = entropy;
            };
            if (this.width === this.height) break;

            k++;
        }


        if (DEBUG) {
            console.debug(debug);
        }
        return result;
    }
}


export const toThumbnail = async (file, { outputSize = 512, inputSize = 256, type = 'image/jpeg', quality = 0.8 } = {}) => {
    let result = {
        row: 0,
        entropy: null
    };


    outputSize = Number(outputSize);
    if (outputSize <= 0) {
        outputSize = 512;
    }

    inputSize = Number(inputSize) || 256;
    if (inputSize <= 0) {
        inputSize = 256
    }


    const pixels = await file2imagedata(file, { size: inputSize });
    let _pixels = pixels;
    if (_pixels.width > _pixels.height) {
        _pixels = transpose(pixels);
    }


    if (_pixels.width !== _pixels.height) {
        const gray = new GrayData(_pixels);
        result = gray.computeEntropy();
    }


    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const promise = new Promise((resolve, reject) => {
        const img = new Image();

        img.src = URL.createObjectURL(file);
        img.onerror = reject;
        img.onload = _ => {
            let [sx, sy, sWidth, sHeight] = [0, 0, img.naturalWidth, img.naturalHeight];

            canvas.width = Math.min(outputSize, img.naturalWidth, img.naturalHeight);
            canvas.height = canvas.width;

            if (sWidth <= sHeight) {
                sy += Math.floor(result.row * sHeight / pixels.height);
            } else {
                sx += Math.floor(result.row * sWidth / pixels.width);
            }
            if (sWidth <= sHeight) {
                sHeight = sWidth;
            } else {
                sWidth = sHeight;
            }

            if (DEBUG) {
                console.debug(pixels.width, pixels.height);
                console.debug(sx, sy, sWidth, sHeight, canvas.width, canvas.height);
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                resolve(blob);
            }, type, quality);
        }
    });

    return await promise;
};
