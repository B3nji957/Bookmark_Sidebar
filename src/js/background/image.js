($ => {
    "use strict";

    $.ImageHelper = function (b) {

        let cache = {};
        let isSaving = false;

        /**
         *
         * @returns {Promise}
         */
        this.init = () => {
            return new Promise((resolve) => {
                $.api.storage.local.get(["imageCache"], (obj) => {
                    cache = obj.imageCache || {};
                    resolve();
                });
            });
        };

        /**
         * Returns the data url of the favicon of the given url
         *
         * @param {object} opts
         * @returns {Promise}
         */
        this.getFavicon = (opts) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    canvas.width = this.width;
                    canvas.height = this.height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0);

                    const dataUrl = canvas.toDataURL("image/png");
                    resolve({img: dataUrl});
                };
                img.crossOrigin = "anonymous";
                img.src = "chrome://favicon/size/16@2x/" + opts.url;
            });
        };

        /**
         * Returns the cached image string for the given url if available
         *
         * @param {string} type
         * @param {string} url
         * @returns {string|null}
         */
        const getCachedValue = (type, url) => {
            if (cache[type + "_" + url]) {
                return cache[type + "_" + url].d;
            } else {
                return null;
            }
        };

        /**
         * Stored the given image string for the given url in the storage
         *
         * @param {string} type
         * @param {string} url
         * @param {string} data
         * @returns {Promise}
         */
        const updateImageCache = (type, url, data) => {
            cache[type + "_" + url] = {t: +new Date(), d: data};

            if (isSaving === false) {
                isSaving = true;
                const now = +new Date();

                Object.keys(cache).forEach((key) => {
                    if (now - cache[key].t > 1000 * 60 * 60 * 24 * 5) { // older than 5 days
                        delete cache[key];
                    }
                });

                return new Promise((resolve) => {
                    $.api.storage.local.set({
                        imageCache: cache
                    }, () => {
                        isSaving = false;
                        resolve();
                    });
                });
            }
        };
    };

})(jsu);