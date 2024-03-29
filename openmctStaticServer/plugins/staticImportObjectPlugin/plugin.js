import StaticModelProvider from './StaticModelProvider.js';

/**
 * Static Root Plugin: takes an export file and exposes it as a new root
 * object.
 */
function StaticImportObjectPlugin(namespace, exportUrl, rootLocation) {

    const rootIdentifier = {
        namespace: namespace,
        key: 'root'
    };

    let cachedProvider;

    function loadProvider() {
        return fetch(exportUrl)
            .then(function (response) {
                return response.json();
            })
            .then(function (importData) {
                cachedProvider = new StaticModelProvider(importData, rootIdentifier, rootLocation);

                return cachedProvider;
            });
    }

    function getProvider() {
        if (!cachedProvider) {
            cachedProvider = loadProvider();
        }

        return Promise.resolve(cachedProvider);
    }

    return function install(openmct) {
        openmct.objects.addProvider(namespace, {
            get: function (identifier) {
                return getProvider().then(function (provider) {
                    return provider.get(identifier);
                });
            }
        });
    };
}

export default StaticImportObjectPlugin;
