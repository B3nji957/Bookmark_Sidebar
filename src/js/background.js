($ => {
    "use strict";

    let background = function () {
        let bookmarkImportRunning = false;

        this.urls = {
            check404: "https://extensions.blockbyte.de/",
            updateUrls: "https://extensions.blockbyte.de/ajax/updateUrls",
            uninstall: "https://extensions.blockbyte.de/bs/uninstall"
        };


        /**
         * Sends a message to all tabs, so they are reloading the sidebar
         *
         * @param {object} opts
         * @returns {Promise}
         */
        this.refreshAllTabs = (opts) => {
            return new Promise((resolve) => {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: "refresh",
                            scrollTop: opts.scrollTop || false,
                            type: opts.type
                        });
                    });
                    resolve();
                });
            });
        };

        /**
         * Initialises the eventhandlers
         *
         * @returns {Promise}
         */
        let initEvents = async () => {
            chrome.browserAction.onClicked.addListener(() => { // click on extension icon shall open the sidebar
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSidebar"});
                });
            });

            chrome.bookmarks.onImportBegan.addListener(() => { // indicate that the import process started
                bookmarkImportRunning = true;
            });

            chrome.bookmarks.onImportEnded.addListener(() => { // indicate that the import process finished
                bookmarkImportRunning = false;
                this.refreshAllTabs({type: "Created"});
            });

            ["Changed", "Created", "Removed"].forEach((eventName) => { // trigger an event in all tabs after changing/creating/removing a bookmark
                chrome.bookmarks["on" + eventName].addListener(() => {
                    if (bookmarkImportRunning === false || eventName !== "Created") { // only refresh tabs when the bookmark was not created by the import process
                        this.refreshAllTabs({type: eventName});
                    }
                });
            });
        };

        /**
         * Initialises the helper objects
         */
        let initHelpers = () => {
            this.helper = {
                model: new window.ModelHelper(this),
                bookmarkApi: new window.BookmarkApi(this),
                language: new window.LanguageHelper(this),
                updates: new window.UpdatesHelper(this),
                viewAmount: new window.ViewAmountHelper(this),
                entries: new window.EntriesHelper(this),
                port: new window.PortHelper(this),
                cache: new window.CacheHelper(this),
                analytics: new window.AnalyticsHelper(this)
            };
        };

        /**
         *
         */
        this.run = () => {
            chrome.runtime.setUninstallURL(this.urls.uninstall);
            initHelpers();
            let start = +new Date();

            Promise.all([
                this.helper.model.init(),
                this.helper.analytics.init(),
                this.helper.bookmarkApi.init()
            ]).then(() => {
                return Promise.all([
                    initEvents(),
                    this.helper.port.init(),
                    this.helper.updates.init(),
                    this.helper.entries.update()
                ]);
            }).then(() => {
                console.log("LOADED", +new Date() - start)
            });
        };
    };

    new background().run();
})(jsu);