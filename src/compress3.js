"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = () => sharp({ animated: false, unlimited: true });

async function compress(req, res, input) {
  const format = 'avif';

  /*
   * Determine the uncompressed image size when there's no content-length header.
   */

  /*
   * input.pipe => sharp (The compressor) => Send to httpResponse
   * The following headers:
   * |  Header Name  |            Description            |           Value            |
   * |---------------|-----------------------------------|----------------------------|
   * |x-original-size|Original photo size                |OriginSize                  |
   * |x-bytes-saved  |Saved bandwidth from original photo|OriginSize - Compressed Size|
   */

  // Wrap the buffer processing in a promise to use await
  const bufferPromise = new Promise((resolve, reject) => {
    input.data.pipe(sharpStream()
      .grayscale(req.params.grayscale)
      .toFormat(format, {
        quality: req.params.quality,
        effort: 0,
      }))
      .toBuffer((err, output, info) => {
        if (err) {
          reject(err);
        } else {
          resolve({ output, info });
        }
      });
  });

  try {
    const { output, info } = await bufferPromise;

    res.setHeader('content-type', 'image/' + format);
    res.setHeader('content-length', info.size);
    res.setHeader('x-original-size', req.params.originSize);
    res.setHeader('x-bytes-saved', req.params.originSize - info.size);
    res.status(200);
    res.write(output);
    res.end();
  } catch (err) {
    redirect(req, res);
  }
}

module.exports = compress;
