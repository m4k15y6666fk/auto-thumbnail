# auto-thumbnail

**rectangle image -> square image**

**長方形の画像 -> 正方形の画像**

## Summary / 概要

Auto thumbnail (squared thumbnail) image generator with entropy.

エントロピーによってサムネイル画像（正方形）を生成するスクリプト


## Usage / 使い方

### Install

```bash
# install all sources into "auto-thumbnail" directory in your current path
git clone "https://github.com/m4k15y6666fk/auto-thumbnail.git"
```

### Use in your JavaScript

```js
// import the module
import { toThumbnail } from "./auto-thumbnail/index.js";

// convert image file (File Object) to thumbnail (File Object)
// File - https://developer.mozilla.org/en-US/docs/Web/API/File
const thumbnail = await toThumbnail(
    file, // File Object - https://developer.mozilla.org/en-US/docs/Web/API/File
    {
        outputSize: 512, // thumbnail size (width & height)
        inputSize: 256, // [CAUTION] This value is only using when computing entropy.
        type: 'image/jpeg', // MIME type of output thumbnail 
        quality: 0.8 // compression level of thumbnail (range: 0.0 - 1.0)
    }
);


/* Other Methods for adovanced operation */

import { file2imagedata, transpose } from "./auto-thumbnail/index.js";

// convert image file (File Object) into ImageData
// ImageData Object - https://developer.mozilla.org/en-US/docs/Web/API/ImageData
const pixels = await file2imagedata(
    file, // File
    {
        size: -1
        // minimum side of output (width OR height)
        // "-1" is meaning of input size and output size is equivalant.
    }
);

// transpose imageData
const transposed_imagedata = transpose(
    pixels // imageData
)
```


## Donate / ご支援

### OFUSE

[https://ofuse.me/m4k15y6666fk](https://ofuse.me/m4k15y6666fk)
