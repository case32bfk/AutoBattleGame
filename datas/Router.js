const Router = {
    routes: {},
    currentRoute: null,
    defaultRoute: 'training',

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        
        if (!window.location.hash) {
            window.location.hash = '#' + this.defaultRoute;
        } else {
            this.handleRoute();
        }
    },

    register(route, handler) {
        this.routes[route] = handler;
    },

    navigate(route) {
        window.location.hash = '#' + route;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        const route = hash.split('?')[0];
        
        if (this.currentRoute && this.routes[this.currentRoute]) {
            const prevHandler = this.routes[this.currentRoute];
            if (prevHandler.onLeave) {
                prevHandler.onLeave();
            }
        }

        this.currentRoute = route;
        
        const handler = this.routes[route];
        if (handler) {
            if (handler.onBeforeEnter) {
                handler.onBeforeEnter().then(() => {
                    this.renderRoute(handler);
                });
            } else {
                this.renderRoute(handler);
            }
        } else {
            this.navigate(this.defaultRoute);
        }
    },

    renderRoute(handler) {
        const container = document.getElementById('app');
        if (handler.getHTML) {
            container.innerHTML = handler.getHTML();
        }
        if (handler.onMount) {
            handler.onMount();
        }
    },

    getParam(key) {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.split('?')[1] || '');
        return params.get(key);
    }
};

window.Router = Router;
