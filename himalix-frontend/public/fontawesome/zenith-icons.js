(function () {
    let basePath = '/fontawesome/';
    const FA_BASE_URL = basePath + 'css/';
    const coreStyles = ['fontawesome.css'];
    
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    coreStyles.forEach(style => loadCSS(FA_BASE_URL + style));

    const lazyStyles = [
        'solid.css', 'regular.css', 'light.css', 'brands.css',
        'sharp-solid.css', 'sharp-regular.css', 'sharp-light.css'
    ];

    const loadDeferredStyles = () => {
        lazyStyles.forEach(style => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.media = 'print';
            link.onload = function () { this.media = 'all'; };
            link.href = FA_BASE_URL + style;
            document.head.appendChild(link);
        });
    };

    if (window.requestIdleCallback) {
        window.requestIdleCallback(loadDeferredStyles);
    } else {
        setTimeout(loadDeferredStyles, 200);
    }
})();