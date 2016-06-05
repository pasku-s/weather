var app = function () {
    this.methods = {
        types: {
            container: false,
            camera: false,
            scene: false,
            renderer: false,
            mesh: false, geometry: false, material: false,
            mouseX: 0,
            mouseY: 0,
            start_time: Date.now(),
            texture: {},
            windowHalfX: window.innerWidth / 2,
            windowHalfY: window.innerHeight / 2,
            cloudsDistance: [3000],
            storm: true,
            effects: ['blueSky', 'darkSky'],
            sound: ['http://vaalentin.github.io/2015/app/public/sounds/wind.mp3'],
            triggerEffect: 1,
            shaderRenderEnabled: false,
            infoActive: false,
            currentEffect: 0,
            currentLevel: 0,
            lastIndex: 0,
            direction: 1,
            zipperActive: false
        },
        init: function () {
            // Bg gradient
            this.drawBack();
            var container = this.types.container = document.getElementById('THREEJS')//document.createElement('div');
            /* document.body.appendChild(container);
             $(container).css(
             {
             'z-index': 1,
             position: 'absolute',
             top: 0,
             left: 0,
             backgroundSize: '32px 100%'
             }
             );*/

            var camera = this.types.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
            var scene = this.types.scene = new THREE.Scene();
            var renderer = this.types.renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: false,
                alpha: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.autoClear = false;
            renderer.setClearColor(0x0a014c, 0);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);

            //shader effects
            var composer = this.types.composer = new THREE.EffectComposer(renderer);
            var renderPass = this.types.renderPass = new THREE.RenderPass(scene, camera);
            composer.addPass(renderPass);
            var colorifyPass = this.types.colorifyPass = new THREE.ShaderPass(THREE.ColorifyShader);
            composer.addPass(colorifyPass);
            var copyPass = new THREE.ShaderPass(THREE.CopyShader);
            //colorifyPass.renderToScreen = true;
            copyPass.renderToScreen = true;
            composer.addPass(copyPass);
            jQuery('.' + loadProcess).animate({width: (loadIter.val += loadIter.step) * loadIter.st + '%'});

            this.addEvents();
            this.drawClouds();
            this.setCloudsView(this.types.effects[0]);
            this.drawRain(false);
            this.buildScroll();
            this.triggerEffects();
            this.animate();

            this.types.sound = [new app.Sound([this.types.sound])];
            var parent = jQuery('.' + loadProcess).animate({width: (loadIter.val += loadIter.step) * loadIter.st + '%'}).parent();
            var setIn = setInterval(function () {
                if ((window.innerWidth - 200) < jQuery('.' + loadProcess).width()) {
                    jQuery(parent).fadeOut();
                    ap.methods.types.infoActive = true;
                    clearInterval(setIn);
                }
            }, 100)

        },
        drawClouds: function () {
            var geometry = new THREE.Geometry();
            var texture = textures[0],
                t = ap.methods.types,
                dist = t.cloudsDistance[0];
            texture.magFilter = THREE.LinearMipMapLinearFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;

            var material = new THREE.ShaderMaterial({
                uniforms: {
                    "map": {type: "t", value: texture},
                    "fogColor": {type: "c", value: 0x000000},
                    "fogNear": {type: "f", value: 0},
                    "fogFar": {type: "f", value: 0}

                },
                vertexShader: document.getElementById('vs').textContent,
                fragmentShader: document.getElementById('fs').textContent,
                depthWrite: false,
                depthTest: false,
                transparent: true

            });
            var plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));
            for (var i = 0; i < dist; i++) {
                plane.position.x = Math.random() * 1000 - 500;
                plane.position.y = -Math.random() * Math.random() * 200 - 15;
                plane.position.z = i;
                plane.rotation.z = Math.random() * Math.PI;
                plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
                plane.updateMatrix();
                geometry.merge(plane.geometry, plane.matrix);
            }
            var clouds = ap.methods.types.clouds = new THREE.Object3D(),
                mesh = new THREE.Mesh(geometry, material);
            clouds.add(mesh);
            mesh = mesh.clone();
            mesh.position.z = -dist;
            clouds.add(mesh);
            t.scene.add(clouds);
            jQuery('.' + loadProcess).animate({width: (loadIter.val += loadIter.step) * loadIter.st + '%'});
        },
        setCloudsView: function (type) {
            var fog = false,
                pstClouds = 0,
                bodyBack = '#000000',
                containerBack = '#000000',
                m = ap.methods,
                t = m.types,
                rain = false;
            if (t.lastTypeView == type)return;
            t.lastTypeView = type;
            switch (type) {
                case 'blueSky':
                {
                    fog = new THREE.Fog(0x4584b4, -100, 3000);
                    containerBack = t.texture.blueSky;
                    bodyBack = '#326696';
                    t.shaderRenderEnabled = false;
                    break;
                }
                case 'darkSky':
                {
                    fog = new THREE.Fog(0x575757, -100, 400);
                    pstClouds = -150;
                    containerBack = t.texture.darkSky;
                    bodyBack = '#575757';
                    t.colorifyPass.uniforms["color"].value.setRGB(0, 0, 0);
                    t.shaderRenderEnabled = true;
                    rain = true;
                    break;
                }
            }
            if (fog) {
                var childs = t.clouds.children;
                for (var i = 0; i < childs.length; i++) {
                    childs[i].material.uniforms.fogColor.value = fog.color;
                    childs[i].material.uniforms.fogNear.value = fog.near;
                    childs[i].material.uniforms.fogFar.value = fog.far;
                }

                m.drawRain(rain);
                $('body').css('background-color', bodyBack);
                $(t.container).css('background', containerBack);
                //t.camera.position.y = t.currentLevel =pstClouds;
                t.currentLevel = pstClouds;
                m.events.onDocumentMouseMove({clientX: 0, clientY: 0});
            }

            $('.circleActive').removeClass('circleActive');
            var circle = document.getElementsByClassName('circle')[t.currentEffect];
            if (circle) circle.className += ' circleActive';

        },
        drawBack: function () {
            var canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = window.innerHeight;
            var context = canvas.getContext('2d');
            var gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            //blusky
            gradient.addColorStop(0, "#1e4877");
            gradient.addColorStop(0.5, "#4584b4");
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            this.types.texture.blueSky = 'url(' + canvas.toDataURL('image/png') + ')';
            //darksky
            var gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#7d7e7d");
            gradient.addColorStop(0.5, "#0e0e0e ");
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            this.types.texture.darkSky = 'url(' + canvas.toDataURL('image/png') + ')';
        },
        drawRain: function (flag) {///x [-150,150],y[-50,50]
            var t = ap.methods.types, rain = t.rain;
            if (!rain) {
                console.log('rain create');
                var vertices = [], step = -t.cloudsDistance + (t.cloudsDistance * 0.85),
                    min = 1, max = 8;
                for (var i = step; i < 0;) {
                    for (var x = -150; x < 150;) {
                        for (var y = -50; y < 50;) {
                            y += this.randomInteger(min, max);
                            vertices.push(new THREE.Vector3(x, y, i));
                        }
                        x += this.randomInteger(min, max);
                    }
                    i += this.randomInteger(min, max);
                }
                var geom = new THREE.Geometry();
                geom.vertices = vertices;
//                    var materials = new THREE.PointsMaterial({size: 0.1,color:0x575757,transparent:true,opacity:0.4});
                var materials = new THREE.PointsMaterial({
                    color: 0x575757,
//                        size: 1.5,
                    map: textures[1],
//                        blending: THREE.AdditiveBlending,
                    opacity: 0.7,
                    transparent: true
                });
//                    ap.methods.types.rain=  rain = new THREE.Points(geom,materials);
                ap.methods.types.rain = rain = new THREE.Points(geom, materials);
//                    ap.methods.types.rain.add(rain);
                /* for(var i=0;i<4;i++){
                 var copy =  rain.clone();
                 copy.position.z = (i*step)+step/2;
                 ap.methods.types.rain.add(copy);
                 }*/
                t.scene.add(ap.methods.types.rain);
            }
            rain.visible = flag;
            t.zipperActive = flag;
            if (flag) {
                this.drawZipper();
            }
            /*setTimeout(function () {
             ap.methods.enableRainDay(flag);
             }, 100)*/

        },
        enableRainDay: function (flag) {
            var typ = ap.methods.types,
                image = document.getElementById('background');
            image.onload = function () {
                var engine = new RainyDay({
                    image: this
                });
                engine.rain([[3, 2, 2]], 100);
                engine.rain(
                    [
                        [10, 0, 10],         // add 20 drops of size 1...
                        [3, 3, 1]           // ... and 1 drop of size from 3 - 6 ...
                    ], 100);
            };
            image.crossOrigin = 'anonymous';
            image.src = 'assets/data/img/WUn1EiV.png';
            setTimeout(function () {
                document.getElementById('RainyDay').addEventListener('mousemove', ap.methods.events.onDocumentMouseMove, false);

            }, 100);
        },
        drawZipper: function (flag) {
            var time = flag ? 0 : this.randomInteger(500, 2000);
            setTimeout(function () {
                var m = ap.methods,
                    webglObj = m.types,
                    zipperGeometry = new THREE.BufferGeometry(),
                    points = [],
                    _z = {min: 0, max: 10},
                    _x = {min: -150, max: 150, delta: 5},
                    _y = {min: -350, max: -10, delta: 10},
                    curX = m.randomInteger(_x.min, _x.max),
                    curY = m.randomInteger(_y.min, _y.max);

                for (var i = 0; i < _y.max - curY; i += 0.2) {
                    curY += m.randomInteger(0, _y.delta)
                    points.push([curX + m.randomInteger(-_x.delta, _x.delta), curY, m.randomInteger(_z.min, _z.max)]);
                }

                var vertices = new Float32Array(points.length * 3);
                for (var is = 0; is < points.length; is++) {
                    vertices[is * 3 + 0] = points[is][0];
                    vertices[is * 3 + 1] = points[is][1];
                    vertices[is * 3 + 2] = points[is][2];
                }
                zipperGeometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
                var zipperMesh = ap.methods.types.zipperMesh = new THREE.Line(zipperGeometry, new THREE.LineBasicMaterial({
                    linewidth: 2,
                    color: '#ffffff',
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide
                }));
                zipperGeometry.setDrawRange(0, points.length - 1);
                zipperMesh.updateMatrixWorld(true);
                zipperMesh.position.z = webglObj.camera.position.z - m.randomInteger(50, 350);
                webglObj.scene.add(zipperMesh);
                flashColor = 1;
                webglObj.colorifyPass.uniforms["color"].value.setRGB(flashColor, flashColor, flashColor);
            }, time);
        },
        animate: function () {
            var methds = ap.methods, a = methds.types;
            var position = ( ( Date.now() - a.start_time ) * 0.03 ) % a.cloudsDistance;

            a.camera.position.x += ( a.mouseX - a.camera.position.x ) * 0.01;
            a.camera.position.y += ( -a.mouseY - a.camera.position.y ) * 0.01;
            //console.log(a.camera.position.y,a.mouseY);
            a.camera.position.z = -position + a.cloudsDistance;
            //storm effect
            if (a.rain && a.rain.visible) {
                a.rain.rotation.z += 0.01;
                a.rain.position.set(a.camera.position.x + 40, a.camera.position.y, a.camera.position.z + 50);
                if (a.zipperMesh) {
                    if (a.zipperMesh.material.opacity > 0.3) {
                        a.zipperMesh.material.opacity -= 0.05;
                        a.storm = true;

                    } else {
                        a.scene.remove(a.zipperMesh);
                        a.zipperMesh = false;
                        if (a.storm && a.zipperActive) {
                            methds.drawZipper();
                            a.storm = false;
                        }

                    }
                    if (flashColor > 0) {
                        flashColor -= flashSpeed;
                        a.colorifyPass.uniforms["color"].value.setRGB(flashColor, flashColor, flashColor);
                        if (flashColor <= 0) {
                            flashColor = 0;
                        }
                    }

                }
            } else if (a.zipperMesh) {
                if (a.zipperMesh) {
                    a.scene.remove(a.zipperMesh);
                    a.zipperMesh = false;
                }
            }
            //set render
            if (a.shaderRenderEnabled) {
            a.composer.render();
            } else {
                a.renderer.render(a.scene, a.camera);
            }
            if ((position + 2200) > a.cloudsDistance)ap.methods.types.start_time = Date.now();
            requestAnimationFrame(ap.methods.animate);
        },
        smoothFlipped: function (bgn, end, update) {
            var tween = new TWEEN.Tween({alpha: 0}).to({alpha: 1}, 5000)
                .easing(TWEEN.Easing.Linear.None)
                .onUpdate(function () {

                    bgn.lerp(end, this.alpha);
                    console.log('test');
                    if (update)update.call(this, this, tween);
                }).start();
        },
        randomInteger: function (min, max) {
            var rand = min + Math.random() * (max - min)
            rand = Math.round(rand);
            return rand;
        },
        buildScroll: function () {
            var t = this.types,
                CIRCLE_CLASS = t.CIRCLE_CLASS = 'circle',
                CIRCLE_ACTIVE = t.CIRCLE_ACTIVE = ' circleActive',
                SCROLLBAR = t.SCROLLBAR = 'scrollbar',
                CIRCLE_CONTAINER = t.CIRCLE_CONTAINER = 'circleContain',
                scrollBar = this.types.scrollBar = document.createElement('div');

            document.body.appendChild(scrollBar);
            scrollBar.id = scrollBar.className = SCROLLBAR;
            var circleContain = document.createElement('div');
            circleContain.className = CIRCLE_CONTAINER;
            scrollBar.appendChild(circleContain);
            for (var i = 0; i < t.effects.length; i++) {
                var circle = document.createElement('div');
                circleContain.appendChild(circle);
                circle.className = CIRCLE_CLASS;
                if (i == 0)  circle.className += CIRCLE_ACTIVE;
            }

            jQuery('.' + CIRCLE_CLASS).bind('mouseup', function () {
                var m = ap.methods,
                    t = m.types,
                    lastIndex = t.lastIndex,
                    curIndex = $(this).index(),
                    interv = curIndex - lastIndex,
                    curDirection = (interv > 0 ? m.events.scroll.down : m.events.scroll.up),
                    iter = Math.abs(interv);
                t.lastIndex = curIndex;

                for (var i = 0; i < iter; i++) {
                    setTimeout(function () {
                        curDirection();
                    }, i * 100);
                }
            });
            //jQuery('.'+loadProcess).animate({ width: (loadIter.val+=loadIter.step)*loadIter.st+'%' });
        },
        triggerEffects: function () {
            var trigger = 'trigger',
                heads = 'heads',
                tails = 'tails',
                arrow = 'trigger__info--arrow',
                about_me = 'trigger__info--tails',
                t = ap.methods.types;
            t.headsTrfnsDft = 0;
            t.tailsTrfnsDft = 0;

            $('.' + trigger)
                .mouseenter(function () {
                    var hTr = t.headsTrfnsDft + 0,
                        tTr = t.tailsTrfnsDft + 0;
                    if (t.triggerEffect % 2 == 0) {
                        hTr += 50;
                        tTr += 50;
                    } else {
                        hTr += -50;
                        tTr += 50;
                    }
                    $('.' + heads).animate({transform: 'translateY(' + hTr + 'px)'});
                    $('.' + tails).animate({transform: 'translateY(' + tTr + 'px)'});
                    $('.' + arrow).animate({opacity: 0});
                })
                .mouseleave(function () {
                    $('.' + heads).animate({transform: 'translateY(' + t.headsTrfnsDft + 'px)'});
                    $('.' + tails).animate({transform: 'translateY(' + t.tailsTrfnsDft + 'px)'});
                    $('.' + arrow).animate({opacity: 0.5});
                })
                .mouseup(function () {
                    var b = 0,
                        top = 'auto',
                        del = 0,
                        tH = $('.' + tails).height() + del,
                        hH = $('.' + heads).height() + del,
                        opac = 0;


                    if (++t.triggerEffect % 2 == 0) {
                        b = 'auto';
                        top = 0;
                        t.headsTrfnsDft = -hH;
                        t.tailsTrfnsDft = -hH;
                        $('.' + t.SCROLLBAR).fadeOut(100);
                        $('iframe').fadeIn();
                    } else {
                        t.headsTrfnsDft = 0;
                        t.tailsTrfnsDft = 0;
                        $('.' + t.SCROLLBAR).fadeIn(1000);
                        $('iframe').fadeOut();
                        opac = 1;
                    }

                    $('.' + heads).animate({transform: 'translateY(' + ( t.headsTrfnsDft) + 'px)'});
                    $('.' + tails).animate({transform: 'translateY(' + t.tailsTrfnsDft + 'px)'});
                    $('.' + about_me).animate({opacity: opac});
                    $(this).css({top: top, bottom: b});
                    t.infoActive = opac;
                });
        },
        addEvents: function () {
            var t = this.types,
                elem = t.renderer.domElement,
                onWheel = this.events.onWheel;
            elem.addEventListener('mousemove', this.events.onDocumentMouseMove, false);
            window.addEventListener('resize', this.events.onWindowResize, false);
            if (elem.addEventListener) {
                if ('onwheel' in document) {
                    // IE9+, FF17+, Ch31+
                    elem.addEventListener("wheel", onWheel);
                } else if ('onmousewheel' in document) {
                    // устаревший вариант события
                    elem.addEventListener("mousewheel", onWheel);
                } else {
                    // Firefox < 17
                    elem.addEventListener("MozMousePixelScroll", onWheel);
                }
            } else { // IE8-
                elem.attachEvent("onmousewheel", onWheel);
            }
        },
        events: {
            onDocumentMouseMove: function (event) {
                var a = ap.methods.types;
                a.mouseX = ( event.clientX - a.windowHalfX ) * 0.25;
                a.mouseY = ( event.clientY - (a.windowHalfY) ) * 0.15 - a.currentLevel;
            },
            onWheel: function (e) {
                var m = ap.methods, t = m.types,
                    bgn = t.camera.position,
                    endCameraMove = bgn.clone(),
                    delta = 2000;
                e = e || window.event;
                var delta = e.deltaY || e.detail || e.wheelDelta;
                ap.methods.types.start_time = Date.now();
                if (t.infoActive) {
                    t.direction = delta / 100;
                    t.sound[0].play();
                    if (delta > 0) {
                        m.events.scroll.down();
                    } else {
                        m.events.scroll.up();
                    }
                }

                endCameraMove.y = t.currentLevel;
                m.smoothFlipped(bgn, endCameraMove, function (end, tween) {
                    if (end.alpha > 0.32) {
                        tween.stop();
                        tween.remove();
                    }
                });


                e.preventDefault ? e.preventDefault() : (e.returnValue = false);
            },
            scroll: {
                down: function () {
                    var m = ap.methods, t = m.types;
                    if (++t.currentEffect < t.effects.length) {
                        m.setCloudsView(t.effects[t.currentEffect]);
                    } else {
                        --t.currentEffect;
                    }

                },
                up: function () {
                    var m = ap.methods, t = m.types;
                    if (--t.currentEffect >= 0) {
                        m.setCloudsView(t.effects[t.currentEffect]);
                    } else {
                        ++t.currentEffect;
                    }
                }
            },
            onWindowResize: function (event) {
                var a = ap.methods.types,
                    _w = window.innerWidth,//jQuery(a.container).width(),
                    _h = window.innerHeight//jQuery(a.container).height()
                    ;
                a.camera.aspect = _w / _h;
                a.camera.updateProjectionMatrix();
                a.renderer.setSize(_w, _h);
                if (a.headsTrfnsDft) {
                    var heads = 'heads',
                        tails = 'tails';
                    var del = 0, hH = $('.' + heads).height() + del;
                    a.headsTrfnsDft = a.tailsTrfnsDft = -hH;
                    $('.' + heads).animate({transform: 'translateY(' + ( a.headsTrfnsDft) + 'px)'});
                    $('.' + tails).animate({transform: 'translateY(' + a.tailsTrfnsDft + 'px)'});

                }
//                    $('#RainyDay').width(window.innerWidth);
//                    $('#RainyDay').height(window.innerHeight);

            }
        }
    }
};
app.Sound = function (sources) {
    var audio = document.createElement('audio');

    for (var i = 0; i < sources.length; i++) {
        var source = document.createElement('source');
        source.src = sources[i];
        audio.appendChild(source);
    }

    this.play = function () {
        audio.load();
        audio.play();
    }
}
flashColor = 0,
    flashSpeed = 0.05;
var loaderr = function () {
    new THREE.TextureLoader().load(imgLoad.shift(), function (data) {
        textures.push(data);
        jQuery('.' + loadProcess).animate({width: (loadIter.val += loadIter.step) * loadIter.st + '%'});
        if (imgLoad.length) {
            loaderr();
        } else {
            ap = new app();

            ap.methods.init();
        }
    })
}
var ap,
    textures = [],
    loadProcess = 'loader__progress',
    loadIter = {step: 5, val: 0, st: 5},
    imgLoad = [
        'assets/data/img/cloud10 (1).png',
        'assets/data/img/raindrop.png'
    ];
$(document).ready(function () {
    loaderr();

});
