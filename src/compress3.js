"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and cache settings
sharp.concurrency(1);
sharp.cache(false);

const sharpStream = () => sharp({ animated: false, unlimited: true });

function compress(req, res, input) {
  const format = 'webp';

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
  input.data.pipe(
    sharpStream()
      .grayscale(req.params.grayscale)
      .toFormat(format, {
        quality: req.params.quality,
        effort: 0,
      })
      .toBuffer()
      .then((output, info) => {
        // Check for errors, missing info, or if headers are already sent
        if (!info || res.headersSent) {
          return redirect(req, res);
        }

        res.setHeader('content-type', 'image/' + format);
        res.setHeader('content-length', info.size);
        res.setHeader('x-original-size', req.params.originSize);
        res.setHeader('x-bytes-saved', req.params.originSize - info.size);
        res.status(200);
        res.write(output);
        res.end();
      })
      .catch((err) => {
        // Check for errors or if headers have already been sent
        if (err || res.headersSent) {
          return redirect(req, res);
        }
      })
  );
}

module.exports = compress;
