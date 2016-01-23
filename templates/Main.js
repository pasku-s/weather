/*
* 1.0.1
* */
var _main = {
    _arg: {
        ON_MAIN_LOAD: false,
        ON_ANIMATE: false
    }
};
(function () {
    (function () {
        if (!Event.prototype.preventDefault) {
            Event.prototype.preventDefault = function () {
                this.returnValue = false;
            };
        }
        if (!Event.prototype.stopPropagation) {
            Event.prototype.stopPropagation = function () {
                this.cancelBubble = true;
            };
        }
        if (!Element.prototype.addEventListener) {
            var eventListeners = [];

            var addEventListener = function (type, listener /*, useCapture (will be ignored) */) {
                var self = this;
                var wrapper = function (e) {
                    e.target = e.srcElement;
                    e.currentTarget = self;
                    if (listener.handleEvent) {
                        listener.handleEvent(e);
                    } else {
                        listener.call(self, e);
                    }
                };
                if (type == "DOMContentLoaded") {
                    var wrapper2 = function (e) {
                        if (document.readyState == "complete") {
                            wrapper(e);
                        }
                    };
                    document.attachEvent("onreadystatechange", wrapper2);
                    eventListeners.push({object: this, type: type, listener: listener, wrapper: wrapper2});

                    if (document.readyState == "complete") {
                        var e = new Event();
                        e.srcElement = window;
                        wrapper2(e);
                    }
                } else {
                    this.attachEvent("on" + type, wrapper);
                    eventListeners.push({object: this, type: type, listener: listener, wrapper: wrapper});
                }
            };
            var removeEventListener = function (type, listener /*, useCapture (will be ignored) */) {
                var counter = 0;
                while (counter < eventListeners.length) {
                    var eventListener = eventListeners[counter];
                    if (eventListener.object == this && eventListener.type == type && eventListener.listener == listener) {
                        if (type == "DOMContentLoaded") {
                            this.detachEvent("onreadystatechange", eventListener.wrapper);
                        } else {
                            this.detachEvent("on" + type, eventListener.wrapper);
                        }
                        eventListeners.splice(counter, 1);
                        break;
                    }
                    ++counter;
                }
            };
            Element.prototype.addEventListener = addEventListener;
            Element.prototype.removeEventListener = removeEventListener;
            if (HTMLDocument) {
                HTMLDocument.prototype.addEventListener = addEventListener;
                HTMLDocument.prototype.removeEventListener = removeEventListener;
            }
            if (Window) {
                Window.prototype.addEventListener = addEventListener;
                Window.prototype.removeEventListener = removeEventListener;
            }
        }
    })();

    var scripts = [
        'http://threejs.org/build/three.min.js',
        '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js',
        'http://mrdoob.github.io/three.js/examples/js/cameras/CombinedCamera.js',
        'http://mrdoob.github.io/three.js/examples/js/renderers/CanvasRenderer.js',
        'http://threejs.org/examples/js/controls/OrbitControls.js',
        'http://threejs.org/examples/js/Detector.js',
        'http://threejs.org/examples/js/loaders/DDSLoader.js',
        'http://threejs.org/examples/js/loaders/MTLLoader.js',
        'http://threejs.org/examples/js/loaders/OBJMTLLoader.js',
    ];

    function Main(arg) {
        var _t = this;
        _t.webglEl = {
            textures: (arg.textures ? arg.textures : []),
            objFiles: (arg.objFiles ? arg.objFiles : []),
            jsnFiles: (arg.jsnFiles ? arg.jsnFiles : []),
            cntrName: (arg.containerName ? arg.containerName : 'THREEJS'),
            gl: (arg.render ? arg.render : THREE.WebGLRenderer),
            cntrls: (arg.controls ? arg.controls : THREE.OrbitControls),
            axisHelper: arg.axisHelper,
            animate: arg.ON_ANIMATE,
            loadedObj: [],
            loadedJson: [],
            loadedTexture: []
        };
        _t.utils = {
            _SW: function () {
                return _t.webglEl.container.offsetWidth;
            },
            _SH: function () {
                return _t.webglEl.container.offsetHeight;
            },
            loadObj: function (objUrl, mtlUrl, onLoad) {
                var manager = new THREE.LoadingManager(),
                    loader = new THREE.OBJLoader(manager),
                    mtlUrl = mtlUrl ? mtlUrl : 'http://threejs.org/examples/obj/male02/male02_dds.mtl',
                    m = _t.utils;
                loader.load(url, function (object) {
                    loadedObj.push(object);
                    if (Main.isFunction(onLoad))onLoad();
                }, m.onProgress, m.onError);
            },
            loadJson: function (url, succses, error, always) {
                $.getJSON(url
                ).done(function (data) {
                        loadedObj.push(data);
                        if (Main.isFunction(succses))succses();
                    }).fail(function (er) {
                        console.log("error " + er);
                        if (Main.isFunction(error))error();
                    }).always(function () {
                        if (Main.isFunction(always))always();
                    });
            },
            loadTexture: function (url, succses, error) {
                new THREE.TextureLoader().load(url, function (data) {
                    loadedTexture.push(data);
                    if (Main.isFunction(succses))succses();
                }, false, function () {
                    if (Main.isFunction(error))error();
                })
            },
            onProgress: function (xhr) {
                if (xhr.lengthComputable) {
                    var percentComplete = xhr.loaded / xhr.total * 100;
                    console.log(Math.round(percentComplete, 2) + '% downloaded');
                }
            },
            onError: function (xhr) {
                console.log(xhr);
            },
            getIntersectObject: function (event,arr) {
                var ap =  _t.webglEl,
                    canvasW = _t.utils._SW(),
                    canvasH = _t.utils._SH();
                ap.mouseVector.x = ( (event.x ) / canvasW) * 2 - 1;
                ap.mouseVector.y = -( (event.y ) / canvasH) * 2 + 1;

                ap.raycaster.setFromCamera(ap.mouseVector, ap.camera);
                if (arr) {
                    var intersexr = ap.raycaster.intersectObjects(arr)[0];
                   return intersexr;
                }
                return false;
            },

        };
        _t.events = {
            ON_WHEEL: 'onwheel',
            ON_MOUSE_UP: 'mouseup',
            ON_MOUSE_DOWN: 'mousedown',
            ON_DOUBLE_CLICK: 'dblclick',
            ON_MOUSE_MOVE: 'mousemove',
            add: function (dom, callback, isCreate, type) {
                switch (type) {
                    case 'onwheel':
                    {
                        if (dom['onwheel']) {
                            type = type;
                        } else if (dom['onmousewheel']) {
                            type = 'onmousewheel';
                        } else if (dom['mousewheel']) {
                            type = 'mousewheel';
                        } else if (dom['MozMousePixelScroll']) {
                            type = 'MozMousePixelScroll';
                        }
                        break;
                    }
                }
                if (isCreate) {
                    if (dom.addEventListener) {
                        dom.addEventListener(type, callback);
                    } else if (dom.attachEvent) {
                        dom.attachEvent(type, callback);
                    }
                } else {
                    if (dom.removeEventListener) {
                        dom.removeEventListener(type, callback);
                    } else if (dom.detachEvent) {
                        dom.detachEvent(type, callback)
                    }
                }
            }

        };

        var loadFinish = function () {

            var _wbgl = _t.webglEl,
                _m = _t.utils,
                _w = 0,
                _h = 0,
                scene,
                gl,
                camera,
                controls,
                container;

            if (_wbgl.cntrExist) {
                container = document.getElementById(_wbgl.cntrName);
            } else {
                container = document.createElement('div');
                document.body.appendChild(container);
                container.style.width = container.style.height = '100%';
                container.style.position = 'absolute';
                container.id = _wbgl.cntrName;
                container.style.left = '0';
                container.style.top = '0';
            }
            _wbgl.container = container;
            _w = _m._SW();
            _h = _m._SH();
            scene = _wbgl.scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0xe3cab3, 500, 1000);

            var rendPrm = {preserveDrawingBuffer: true, antialias: true, alpha: true};
            if (_wbgl.gl == THREE.WebGLRenderer && webglAvailable()) {
                gl = _wbgl.gl = new THREE.WebGLRenderer(rendPrm);
            } else {
                gl = _wbgl.gl = new THREE.CanvasRenderer(rendPrm);
            }
            gl.setClearColor(0xe3cab3, 0);
            gl.setPixelRatio(window.devicePixelRatio);
            gl.setSize(_w, _h);
            container.appendChild(gl.domElement);

            var viewDst = _wbgl.viewDst = 1000;

            //camera = _wbgl.camera = new THREE.CombinedCamera(_m._SW()/2,_m._SH()/2, 70, 1, viewDst, -500, viewDst);
            _wbgl.cameraO = new THREE.OrthographicCamera(_w / -2, _w / 2, _h / 2, _h / -2, -500, viewDst * 2);
            camera = _wbgl.curCamera = _wbgl.cameraP = new THREE.PerspectiveCamera(40, (_w / _h), 0.01, viewDst * 2);
            camera.position.set(viewDst / 2, viewDst / 2, viewDst / 2);
            //camera.zoom = 1.5;

            controls = _wbgl.controls = new _wbgl.cntrls(camera, gl.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 1.1;
            controls.maxPolarAngle = 1.2;
            controls.rotateSpeed = 5.0;
            controls.zoomSpeed = 1.5;
            controls.panSpeed = 0.8;
            controls.noZoom = false;
            controls.noPan = false;
            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.3;
            controls.keys = [65, 83, 68];
            controls.minDistance = 100;
            controls.maxDistance = viewDst;
            controls.target.set(0, 0, 0);

            _wbgl.raycaster = new THREE.Raycaster();
            _wbgl.mouseVector = new THREE.Vector3();

            var axisHelper = new THREE.AxisHelper(100);
            if (_wbgl.axisHelper)scene.add(axisHelper);


            // Ambient light
            var light = new THREE.AmbientLight(0x404040); // soft white light
            scene.add(light);

            // White directional light at half intensity shining from the top.
            var keyLight = new THREE.DirectionalLight(0xffffff, 0.3);
            keyLight.position.set(1, 1, 1);
            scene.add(keyLight);

            var fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
            fillLight.position.set(-1, 0, -1);
            scene.add(fillLight);

            window.addEventListener('resize', onWindowResize, false);
            animate();

            function webglAvailable() {
                try {
                    var canvas = document.createElement('canvas');
                    return !!( window.WebGLRenderingContext && (
                    canvas.getContext('webgl') ||
                    canvas.getContext('experimental-webgl') )
                    );
                } catch (e) {
                    return false;
                }
            }

            function onWindowResize() {
                var _w = _m._SW(),
                    _h = _m._SH();
                //camera.setSize(_w, _h);
                camera.aspect = _w / _h;
                camera.updateProjectionMatrix();
                gl.setSize(_w, _h);
            }

            function animate() {
                if (_wbgl.animate && Main.isFunction(_wbgl.animate))_wbgl.animate();
                gl.clear();
                gl.render(scene, camera);
                controls.update();
                requestAnimationFrame(animate);
            }
        };
        loadFinish.onImg = function () {
            if (_t.webglEl.textures.length > 0) {
                _t.utils.loadTexture(_t.webglEl.textures.shift(), this, this);
            } else {
                this.onObj();
            }
        };
        loadFinish.onObj = function () {
            if (_t.webglEl.objFiles.length > 0) {
                _t.utils.loadObj(_t.webglEl.objFiles.shift(), this, this);
            } else {
                this.onJson();
            }
        };
        loadFinish.onJson = function () {
            if (_t.webglEl.jsnFiles.length > 0) {
                _t.utils.loadJson(_t.webglEl.jsnFiles.shift(), this, this);
            } else {
                loadFinish();
            }
        };
        loadFinish.onImg();
    }

    Main.isFunction = function (func) {
        return func instanceof Function
    };
    Main.loadScripts = function (link, ready) {
        $.getScript(link)
            .done(function (script, textStatus) {
                //onLoadScript(ready);
            })
            .fail(function (jqxhr, settings, exception) {
                console.log(jqxhr);
            }).always(function () {
                Main.onLoadScript(ready);
            });
    }
    Main.onLoadScript = function (ready) {
        if (scripts.length) {
            Main.loadScripts(scripts.shift(), ready);
        } else {
            _main._gl = new Main(_main._arg);
            if (Main.isFunction(ready))ready();
        }
    }

    $(document).ready(function () {
        Main.loadScripts(scripts.shift(), _main._arg.ON_MAIN_LOAD);
    });
})();