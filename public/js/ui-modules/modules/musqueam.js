/**
 * Musqueam Culture Module - v2.0 (Self-Contained with Professional UI)
 *
 * This module has been completely redesigned to align with the professional infographic aesthetic.
 * It is now fully self-contained and presents information about the Musqueam Nation
 * in a clean, article-style modal using the brand's color palette.
 */

const musqueamModule = {
    async getHtml(payload = {}) {
        const html = `
            <div id="musqueam-backdrop" class="culture-modal-backdrop">
                
                <!-- ====== SELF-CONTAINED CSS STYLING ====== -->
                <style>
                    :root {
                        --musqueam-red: #C41E3A;
                        --musqueam-black: #1a1a1a;
                        --warm-white: #FBF8F3;
                        --border-color: #E8DDD4;
                        --text-primary: #333;
                        --text-secondary: #666;
                    }

                    .culture-modal-backdrop {
                        position: fixed;
                        top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }

                    .culture-modal-container {
                        width: 90vw;
                        max-width: 800px;
                        height: 90vh;
                        max-height: 900px;
                        background: var(--warm-white);
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        border: 1px solid var(--border-color);
                    }

                    /* --- Animations --- */

                    /* --- Header --- */
                    .culture-modal-header {
                        background: linear-gradient(135deg, #1E90FF 0%, #0047AB 100%);
                        color: white;
                        padding: 20px 30px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 3px solid #1E90FF;
                        box-shadow: 0 4px 15px rgba(30, 144, 255, 0.3);
                    }
                    .culture-modal-title {
                        font-size: 22px;
                        font-weight: 700;
                        color: white;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .culture-modal-close-btn {
                        background: none; border: none; color: white;
                        font-size: 28px; cursor: pointer; padding: 0;
                        width: 40px; height: 40px; display: flex;
                        align-items: center; justify-content: center;
                        transition: all 0.2s ease; border-radius: 50%;
                    }
                    .culture-modal-close-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                        transform: rotate(90deg);
                    }

                    /* --- Content Area --- */
                    .culture-modal-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 40px;
                        line-height: 1.8;
                        font-size: 16px;
                        color: var(--text-primary);
                    }
                    .culture-modal-content::-webkit-scrollbar { width: 8px; }
                    .culture-modal-content::-webkit-scrollbar-track { background: transparent; }
                    .culture-modal-content::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
                    .culture-modal-content::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

                    .culture-section { margin-bottom: 40px; }
                    .culture-section h2 {
                        color: #1E90FF;
                        font-size: 24px;
                        font-weight: 800;
                        margin-bottom: 16px;
                        border-bottom: 2px solid var(--border-color);
                        padding-bottom: 12px;
                        letter-spacing: -0.5px;
                    }
                    .culture-section h3 {
                        color: var(--musqueam-black);
                        font-size: 18px;
                        font-weight: 700;
                        margin: 24px 0 8px 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .culture-section p {
                        margin: 0 0 16px 0;
                        color: var(--text-secondary);
                    }
                    .culture-section strong {
                        color: #0047AB;
                        font-weight: 600;
                    }
                    .culture-section ul {
                        margin: 0; padding-left: 20px; color: var(--text-secondary);
                        list-style-type: '✓ ';
                        padding-left: 1.5em;
                    }
                    .culture-section li { margin-bottom: 8px; }

                    /* --- Logo Image --- */
                    .logo-image-container {
                        text-align: center;
                        margin-bottom: 32px;
                    }
                    .logo-image {
                        width: 200px;
                        height: 200px;
                        border-radius: 12px;
                        border: 4px solid #1E90FF;
                        box-shadow: 0 8px 24px rgba(30, 144, 255, 0.25);
                        object-fit: cover;
                    }

                    /* --- Highlight Section --- */
                    .highlight-section {
                        background: #fff;
                        padding: 24px;
                        border-radius: 12px;
                        border-left: 5px solid #1E90FF;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    }
                    .highlight-section h3 {
                        margin-top: 0;
                    }
                    

                    /* --- Footer --- */
                    .culture-modal-footer {
                        display: flex;
                        justify-content: flex-end;
                        padding: 20px 30px;
                        background: #fff;
                        border-top: 1px solid var(--border-color);
                        flex-shrink: 0;
                    }
                    .back-button {
                        padding: 12px 28px;
                        background: #0047AB;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 15px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    .back-button:hover {
                        background: #1E90FF;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
                    }
                    /* --- Mobile Optimizations --- */
                    @media (max-width: 768px) {
                        .culture-modal-container {
                            width: 100vw;
                            height: 100vh;
                            max-width: 100vw;
                            max-height: 100vh;
                            border-radius: 0;
                        }
                        .culture-modal-header {
                            padding: 15px 20px; /* Smaller padding */
                        }
                        .culture-modal-title {
                            font-size: 18px; /* Smaller font size */
                        }
                        .culture-modal-title span:first-child { /* Emoji */
                            font-size: 24px;
                        }
                        .culture-modal-close-btn {
                            font-size: 24px; /* Smaller font size */
                            width: 36px;
                            height: 36px;
                        }
                        .culture-modal-content {
                            padding: 20px; /* Smaller padding */
                            font-size: 14px; /* Smaller font size for content */
                        }
                        .culture-section h2 {
                            font-size: 20px; /* Smaller section headers */
                        }
                        .culture-section h3 {
                            font-size: 16px; /* Smaller sub-headers */
                        }
                        .highlight-section h3 {
                            font-size: 16px; /* Smaller sub-headers */
                        }
                        .culture-modal-footer {
                            padding: 15px 20px; /* Smaller padding */
                        }
                        .back-button {
                            padding: 10px 20px; /* Smaller padding */
                            font-size: 14px; /* Smaller font size */
                            width: 100%; /* Full width button */
                        }
                    }
                </style>
                <!-- ====== END OF CSS ====== -->

                <div class="culture-modal-container">
                    <header class="culture-modal-header">
                        <h1 class="culture-modal-title">
                            <span style="font-size: 28px;">🌊</span>
                            <span>Moon Tide Reconciliation</span>
                        </h1>
                        <button class="culture-modal-close-btn" id="musqueam-close-btn" title="Close">✕</button>
                    </header>

                    <main class="culture-modal-content">
                        <!-- LOGO IMAGE -->
                        <div class="logo-image-container">
                            <img src="/images/MOON TIDE/moon-logo.png" alt="Moon Tide Reconciliation" class="logo-image">
                        </div>

                        <!-- INTRODUCTION -->
                        <section class="culture-section">
                            <h2>Our Vision</h2>
                            <p>
                                <strong>Moon Tide Reconciliation</strong> is a collective of Indigenous Elders, knowledge keepers, artists, and facilitators deeply rooted in the ancestral wisdom and living traditions of our peoples. Our name reflects the natural, cyclical pull toward understanding—a tide that invites everyone to engage in the vital work of reconciliation.
                            </p>
                            <p>
                                We believe that true <strong>reconciliation is not built on words alone</strong>, but through <strong>shared, tangible experiences</strong> that open hearts and minds.
                            </p>
                        </section>

                        <!-- OUR MISSION -->
                        <section class="culture-section">
                            <h2>Our Mission</h2>
                            <p>
                                Our mission is to create <strong>powerful moments of connection</strong> that foster empathy, dialogue, and healing. We guide individuals and organizations on a <strong>transformative journey from awareness toward meaningful action</strong>, building a more just and equitable future for all who share this land.
                            </p>
                            <p>
                                We offer a variety of <strong>transformative cultural workshops</strong> designed to engage hearts and minds, from interactive experiences to hands-on artistic practices that honor Indigenous wisdom.
                            </p>
                        </section>

                        <!-- OUR APPROACH -->
                        <section class="culture-section">
                            <h2>Our Approach</h2>

                            <div>
                                <h3>🎓 Education & Dialogue</h3>
                                <p>
                                    Through workshops like the Kairos Blanket Exercise, we create spaces where participants engage with the complex history of Indigenous peoples in Canada, fostering deeper understanding and empathy.
                                </p>
                            </div>

                            <div>
                                <h3>🎨 Artistic Practices</h3>
                                <p>
                                    From cedar weaving to medicine pouch making, our workshops teach traditional arts while creating meaningful connections to Indigenous knowledge and spiritual practices.
                                </p>
                            </div>

                            <div>
                                <h3>💚 Healing & Connection</h3>
                                <p>
                                    We create safe spaces where dialogue, reflection, and shared experience lead to genuine transformation and healing for individuals and organizations.
                                </p>
                            </div>
                        </section>

                        <!-- VALUES -->
                        <section class="culture-section">
                            <h2>Our Core Values</h2>
                            <p>
                                <strong>Authenticity:</strong> We honor ancestral wisdom while embracing contemporary understanding.
                            </p>
                            <p>
                                <strong>Inclusion:</strong> We welcome individuals and organizations of all backgrounds to join this vital work.
                            </p>
                            <p>
                                <strong>Healing:</strong> We prioritize creating spaces for genuine connection and transformation.
                            </p>
                            <p>
                                <strong>Respect:</strong> We honor the land, our communities, and each person's journey toward understanding.
                            </p>
                        </section>

                        <!-- OUR MOTTO -->
                        <section class="culture-section">
                            <h2>Our Motto</h2>
                            <p style="font-size: 18px; font-style: italic; color: #1E90FF; margin-bottom: 12px;">
                                "We cannot command the tide, only learn to navigate its currents toward a shared horizon."
                            </p>
                            <p>
                                This reflects our belief that reconciliation is a continuous journey, one we undertake together with humility, wisdom, and commitment to creating meaningful change.
                            </p>
                        </section>
                    </main>

                    <footer class="culture-modal-footer">
                        <button class="back-button" onclick="window.moduleManager.closeCurrentModule()">← Back to Chat</button>
                    </footer>
                </div>
            </div>
        `;

        return html;
    },

    async attachEventListeners(payload = {}) {
        console.log('[MusqueamModule] Attaching event listeners');

        const closeBtn = document.getElementById('musqueam-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.moduleManager) {
                    window.moduleManager.closeCurrentModule();
                }
            });
        }
        
        const backdrop = document.getElementById('musqueam-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                // Close only if the backdrop itself is clicked, not the modal content
                if (e.target === backdrop) {
                    if (window.moduleManager) {
                        window.moduleManager.closeCurrentModule();
                    }
                }
            });
        }
    }
};

export default musqueamModule;