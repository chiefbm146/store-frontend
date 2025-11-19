// public/js/intro-loader.js

/**
 * IntroLoader - Dynamic Pre-loading Screen with Ripple Animation
 *
 * This module dynamically injects a themed pre-loading screen into the DOM.
 * It's designed to be called by both desktop.html and mobile.html, providing
 * a consistent intro animation that disappears once the main application
 * (specifically, the initial chat message/UI) is ready.
 *
 * The animation features a "ripple" effect with a custom SVG logo, themed
 * with the application's blue and white color palette.
 */

const introLoader = {
    // Flag to track if the loader is currently active in the DOM
    isActive: false,
    loaderElement: null,
    initTime: null, // Track when loader was initialized
    MIN_DISPLAY_TIME: 3000, // 3 seconds in milliseconds (starts AFTER click) - for expansion animation
    audioElement: null, // Track intro audio element
    hasUserClicked: false, // Track if user has clicked to begin
    walkingWaterAudio: null, // Track walking in water sound for liquid effect interaction
    isUserDragging: false, // Track if user is currently dragging/moving

    /**
     * Injects the pre-loader HTML and CSS into the document.
     * Starts the loader's visibility and animations.
     */
    init() {
        if (this.isActive) {
            console.warn('[IntroLoader] Loader is already active.');
            return;
        }

        console.log('[IntroLoader] Initializing loader...');
        this.isActive = true;
        this.initTime = Date.now(); // Capture initialization time

        // 1. Inject CSS for the loader (inline style tag)
        const styleId = 'intro-loader-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            // Themed for blue/white, replacing the red/black
            style.textContent = `
                /* --- INTRO LOADER: BASE --- */
                #intro-loader-overlay {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    opacity: 1;
                    transition: opacity 0.5s ease-out; /* Match this duration for setTimeout */
                    overflow: hidden;
                    background: linear-gradient(135deg, #E3F2FD 0%, #B3E5FC 50%, #81D4FA 100%);
                }

                /* --- LIQUID BACKGROUND CANVAS --- */
                #intro-loader-liquid-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1;
                }

                /* --- CONTENT LAYER (above liquid) --- */
                #intro-loader-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    cursor: pointer;
                    user-select: none;
                }

                /* --- CLICK TO BEGIN TEXT --- */
                #intro-click-text {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 32px;
                    font-weight: bold;
                    color: #000000;
                    text-align: center;
                    letter-spacing: 2px;
                    animation: intro-pulse 2s ease-in-out infinite;
                    pointer-events: all;
                    z-index: 10000;
                    text-shadow: 0 2px 8px rgba(255, 255, 255, 0.8);
                    width: 90%;
                    max-width: 600px;
                }

                @keyframes intro-pulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }

                #intro-loader-overlay.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                /* --- LOADER INNER CONTAINER --- */
                #intro-loader-overlay .loader-inner {
                    --loader-background: linear-gradient(0deg, rgba(30, 144, 255, 0.4) 0%, rgba(0, 71, 171, 0.3) 100%); /* Blue gradient */
                    position: relative;
                    height: 250px;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* --- LOADER LOGO (SVG) --- */
                #intro-loader-overlay .loader-inner .loader-logo {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(1);
                    width: 120px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: intro-logo-idle 3s infinite ease-in-out;
                    z-index: 999;
                    transform-origin: center center;
                }
                #intro-loader-overlay .loader-inner .loader-logo svg {
                    width: 100%;
                    height: 100%;
                }
                #intro-loader-overlay .loader-inner .loader-logo svg path {
                    stroke: var(--accent-primary, #1E90FF); /* Blue theme */
                    fill: var(--accent-primary, #1E90FF);   /* Blue theme */
                }

                /* --- RIPPLE BOX ELEMENTS --- */
                #intro-loader-overlay .loader-inner .box {
                    position: absolute;
                    background: var(--loader-background);
                    border-radius: 50%;
                    border-top: 1px solid var(--accent-primary, #1E90FF); /* Blue border */
                    box-shadow: rgba(0, 71, 171, 0.3) 0 10px 10px 0; /* Blue shadow */
                    backdrop-filter: blur(5px);
                    animation: intro-ripple-idle 3s infinite ease-in-out;
                    transform-origin: center center;
                }
                #intro-loader-overlay .loader-inner .box:nth-child(1) {
                    width: 25%;
                    aspect-ratio: 1/1;
                    z-index: 99;
                }
                #intro-loader-overlay .loader-inner .box:nth-child(2) {
                    inset: 30%;
                    z-index: 98;
                    border-color: rgba(30, 144, 255, 0.8);
                    animation-delay: 0.2s;
                }
                #intro-loader-overlay .loader-inner .box:nth-child(3) {
                    inset: 20%;
                    z-index: 97;
                    border-color: rgba(30, 144, 255, 0.6);
                    animation-delay: 0.4s;
                }
                #intro-loader-overlay .loader-inner .box:nth-child(4) {
                    inset: 10%;
                    z-index: 96;
                    border-color: rgba(30, 144, 255, 0.4);
                    animation-delay: 0.6s;
                }
                #intro-loader-overlay .loader-inner .box:nth-child(5) {
                    inset: 0;
                    z-index: 95;
                    border-color: rgba(30, 144, 255, 0.2);
                    animation-delay: 0.8s;
                }

                /* --- KEYFRAME ANIMATIONS (IDLE) --- */
                @keyframes intro-ripple-idle {
                    0% {
                        transform: scale(1);
                        box-shadow: rgba(0, 71, 171, 0.3) 0 10px 10px 0;
                    }
                    50% {
                        transform: scale(1.3);
                        box-shadow: rgba(0, 71, 171, 0.3) 0 30px 20px 0;
                    }
                    100% {
                        transform: scale(1);
                        box-shadow: rgba(0, 71, 171, 0.3) 0 10px 10px 0;
                    }
                }
                @keyframes intro-logo-idle {
                    0% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
                }

                /* ========================================================================= */
                /* === NEW ANIMATIONS FOR CLICKED STATE (Expand Out)                     === */
                /* ========================================================================= */

                /* Apply expansion animation on click - boxes stay centered */
                #intro-loader-overlay.clicked-active .loader-inner .box {
                    animation: expand-out-box 3s ease-out forwards !important;
                }

                /* Logo expansion with translate to stay centered */
                #intro-loader-overlay.clicked-active .loader-inner .loader-logo {
                    animation: expand-out-logo 3s ease-out forwards !important;
                }

                /* Stagger the expansion animation for boxes to create a wave effect */
                #intro-loader-overlay.clicked-active .loader-inner .box:nth-child(1) { animation-delay: 0s; }
                #intro-loader-overlay.clicked-active .loader-inner .box:nth-child(2) { animation-delay: 0.05s; }
                #intro-loader-overlay.clicked-active .loader-inner .box:nth-child(3) { animation-delay: 0.1s; }
                #intro-loader-overlay.clicked-active .loader-inner .box:nth-child(4) { animation-delay: 0.15s; }
                #intro-loader-overlay.clicked-active .loader-inner .box:nth-child(5) { animation-delay: 0.2s; }
                #intro-loader-overlay.clicked-active .loader-inner .loader-logo { animation-delay: 0s; }

                /* Boxes expand in place - inset positioning keeps them centered */
                @keyframes expand-out-box {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                        box-shadow: rgba(0, 71, 171, 0.3) 0 10px 10px 0;
                    }
                    100% {
                        transform: scale(3.5);
                        opacity: 0;
                        box-shadow: none;
                    }
                }

                /* Logo expands in place with subtle growth */
                @keyframes expand-out-logo {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(3.5);
                        opacity: 0;
                    }
                }

                /* Allow elements to expand beyond the wrapper */
                #intro-loader-overlay.clicked-active .loader-inner {
                    overflow: visible;
                }
            `;
            document.head.appendChild(style);
        }

        // 2. Inject HTML for the loader
        const loaderHTML = `
            <div id="intro-loader-overlay">
                <canvas id="intro-loader-liquid-canvas"></canvas>
                <div id="intro-loader-content">
                    <div class="loader-inner">
                    <div class="loader-logo">
                        <svg viewBox="0 0 794 1123" xmlns="http://www.w3.org/2000/svg">
                            <path style="fill: currentColor" d="M 372,920.97295 C 284.82978,914.20634 205.29717,877.9691 144.23022,817.19477 84.129257,757.38181 48.465583,682.49414 38.890877,596 37.250649,581.18283 37.250004,538.82586 38.88978,524 45.896423,460.65018 66.748334,404.74158 102.48699,353.48177 125.05441,321.11342 158.93455,287.53606 192,264.76872 272.08015,209.62925 369.94488,189.36381 465.72358,208.08712 523.6943,219.41954 577.43497,244.46307 624,281.84504 c 13.14669,10.55404 43.8562,41.39732 54.41793,54.65496 43.89395,55.098 70.36671,120.195 77.67329,191 1.57839,15.29551 1.58996,53.55304 0.0207,68.5 -4.90854,46.75347 -17.03421,88.36116 -37.44344,128.48235 C 663.66289,832.61433 559.07963,905.53219 439,919.47365 c -16.5604,1.92269 -51.47933,2.7041 -67,1.4993 z m 67,-7.4118 c 42.82152,-5.54922 79.70809,-16.77813 117.05404,-35.63327 C 659.25713,825.82292 730.58336,727.49087 747.97247,613.34453 761.62569,523.72151 740.4796,431.78586 689.27992,358.17029 648.15372,299.03848 587.20045,252.05991 519.99927,227.70043 439.46134,198.50658 354.81169,198.81805 273,228.60929 c -26.91616,9.80135 -63.90224,30.00122 -88,48.061 C 111.86175,331.48289 61.954761,412.85895 47.114572,501.5 c -3.911859,23.36569 -4.614815,32.6168 -4.597161,60.5 0.02222,35.09339 2.61705,56.81883 10.533973,88.19654 27.323705,108.29402 107.359416,199.66734 210.893346,240.76785 28.91815,11.47982 63.54916,20.07043 92.55527,22.95938 6.05,0.60257 12.575,1.27334 14.5,1.49061 8.5918,0.96971 56.23612,-0.32875 68,-1.85323 z m -42.87751,-30.747 C 392.32286,864.41819 380.10318,849.58422 360,838.9636 l -9.5,-5.01891 10,0.68915 c 12.98067,0.89455 56.61873,0.88498 72,-0.0158 l 12,-0.70276 -9,4.39289 c -20.45153,9.98237 -31.47675,23.06993 -35.54323,42.19183 -1.88198,8.84967 -2.41762,9.17295 -3.83428,2.31415 z M 374,811.99958 c -47.17287,-2.39908 -91.07375,-12.57124 -111.88212,-25.92394 -5.72544,-3.674 -12.73146,-10.92908 -14.14555,-14.64841 -9.17119,-24.12206 37.77237,-45.97292 112.52767,-52.37837 6.6,-0.56552 23.475,-1.02823 37.5,-1.02823 27.33468,0 41.34035,0.89363 63.5,4.05159 44.17732,6.29569 78.19244,20.33237 85.41208,35.24616 8.7237,18.02077 -12.64605,34.73191 -58.41208,45.67821 -31.16428,7.45386 -75.85908,10.96816 -114.5,9.00299 z m 30.89649,-21.06198 c 2.41807,-0.55743 6.94052,-2.50452 10.04988,-4.32687 16.35085,-9.58297 38.79237,-14.55272 81.05363,-17.9496 l 15.5,-1.24586 -14,-1.27673 c -28.92314,-2.63764 -51.86941,-6.66235 -66.65416,-11.69097 -3.68687,-1.25399 -11.10151,-4.56768 -16.47699,-7.36377 -8.88764,-4.62297 -10.36712,-5.08084 -16.32122,-5.05115 -7.30913,0.0364 -11.20327,1.27637 -27.69811,8.81937 -19.66806,8.9941 -37.92083,13.01743 -70.60216,15.56234 -9.48605,0.73868 -14.51918,1.39764 -11.18474,1.46435 10.50405,0.21015 38.45482,3.10503 50.93738,5.27562 15.66297,2.72364 27.48112,6.64592 37.41358,12.41707 10.97064,6.37438 17.8701,7.69747 27.98291,5.3662 z m -182.39832,-9.17929 c -19.67588,-13.64162 -40.08809,-33.75409 -47.29246,-46.59797 l -2.29428,-4.09024 5.45949,2.49944 c 6.40651,2.93299 17.1989,5.38854 23.79111,5.4131 10.84922,0.0404 27.14985,-4.66146 42.33797,-12.21224 8.91158,-4.4304 8.88695,-4.34975 -1.05762,3.46306 -9.32294,7.32445 -16.15605,15.0128 -19.34523,21.76654 -3.47473,7.35846 -3.58871,19.02252 -0.25788,26.39154 1.21605,2.69034 2.08636,5.01616 1.93403,5.16849 -0.15233,0.15233 -1.62614,-0.65844 -3.27513,-1.80172 z M 570,783.5167 c 0,-0.32801 1.01126,-2.49095 2.24724,-4.80654 1.87569,-3.51408 2.24769,-5.78083 2.25,-13.71016 0.003,-8.68718 -0.25385,-9.96338 -2.99643,-14.91583 -3.55639,-6.42202 -11.58607,-14.81061 -20.9947,-21.93313 C 546.76371,725.31797 543.90179,723 544.14629,723 c 0.2445,0 4.58902,2.02899 9.65449,4.50887 26.66712,13.05529 47.50746,14.65701 66.03639,5.07533 1.73956,-0.89956 3.16283,-1.24458 3.16283,-0.76671 0,1.96717 -10.85847,16.12451 -18.40836,24.00095 C 593.97527,766.89398 570,786.09149 570,783.5167 Z M 141.79295,772.75 C 124.88671,751.39028 108.03275,723.50549 97.086297,698.78307 80.079369,660.37316 70.849139,621.21535 68.615457,578 l -0.491029,-9.5 1.897326,9.3751 c 6.538558,32.30844 18.880859,47.06401 47.243106,56.48047 24.31821,8.07382 70.06317,11.79854 135.73514,11.05204 19.37053,-0.22018 23.8174,-0.0608 18.5,0.66297 -57.03982,7.76416 -98.07689,26.51408 -118.95308,54.3499 -15.41648,20.55595 -17.82616,47.05602 -6.68918,73.56285 1.62145,3.85917 2.83942,7.01667 2.7066,7.01667 -0.13283,0 -3.17995,-3.7125 -6.77139,-8.25 z m 508.76975,1.28798 c 5.14908,-12.67196 6.8199,-20.83683 6.76074,-33.03798 -0.0465,-9.58272 -0.4906,-12.83376 -2.66401,-19.5 C 651.15566,710.7533 645.92097,702.09815 637.5,693.12825 615.59933,669.79996 580.16044,654.47076 531,647.06135 l -12.5,-1.88398 42.67045,-0.0887 c 74.27603,-0.15437 106.2494,-4.09061 130.49906,-16.06572 20.80499,-10.27405 31.00085,-26.57138 35.67444,-57.02296 0.84705,-5.51913 0.59037,8.20378 -0.34603,18.5 -5.41058,59.49176 -23.80395,111.41536 -57.0325,161 -6.53355,9.74956 -20.63054,28.5 -21.42692,28.5 -0.21911,0 0.69177,-2.68291 2.0242,-5.96202 z M 267.5,709.79218 c -3.34208,-1.91668 -4.43491,-4.08019 -4.4682,-8.84584 -0.0464,-6.64334 3.87988,-13.6795 11.78917,-21.12699 5.79586,-5.45747 20.19957,-14.69515 19.01434,-12.19467 -0.22819,0.48142 -2.40603,4.8971 -4.83964,9.8126 -3.46905,7.00696 -4.51169,10.30292 -4.82734,15.2601 -0.44142,6.9324 0.93184,11.55895 4.0869,13.76884 1.84737,1.29394 1.62565,1.49168 -3.31932,2.96017 -6.17184,1.83284 -14.57061,2.00904 -17.43591,0.36579 z m 244.19907,-0.40694 l -4.80094,-1.47546 2.51114,-2.98433 c 5.26147,-6.25289 4.31287,-15.9045 -2.91073,-29.6158 -4.10044,-7.78315 -4.1941,-8.1444 -1.88372,-7.266 3.45691,1.31432 12.39603,7.14897 16.57729,10.82016 5.00795,4.39704 10.51514,12.81745 11.94251,18.25991 2.99487,11.41926 -6.50128,16.85123 -21.43555,12.26152 z m -200.57173,-9.2579 c -4.44548,-4.44548 -1.8763,-12.43204 5.36424,-16.67527 6.36376,-3.72941 13.44305,-5.42488 25.50842,-6.10919 16.81014,-0.95342 33.92926,2.61306 41.04099,8.5502 l 3.422,2.85681 -6.4815,0.68992 c -10.72839,1.14197 -17.60192,2.48371 -36.98149,7.21893 -23.61324,5.76967 -28.9868,6.35446 -31.87266,3.4686 z M 473,701.27574 c -1.375,-0.24854 -11.275,-2.60785 -22,-5.24291 -10.725,-2.63505 -24.13232,-5.34847 -29.79404,-6.02981 -6.75459,-0.81286 -10.16806,-1.62806 -9.92765,-2.37091 0.20151,-0.62266 3.25882,-2.61478 6.79403,-4.42694 8.97398,-4.60008 21.11474,-6.59315 35.92766,-5.89802 14.68546,0.68916 23.42441,3.27414 29.00019,8.57825 3.53483,3.3626 3.99981,4.33946 3.99981,8.40306 0,6.84727 -3.92827,8.80783 -14,6.98728 z m -90.5,-46.40213 c -5.54628,-5.38108 -16.35805,-8.24108 -35.80177,-9.47049 l -10.80176,-0.68299 7.05102,-3.89359 c 8.8585,-4.89169 18.80534,-14.12887 23.85366,-22.15181 9.96305,-15.83361 14.4466,-35.1148 17.59699,-75.67473 1.31854,-16.97556 1.36291,-15.51462 1.48057,48.75 0.0667,36.4375 0.009,66.20146 -0.12871,66.14213 -0.1375,-0.0593 -1.6,-1.41766 -3.25,-3.01852 z m 27.85026,-7.02723 c 0.35736,-5.0345 0.71379,-32.597 0.79208,-61.25 0.0951,-34.81803 0.40426,-48.61394 0.93205,-41.59638 4.27543,56.84652 14.23992,80.04158 41.13805,95.75994 l 6.6323,3.8757 -14.27891,1.12322 c -16.0098,1.25939 -24.89887,3.6614 -30.75719,8.31125 -2.03025,1.61144 -4.01013,2.92989 -4.39974,2.92989 -0.38961,0 -0.416,-4.11913 -0.0586,-9.15362 z M 207.53892,590.88765 c -13.08227,-1.90594 -21.84048,-5.58551 -38.46101,-16.15856 -16.36077,-10.40779 -23.43,-12.70597 -39.07791,-12.70408 -9.29871,0.001 -23.01094,1.98436 -31.155271,4.50608 -1.289601,0.39929 0.355271,-1.27905 3.655271,-3.72965 3.3,-2.45061 14.775,-13.03236 25.5,-23.51501 10.725,-10.48264 21.975,-21.17112 25,-23.75216 14.06876,-12.004 32.57315,-22.0241 47.1065,-25.50812 10.15845,-2.43524 28.12277,-2.7178 39.05553,-0.6143 18.35135,3.53086 26.83128,9.067 55.27727,36.08784 11.7717,11.18194 25.59227,23.63143 30.71237,27.66555 l 9.30929,7.33476 -5.48048,0.24112 c -27.94049,1.2293 -37.94385,3.93136 -57.70592,15.5873 -8.11825,4.78826 -17.56317,9.48971 -22,10.95107 -13.21932,4.35406 -27.90265,5.62347 -41.73564,3.60816 z m 26.94766,-13.35373 c 15.43775,-2.95373 29.16427,-12.18501 35.1559,-23.64284 2.47738,-4.73753 2.82147,-6.48214 2.83833,-14.39108 0.0234,-10.95706 -2.14221,-16.11792 -10.10431,-24.08003 -24.37185,-24.37184 -75.34552,-18.5725 -89.50168,10.18274 -6.43286,13.067 -3.66402,26.91847 7.5741,37.89039 13.00059,12.69263 33.39195,17.991 54.03766,14.04082 z M 297.5,557.66218 c 4.4,-0.85098 10.45484,-1.85303 13.4552,-2.22677 l 5.4552,-0.67953 -3.4552,-3.01603 c -1.90036,-1.65882 -8.212,-7.41422 -14.02586,-12.78977 l -10.57066,-9.77375 0.79365,5.66184 c 0.97988,6.99039 -0.49694,16.02448 -3.64959,22.32543 l -2.33341,4.6636 3.16533,-1.30889 C 288.0756,559.79842 293.1,558.51316 297.5,557.66218 Z M 156.19468,555.25 c -2.37221,-5.0619 -2.69141,-6.94669 -2.66732,-15.75 0.0222,-8.11313 0.43955,-10.90399 2.21189,-14.79095 l 2.18452,-4.79096 -2.71188,1.96234 C 153.72035,522.95971 144.85,531.29944 135.5,540.41316 l -17,16.57039 5.5,-0.74177 c 9.95598,-1.34275 19.97791,-0.57145 27,2.07796 3.575,1.34883 6.8126,2.50368 7.19468,2.56634 0.38207,0.0627 -0.51793,-2.47358 -2,-5.63608 z m 397.35756,34.15646 C 544.12228,587.306 536.45152,583.95983 524,576.51504 503.07173,564.00198 496.75082,562.06433 474.27168,561.27102 l -15.22832,-0.53743 9.8283,-7.77728 c 5.40557,-4.2775 18.33331,-15.96365 28.72832,-25.96922 27.29867,-26.27595 36.34884,-32.61306 53.05784,-37.15212 6.3598,-1.72766 10.67757,-2.1321 22.84218,-2.13956 13.44913,-0.008 15.92293,0.27034 23.92658,2.69449 11.73351,3.55385 25.93218,10.96021 37.07342,19.33838 4.95,3.72238 18.98631,16.53259 31.19181,28.46714 12.20549,11.93455 24.02714,22.91375 26.27032,24.39822 2.24319,1.48447 3.91041,2.86715 3.70495,3.07262 -0.20547,0.20547 -4.15212,-0.53162 -8.77033,-1.63798 -17.19359,-4.11896 -33.72416,-3.67409 -45.36964,1.221 -2.76491,1.16221 -9.75211,5.05693 -15.52711,8.65494 -13.20222,8.2254 -21.84025,12.50828 -29.5,14.62657 -8.68755,2.40253 -33.7947,2.91445 -42.94776,0.87567 z M 589.5,576.31005 c 8.38828,-2.06969 18.96202,-7.8673 24.5623,-13.46759 21.58489,-21.58489 8.91092,-52.48348 -25.1791,-61.38554 -8.14015,-2.12567 -24.25497,-2.11942 -32.3832,0.0126 -14.27653,3.74464 -27.39268,13.42403 -32.56277,24.03052 -3.40604,6.98752 -3.45714,19.82787 -0.10601,26.63612 10.09109,20.50134 38.36703,30.91025 65.66878,24.17393 z M 508.10532,555.75 c -2.31114,-4.66178 -2.6029,-6.44176 -2.60404,-15.88674 l -0.001,-10.63674 -6.5,5.91872 c -3.575,3.25529 -9.99036,9.05432 -14.25635,12.88673 L 476.98731,555 h 3.87535 c 5.21891,0 19.69216,2.58074 24.63734,4.39311 2.2,0.80628 4.27182,1.49767 4.60404,1.53643 0.33223,0.0388 -0.56719,-2.29204 -1.99872,-5.17954 z M 645.5,557.2162 c 6.20505,-2.17718 8.13564,-2.39642 17,-1.93055 5.5,0.28906 10.9,0.82886 12,1.19956 1.95073,0.65739 -21.27121,-22.45855 -32.76094,-32.61141 l -5.76093,-5.09064 2.19841,4.85842 c 1.7976,3.97266 2.20981,6.77273 2.26093,15.35842 0.0562,9.43088 -0.21669,11.09607 -2.67978,16.35404 -2.28167,4.87072 -2.44964,5.72505 -1,5.08615 0.95827,-0.42234 4.89231,-1.87314 8.74231,-3.22399 z M 69.690847,530.5 c 3.376094,-54.89999 26.196662,-114.76512 62.983423,-165.22424 14.12188,-19.37049 29.65963,-36.82107 44.21008,-49.6527 14.84737,-13.09347 16.32693,-14.04223 10.09282,-6.47199 -11.32254,13.74926 -20.04497,31.5328 -23.48344,47.87874 -1.90408,9.05169 -1.89704,26.6342 0.0139,34.73935 3.07821,13.05594 10.74655,23.51699 20.70329,28.24312 l 5.71093,2.7108 -13.71093,0.54523 c -25.36323,1.00861 -44.07871,6.86716 -60.41804,18.91281 C 95.268089,457.31238 81.110715,483.02988 73.50443,519 c -4.200514,19.86423 -4.356955,20.33598 -3.813583,11.5 z M 723.6342,528.60715 c -2.3098,-16.72549 -9.11154,-38.67313 -16.70985,-53.9188 C 689.35033,439.42684 658.04807,421.13371 615,420.9675 l -10.5,-0.0405 5.44596,-2.63312 c 24.54149,-11.86583 30.31904,-50.73971 12.96731,-87.2498 -4.28783,-9.02211 -9.66858,-17.44578 -16.31286,-25.53808 l -4.10041,-4.99403 4.5,3.40944 c 7.13993,5.4096 37.86856,36.75313 45.00612,45.90673 16.9625,21.75362 27.9826,38.94339 39.53694,61.6719 17.61255,34.64562 28.89488,71.44887 32.49516,106 1.28829,12.36344 0.97164,21.06851 -0.40402,11.10715 z M 410,526.5 c 0,-0.275 0.225,-0.5 0.5,-0.5 0.275,0 0.5,0.225 0.5,0.5 0,0.275 -0.225,0.5 -0.5,0.5 -0.275,0 -0.5,-0.225 -0.5,-0.5 z m -26,-57.39992 c -13.41065,-3.6716 -29.70239,-14.00755 -42.27002,-26.81734 l -5.77003,-5.8812 8.57961,4.20058 c 22.52862,11.03005 47.71739,15.23893 71.96044,12.02413 15.7101,-2.08327 27.44194,-5.53614 41.28953,-12.15217 11.03833,-5.27384 11.24304,-5.32856 9.19991,-2.45925 -2.4835,3.48776 -14.85145,14.41811 -21.45656,18.96255 -7.05969,4.85719 -20.14827,10.6142 -28.23029,12.41708 -9.5659,2.13389 -24.92928,1.99809 -33.30259,-0.29438 z" />
                        </svg>
                    </div>
                    <div class="box"></div>
                    <div class="box"></div>
                    <div class="box"></div>
                    <div class="box"></div>
                    <div class="box"></div>
                    </div>
                    <div id="intro-click-text">Click To Begin Your Journey</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loaderHTML);
        this.loaderElement = document.getElementById('intro-loader-overlay');
        console.log('[IntroLoader] Loader HTML injected.');

        // 3. Setup click handler for the overlay (entire overlay is clickable)
        this.setupClickHandler();

        // 4. Initialize liquid water effect background
        this.initializeLiquidBackground();
    },

    /**
     * Setup click handler for user to begin journey
     */
    setupClickHandler() {
        if (!this.loaderElement) return;

        this.loaderElement.addEventListener('click', () => {
            if (this.hasUserClicked) {
                console.log('[IntroLoader] User already clicked, ignoring additional clicks');
                return;
            }

            console.log('[IntroLoader] ✅ USER CLICKED! Beginning journey...');
            this.hasUserClicked = true;

            // Mark the beginning of the journey (timer starts now)
            this.initTime = Date.now();

            // === NEW: Add class to trigger expansion animation ===
            this.loaderElement.classList.add('clicked-active');
            console.log('[IntroLoader] Added "clicked-active" class to trigger expansion.');

            // Hide the click text
            const clickText = document.getElementById('intro-click-text');
            if (clickText) {
                clickText.style.opacity = '0';
                clickText.style.pointerEvents = 'none';
            }

            // Play sounds if audio is enabled
            this.playJourneyAudio();
        });

        console.log('[IntroLoader] Click handler attached to overlay');

        // Add drag/movement listeners for walking in water sound effect
        this.loaderElement.addEventListener('mousedown', () => {
            this.isUserDragging = true;
        });

        this.loaderElement.addEventListener('touchstart', () => {
            this.isUserDragging = true;
        });

        this.loaderElement.addEventListener('mousemove', () => {
            if (this.isUserDragging && !this.walkingWaterAudio) {
                this.playWalkingWaterSound();
            }
        });

        this.loaderElement.addEventListener('touchmove', () => {
            if (this.isUserDragging && !this.walkingWaterAudio) {
                this.playWalkingWaterSound();
            }
        });

        this.loaderElement.addEventListener('mouseup', () => {
            this.stopWalkingWaterSound();
        });

        this.loaderElement.addEventListener('touchend', () => {
            this.stopWalkingWaterSound();
        });

        this.loaderElement.addEventListener('mouseleave', () => {
            this.stopWalkingWaterSound();
        });
    },

    /**
     * Play unlock sound (low volume) then bubbles sound when user clicks
     */
    async playJourneyAudio() {
        if (typeof window.audioStateManager === 'undefined') {
            console.log('[IntroLoader] audioStateManager not available, skipping audio.');
            return;
        }

        const audioState = window.audioStateManager.state;
        if (!audioState.isAudioEnabled || audioState.permissionStatus !== 'granted') {
            console.log('[IntroLoader] Audio disabled or not granted, skipping journey audio.');
            return;
        }

        try {
            console.log('[IntroLoader] 🎵 Playing unlock sound first...');

            // First, play unlock.mp3 at very low volume to trigger audio context
            const unlockAudio = new Audio();
            unlockAudio.src = './sounds/unlock.mp3';
            unlockAudio.volume = 0.001; // Nearly silent
            unlockAudio.play().catch(err => {
                console.warn('[IntroLoader] Unlock sound play failed:', err.message);
            });

            // Small delay, then play bubbles sound
            setTimeout(() => {
                console.log('[IntroLoader] 🎵 Playing water-bubbles sound...');
                this.audioElement = new Audio();
                this.audioElement.src = './sounds/water-bubbles-257594.mp3';
                this.audioElement.volume = 0;

                // Fade in over 500ms
                const fadeInDuration = 500;
                const fadeInInterval = 50;
                const targetVolume = 0.7;
                const volumeStep = targetVolume / (fadeInDuration / fadeInInterval);
                let currentVolume = 0;

                const fadeInTimer = setInterval(() => {
                    currentVolume += volumeStep;
                    if (currentVolume >= targetVolume) {
                        this.audioElement.volume = targetVolume;
                        clearInterval(fadeInTimer);
                    } else {
                        this.audioElement.volume = currentVolume;
                    }
                }, fadeInInterval);

                const playPromise = this.audioElement.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('[IntroLoader] ✅ Journey audio playing!');
                        })
                        .catch(err => {
                            console.error('[IntroLoader] Journey audio play failed:', err.message);
                        });
                }
            }, 100); // 100ms delay between unlock and bubbles
        } catch (err) {
            console.error('[IntroLoader] Error playing journey audio:', err);
        }
    },

    /**
     * Play walking in water sound when user drags/moves on the liquid effect
     */
    playWalkingWaterSound() {
        if (typeof window.audioStateManager === 'undefined') {
            return;
        }

        const audioState = window.audioStateManager.state;
        if (!audioState.isAudioEnabled || audioState.permissionStatus !== 'granted') {
            return;
        }

        try {
            this.walkingWaterAudio = new Audio();
            this.walkingWaterAudio.src = './sounds/walking-in-water-199418.mp3';
            this.walkingWaterAudio.volume = 0.5;
            this.walkingWaterAudio.loop = true; // Loop while dragging

            const playPromise = this.walkingWaterAudio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('[IntroLoader] 🚶 Walking in water sound playing');
                    })
                    .catch(err => {
                        console.warn('[IntroLoader] Walking water sound failed:', err.message);
                        this.walkingWaterAudio = null;
                    });
            }
        } catch (err) {
            console.error('[IntroLoader] Error playing walking water sound:', err);
            this.walkingWaterAudio = null;
        }
    },

    /**
     * Stop walking in water sound when user releases drag
     */
    stopWalkingWaterSound() {
        this.isUserDragging = false;

        if (this.walkingWaterAudio) {
            try {
                this.walkingWaterAudio.pause();
                this.walkingWaterAudio.currentTime = 0;
                this.walkingWaterAudio = null;
                console.log('[IntroLoader] 🔇 Walking in water sound stopped');
            } catch (err) {
                console.error('[IntroLoader] Error stopping walking water sound:', err);
                this.walkingWaterAudio = null;
            }
        }
    },

    /**
     * Initialize intro audio for returning users with sound enabled
     * Plays water-bubbles sound with fade-in effect
     */
    async initializeIntroAudio() {
        console.log('[IntroLoader] === AUDIO INITIALIZATION START ===');

        // Check if audio is enabled in audioStateManager
        if (typeof window.audioStateManager === 'undefined') {
            console.log('[IntroLoader] ❌ audioStateManager not available, skipping audio.');
            return;
        }

        const audioState = window.audioStateManager.state;
        console.log('[IntroLoader] 📊 Audio state object:', JSON.stringify(audioState));
        console.log('[IntroLoader] isAudioEnabled:', audioState.isAudioEnabled);
        console.log('[IntroLoader] permissionStatus:', audioState.permissionStatus);
        console.log('[IntroLoader] hasUserInteracted:', audioState.hasUserInteracted);

        if (!audioState.isAudioEnabled) {
            console.log('[IntroLoader] ❌ Audio DISABLED in settings, skipping audio.');
            return;
        }

        if (audioState.permissionStatus !== 'granted') {
            console.log('[IntroLoader] ❌ Permission status is "' + audioState.permissionStatus + '", not "granted", skipping audio.');
            return;
        }

        try {
            console.log('[IntroLoader] ✅ Audio checks passed! Attempting to unlock audio first...');

            // Check if soundManager is available and try to unlock audio
            if (typeof window.soundManager !== 'undefined' && typeof window.soundManager.attemptUnlock === 'function') {
                console.log('[IntroLoader] Calling soundManager.attemptUnlock()...');
                try {
                    await window.soundManager.attemptUnlock();
                    console.log('[IntroLoader] ✅ Audio unlock successful via soundManager');
                } catch (unlockErr) {
                    console.warn('[IntroLoader] Audio unlock failed, will try direct play anyway:', unlockErr.message);
                }
            } else {
                console.log('[IntroLoader] soundManager not available, will attempt direct play');
            }

            console.log('[IntroLoader] Creating audio element...');

            // Create audio element
            this.audioElement = new Audio();
            console.log('[IntroLoader] Audio element created:', this.audioElement);

            this.audioElement.src = './sounds/water-bubbles-257594.mp3';
            console.log('[IntroLoader] Audio src set to:', this.audioElement.src);

            this.audioElement.volume = 0; // Start at 0 for fade-in
            this.audioElement.preload = 'auto';
            console.log('[IntroLoader] Volume set to 0, preload set to auto');

            // Fade in effect over 500ms
            const fadeInDuration = 500;
            const fadeInInterval = 50;
            const targetVolume = 0.7;
            const volumeStep = targetVolume / (fadeInDuration / fadeInInterval);
            let currentVolume = 0;

            console.log('[IntroLoader] Fade-in config: duration=' + fadeInDuration + 'ms, targetVolume=' + targetVolume + ', volumeStep=' + volumeStep);

            const fadeInTimer = setInterval(() => {
                currentVolume += volumeStep;
                if (currentVolume >= targetVolume) {
                    this.audioElement.volume = targetVolume;
                    console.log('[IntroLoader] 🔊 Fade-in complete, volume at:', targetVolume);
                    clearInterval(fadeInTimer);
                } else {
                    this.audioElement.volume = currentVolume;
                }
            }, fadeInInterval);

            // Play audio
            console.log('[IntroLoader] Attempting to play audio...');
            const playPromise = this.audioElement.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('[IntroLoader] ✅ INTRO AUDIO PLAYING!');
                    })
                    .catch(err => {
                        console.error('[IntroLoader] ❌ AUDIO PLAY FAILED:', err.name, err.message);
                        console.error('[IntroLoader] Full error:', err);
                    });
            } else {
                console.log('[IntroLoader] Play returned undefined (older browser)');
            }
        } catch (err) {
            console.error('[IntroLoader] ❌ EXCEPTION during audio init:', err);
            console.error('[IntroLoader] Stack:', err.stack);
        }

        console.log('[IntroLoader] === AUDIO INITIALIZATION END ===');
    },

    /**
     * Initialize the liquid water effect background using Three.js LiquidBackground
     * Uses the actual Three.js component with blue theme colors
     */
    initializeLiquidBackground() {
        const canvas = document.getElementById('intro-loader-liquid-canvas');
        if (!canvas) {
            console.warn('[IntroLoader] Canvas element not found');
            return;
        }

        // Dynamically import and initialize the Three.js liquid effect
        import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js')
            .then(module => {
                const LiquidBackground = module.default;
                const app = LiquidBackground(canvas);

                // Create a solid color image using canvas for blue theme
                const imgCanvas = document.createElement('canvas');
                imgCanvas.width = 512;
                imgCanvas.height = 512;
                const imgCtx = imgCanvas.getContext('2d');

                // Create gradient background with blue variations
                const gradient = imgCtx.createLinearGradient(0, 0, 0, 512);
                gradient.addColorStop(0, '#1E90FF');      // Primary blue
                gradient.addColorStop(0.5, '#29B6F6');    // Deep blue
                gradient.addColorStop(1, '#0047AB');      // Dark blue
                imgCtx.fillStyle = gradient;
                imgCtx.fillRect(0, 0, 512, 512);

                // Add some wavy patterns for liquid effect
                imgCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                imgCtx.lineWidth = 2;
                for (let i = 0; i < 512; i += 40) {
                    imgCtx.beginPath();
                    imgCtx.arc(256, 256, i, 0, Math.PI * 2);
                    imgCtx.stroke();
                }

                const imageDataUrl = imgCanvas.toDataURL();
                app.loadImage(imageDataUrl);

                // Configure liquid material for blue theme
                app.liquidPlane.material.metalness = 0.75;
                app.liquidPlane.material.roughness = 0.25;
                app.liquidPlane.uniforms.displacementScale.value = 5;
                app.setRain(false);

                console.log('[IntroLoader] Three.js Liquid background initialized.');
            })
            .catch(err => {
                console.error('[IntroLoader] Failed to load liquid background:', err);
            });
    },

    /**
     * Hides the pre-loader and removes it from the DOM.
     * Enforces a minimum 2.5 second display duration for a polished intro effect.
     * If hide() is called before 2.5 seconds have elapsed, it waits until the time is up.
     * If more than 2.5 seconds have already passed, it hides immediately.
     * @returns {Promise<void>} A promise that resolves when the loader is completely hidden.
     */
    hide() {
        return new Promise(resolve => {
            if (!this.isActive) {
                console.warn('[IntroLoader] Loader is not active, cannot hide.');
                resolve(); // Resolve immediately if not active
                return;
            }

            // If user hasn't clicked yet, wait for click before starting countdown
            if (!this.hasUserClicked) {
                console.log('[IntroLoader] Waiting for user click before starting countdown...');
                // Keep checking if user has clicked
                const clickCheckInterval = setInterval(() => {
                    if (this.hasUserClicked) {
                        clearInterval(clickCheckInterval);
                        console.log('[IntroLoader] User clicked! Starting 3-second countdown...');
                        // Now call hide again to proceed with the countdown
                        this.hide().then(resolve).catch(err => {
                            clearInterval(clickCheckInterval);
                            throw err;
                        });
                    }
                }, 100);
                return;
            }

            // User has clicked, proceed with countdown
            const elapsedTime = Date.now() - this.initTime;
            const remainingTime = Math.max(0, this.MIN_DISPLAY_TIME - elapsedTime);

            const performHideWithDelay = () => {
                console.log('[IntroLoader] Performing hide animation...');
                this.loaderElement.classList.add('hidden'); // Trigger CSS transition

                // Remove from DOM after CSS transition completes
                const transitionDuration = parseFloat(getComputedStyle(this.loaderElement).transitionDuration) * 1000;
                setTimeout(() => {
                    if (this.loaderElement && this.loaderElement.parentNode) {
                        this.loaderElement.remove();
                        this.isActive = false;
                        this.loaderElement = null;
                        console.log('[IntroLoader] Loader removed from DOM.');
                    }

                    // Stop intro audio
                    if (this.audioElement) {
                        this.audioElement.pause();
                        this.audioElement.currentTime = 0;
                        console.log('[IntroLoader] Intro audio stopped.');
                    }

                    // Stop walking in water audio
                    this.stopWalkingWaterSound();

                    // Show the main content now that loader is gone
                    const hideStyleElement = document.getElementById('initial-hide-body');
                    if (hideStyleElement) {
                        hideStyleElement.remove();
                    }
                    // Also directly show the content containers
                    const chatSection = document.querySelector('.chat-section');
                    const aiPortal = document.querySelector('.ai-portal');
                    if (chatSection) {
                        chatSection.style.opacity = '1';
                        chatSection.style.visibility = 'visible';
                    }
                    if (aiPortal) {
                        aiPortal.style.opacity = '1';
                        aiPortal.style.visibility = 'visible';
                    }
                    console.log('[IntroLoader] Main content is now visible.');

                    resolve(); // Resolve the Promise here!
                }, transitionDuration || 500); // Use CSS transition duration or default to 500ms
            };


            if (remainingTime > 0) {
                console.log(`[IntroLoader] ⏱️ 3-second countdown active. Hiding in ${remainingTime}ms...`);
                setTimeout(performHideWithDelay, remainingTime);
            } else {
                console.log('[IntroLoader] ⏱️ 3-second countdown complete, hiding now.');
                performHideWithDelay();
            }
        });
    },

    /**
     * Actually performs the hide animation and DOM removal.
     * Called by hide() after the minimum display time has been enforced.
     * (This method is now integrated into the Promise logic in hide())
     */
    // performHide() { // <--- This method is no longer needed as a separate function
    //     if (!this.isActive) {
    //         return;
    //     }

    //     console.log('[IntroLoader] Performing hide animation...');
    //     this.loaderElement.classList.add('hidden'); // Trigger CSS transition

    //     // Remove from DOM after transition
    //     setTimeout(() => {
    //         if (this.loaderElement && this.loaderElement.parentNode) {
    //             this.loaderElement.remove();
    //             this.isActive = false;
    //             this.loaderElement = null;
    //             console.log('[IntroLoader] Loader removed from DOM.');
    //         }
    //     }, 500); // Match CSS transition duration
    // }
};

export default introLoader;