/**
 * WaterBackground - Three.js Shader-based Water Animation Background
 *
 * Based on proven ocean water shader from the web.
 * Renders as a full-screen background behind the chat UI.
 */

const WaterBackground = {
    container: null,
    renderer: null,
    scene: null,
    camera: null,
    material: null,
    clock: new THREE.Clock(),
    timeUniform: null,
    isRendering: false,
    rafId: -1,

    /**
     * Initialize the water background
     * @param {HTMLElement} parentContainer - The DOM element to append the canvas to
     */
    init(parentContainer) {
        if (typeof THREE === 'undefined') {
            console.error('[WaterBackground] THREE.js is not loaded.');
            return;
        }
        if (this.isRendering) {
            console.warn('[WaterBackground] Already rendering.');
            return;
        }

        console.log('[WaterBackground] Initializing...');

        this.container = parentContainer;

        // Inject CSS
        this._injectCSS();

        // Inject shaders
        this._injectShaders();

        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            30,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(0, 0, -1);
        this.scene.add(this.camera);

        // Setup uniforms
        this.timeUniform = {
            iGlobalTime: { type: 'f', value: 0.1 },
            iResolution: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        };

        // Create shader material from injected shaders
        const vertexShaderEl = document.getElementById('water-vertex-shader');
        const fragmentShaderEl = document.getElementById('water-fragment-shader');

        if (!vertexShaderEl || !fragmentShaderEl) {
            console.error('[WaterBackground] Shader elements not found!');
            console.log('[WaterBackground] Vertex shader:', vertexShaderEl ? '✓ Found' : '✗ Missing');
            console.log('[WaterBackground] Fragment shader:', fragmentShaderEl ? '✓ Found' : '✗ Missing');
            return;
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.timeUniform,
            vertexShader: vertexShaderEl.textContent,
            fragmentShader: fragmentShaderEl.textContent
        });

        console.log('[WaterBackground] Shader material created');

        // Create plane mesh with the shader material
        // Make plane large enough to fill the camera's view
        const planeGeometry = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 40, 40);
        const mesh = new THREE.Mesh(planeGeometry, this.material);
        mesh.position.set(0, 0, -100); // Position plane in front of camera
        this.scene.add(mesh);

        console.log('[WaterBackground] Plane mesh added to scene');

        // Create renderer
        const canvas = document.createElement('canvas');
        canvas.id = 'water-background-canvas';
        this.container.appendChild(canvas);

        console.log('[WaterBackground] Canvas appended to container');
        console.log('[WaterBackground] Container:', this.container);
        console.log('[WaterBackground] Canvas element:', canvas);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1); // Opaque black background

        console.log('[WaterBackground] WebGL Renderer created');

        // Event listeners
        window.addEventListener('resize', this._onWindowResize.bind(this));

        this.isRendering = true;
        this._renderLoop();

        console.log('[WaterBackground] Initialized successfully.');
    },

    /**
     * Inject CSS for the background
     */
    _injectCSS() {
        const styleId = 'water-background-styles';
        if (document.getElementById(styleId)) {
            console.log('[WaterBackground] CSS already injected');
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            #water-background-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                pointer-events: none;
                background: black;
            }
            #water-background-canvas {
                display: block;
                width: 100% !important;
                height: 100% !important;
            }
        `;
        document.head.appendChild(style);
        console.log('[WaterBackground] CSS injected');
    },

    /**
     * Inject vertex and fragment shaders into the DOM
     */
    _injectShaders() {
        // Vertex Shader
        if (!document.getElementById('water-vertex-shader')) {
            const vertexShader = document.createElement('script');
            vertexShader.id = 'water-vertex-shader';
            vertexShader.type = 'x-shader/x-vertex';
            vertexShader.textContent = `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `;
            document.head.appendChild(vertexShader);
        }

        // Fragment Shader
        if (!document.getElementById('water-fragment-shader')) {
            const fragmentShader = document.createElement('script');
            fragmentShader.id = 'water-fragment-shader';
            fragmentShader.type = 'x-shader/x-fragment';
            fragmentShader.textContent = `
                uniform float iGlobalTime;
                uniform vec2 iResolution;

                const int NUM_STEPS = 8;
                const float PI = 3.1415;
                const float EPSILON = 1e-3;

                const int ITER_GEOMETRY = 3;
                const int ITER_FRAGMENT = 5;
                const float SEA_HEIGHT = 0.6;
                const float SEA_CHOPPY = 1.0;
                const float SEA_SPEED = 1.0;
                const float SEA_FREQ = 0.16;
                const vec3 SEA_BASE = vec3(0.1,0.19,0.22);
                const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6);

                mat3 fromEuler(vec3 ang) {
                    vec2 a1 = vec2(sin(ang.x),cos(ang.x));
                    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
                    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
                    mat3 m;
                    m[0] = vec3(
                        a1.y*a3.y+a1.x*a2.x*a3.x,
                        a1.y*a2.x*a3.x+a3.y*a1.x,
                        -a2.y*a3.x
                    );
                    m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
                    m[2] = vec3(
                        a3.y*a1.x*a2.x+a1.y*a3.x,
                        a1.x*a3.x-a1.y*a3.y*a2.x,
                        a2.y*a3.y
                    );
                    return m;
                }

                float hash(vec2 p) {
                    float h = dot(p,vec2(127.1,311.7));
                    return fract(sin(h)*43758.5453123);
                }

                float noise(in vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return -1.0 + 2.0 * mix(
                        mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
                        u.y
                    );
                }

                float diffuse(vec3 n,vec3 l,float p) {
                    return pow(dot(n,l) * 0.4 + 0.6,p);
                }

                float specular(vec3 n,vec3 l,vec3 e,float s) {
                    float nrm = (s + 8.0) / (3.1415 * 8.0);
                    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
                }

                vec3 getSkyColor(vec3 e) {
                    e.y = max(e.y, 0.0);
                    float brightness = max(1.0 - e.y, 0.6);
                    vec3 ret;
                    ret.x = pow(brightness, 2.0);
                    ret.y = brightness;
                    ret.z = 0.6 + brightness * 0.4;
                    return ret;
                }

                float sea_octave(vec2 uv, float choppy) {
                    uv += noise(uv);
                    vec2 wv = 1.0 - abs(sin(uv));
                    vec2 swv = abs(cos(uv));
                    wv = mix(wv, swv, wv);
                    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
                }

                float map(vec3 p) {
                    float freq = SEA_FREQ;
                    float amp = SEA_HEIGHT;
                    float choppy = SEA_CHOPPY;
                    vec2 uv = p.xz;
                    uv.x *= 0.75;

                    float SEA_TIME = iGlobalTime * SEA_SPEED;
                    mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

                    float d, h = 0.0;
                    for(int i = 0; i < ITER_GEOMETRY; i++) {
                        d = sea_octave((uv + SEA_TIME) * freq, choppy);
                        d += sea_octave((uv - SEA_TIME) * freq, choppy);
                        h += d * amp;
                        uv *= octave_m;
                        freq *= 1.9;
                        amp *= 0.22;
                        choppy = mix(choppy, 1.0, 0.2);
                    }
                    return p.y - h;
                }

                float map_detailed(vec3 p) {
                    float freq = SEA_FREQ;
                    float amp = SEA_HEIGHT;
                    float choppy = SEA_CHOPPY;
                    vec2 uv = p.xz;
                    uv.x *= 0.75;

                    float SEA_TIME = iGlobalTime * SEA_SPEED;
                    mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

                    float d, h = 0.0;
                    for(int i = 0; i < ITER_FRAGMENT; i++) {
                        d = sea_octave((uv + SEA_TIME) * freq, choppy);
                        d += sea_octave((uv - SEA_TIME) * freq, choppy);
                        h += d * amp;
                        uv *= octave_m;
                        freq *= 1.9;
                        amp *= 0.22;
                        choppy = mix(choppy, 1.0, 0.2);
                    }
                    return p.y - h;
                }

                vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
                    float fresnel = 1.0 - max(dot(n,-eye),0.0);
                    fresnel = pow(fresnel,3.0) * 0.65;

                    vec3 reflected = getSkyColor(reflect(eye,n));
                    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12;

                    vec3 color = mix(refracted,reflected,fresnel);

                    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
                    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;

                    color += vec3(specular(n,l,eye,60.0));

                    return color;
                }

                vec3 getNormal(vec3 p, float eps) {
                    vec3 n;
                    n.y = map_detailed(p);
                    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
                    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
                    n.y = eps;
                    return normalize(n);
                }

                float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
                    float tm = 0.0;
                    float tx = 1000.0;
                    float hx = map(ori + dir * tx);

                    if(hx > 0.0) {
                        return tx;
                    }

                    float hm = map(ori + dir * tm);
                    float tmid = 0.0;
                    for(int i = 0; i < NUM_STEPS; i++) {
                        tmid = mix(tm, tx, hm/(hm-hx));
                        p = ori + dir * tmid;
                        float hmid = map(p);
                        if(hmid < 0.0) {
                            tx = tmid;
                            hx = hmid;
                        } else {
                            tm = tmid;
                            hm = hmid;
                        }
                    }
                    return tmid;
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / iResolution.xy;
                    uv = uv * 2.0 - 1.0;
                    uv.x *= iResolution.x / iResolution.y;
                    float time = iGlobalTime * 0.3;

                    vec3 ang = vec3(
                        sin(time*3.0)*0.1, sin(time)*0.2+0.3, time
                    );
                    vec3 ori = vec3(0.0, 3.5, time*5.0);
                    vec3 dir = normalize(vec3(uv.xy, -2.0));
                    dir.z += length(uv) * 0.15;
                    dir = normalize(dir);

                    vec3 p;
                    heightMapTracing(ori, dir, p);
                    vec3 dist = p - ori;
                    vec3 n = getNormal(p, dot(dist,dist) * 0.1 / iResolution.x);
                    vec3 light = normalize(vec3(0.0, 1.0, 0.8));

                    vec3 color = mix(
                        getSkyColor(dir),
                        getSeaColor(p, n, light, dir, dist),
                        pow(smoothstep(0.0, -0.05, dir.y), 0.3)
                    );

                    gl_FragColor = vec4(pow(color, vec3(0.75)), 1.0);
                }
            `;
            document.head.appendChild(fragmentShader);
        }
    },

    /**
     * Handle window resize
     */
    _onWindowResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.timeUniform.iResolution.value.set(window.innerWidth, window.innerHeight);
    },

    /**
     * Main render loop
     */
    _renderLoop() {
        if (!this.isRendering) return;

        this.timeUniform.iGlobalTime.value += this.clock.getDelta();
        this.renderer.render(this.scene, this.camera);
        this.rafId = requestAnimationFrame(this._renderLoop.bind(this));

        // Log first frame for debugging
        if (this.timeUniform.iGlobalTime.value < 0.2) {
            console.log('[WaterBackground] Render loop active. Time:', this.timeUniform.iGlobalTime.value.toFixed(3));
        }
    },

    /**
     * Cleanup and destroy
     */
    destroy() {
        if (!this.isRendering) return;

        console.log('[WaterBackground] Destroying...');
        this.isRendering = false;
        cancelAnimationFrame(this.rafId);

        window.removeEventListener('resize', this._onWindowResize.bind(this));

        if (this.scene) {
            this.scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.material = null;

        console.log('[WaterBackground] Destroyed.');
    }
};

export default WaterBackground;
