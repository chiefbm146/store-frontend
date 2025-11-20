/**
 * Chrystal Sparrow Biography Module - v2.0 (Self-Contained with Professional UI)
 *
 * This module has been completely redesigned to align with the professional infographic aesthetic.
 * It is now fully self-contained and no longer relies on external CSS like 'fullscreen-modals.css'.
 * The layout presents Chrystal Sparrow's biography in a clean, article-style modal with
 * a Musqueam-inspired color palette (red, black, warm white).
 */

const chrystalModule = {
    async getHtml(payload = {}) {
        const html = `
            <div id="chrystal-backdrop" class="bio-modal-backdrop">
                
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

                    .bio-modal-backdrop {
                        position: fixed;
                        top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }

                    .bio-modal-container {
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
                    .bio-modal-header {
                        background: linear-gradient(135deg, #1E90FF 0%, #0047AB 100%);
                        color: white;
                        padding: 20px 30px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 3px solid #1E90FF;
                        box-shadow: 0 4px 15px rgba(30, 144, 255, 0.3);
                    }
                    .bio-modal-title {
                        font-size: 22px;
                        font-weight: 700;
                        color: white;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .bio-modal-close-btn {
                        background: none; border: none; color: white;
                        font-size: 28px; cursor: pointer; padding: 0;
                        width: 40px; height: 40px; display: flex;
                        align-items: center; justify-content: center;
                        transition: all 0.2s ease; border-radius: 50%;
                    }
                    .bio-modal-close-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                        transform: rotate(90deg);
                    }

                    /* --- Content Area --- */
                    .bio-modal-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 40px;
                        line-height: 1.8;
                        font-size: 16px;
                        color: var(--text-primary);
                    }
                    .bio-modal-content::-webkit-scrollbar { width: 8px; }
                    .bio-modal-content::-webkit-scrollbar-track { background: transparent; }
                    .bio-modal-content::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
                    .bio-modal-content::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

                    .bio-section { margin-bottom: 40px; }
                    .bio-section h2 {
                        color: #1E90FF;
                        font-size: 24px;
                        font-weight: 800;
                        margin-bottom: 16px;
                        border-bottom: 2px solid var(--border-color);
                        padding-bottom: 12px;
                        letter-spacing: -0.5px;
                    }
                    .bio-section h3 {
                        color: var(--musqueam-black);
                        font-size: 18px;
                        font-weight: 700;
                        margin: 0 0 8px 0;
                    }
                    .bio-section p {
                        margin: 0 0 16px 0;
                        color: var(--text-secondary);
                    }
                    .bio-section strong {
                        color: #0047AB;
                        font-weight: 600;
                    }

                    /* --- Profile Image --- */
                    .profile-image-container {
                        text-align: center;
                        margin-bottom: 32px;
                    }
                    .profile-image {
                        width: 200px;
                        height: 200px;
                        border-radius: 12px;
                        border: 4px solid #1E90FF;
                        box-shadow: 0 8px 24px rgba(30, 144, 255, 0.25);
                        object-fit: cover;
                    }

                    /* --- Contact Info Styling --- */
                    .contact-info {
                        padding: 16px;
                        border-radius: 8px;
                        margin: 12px 0;
                    }
                    .contact-info strong {
                        color: #0047AB;
                        font-weight: 600;
                    }
                    .contact-value {
                        color: #C41E3A;
                        font-weight: 600;
                        cursor: pointer;
                        position: relative;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .contact-value:hover {
                        text-decoration: underline;
                    }
                    .contact-icon {
                        font-size: 16px;
                    }
                    .copy-feedback {
                        position: absolute;
                        bottom: 120%;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #333;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        white-space: nowrap;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        pointer-events: none;
                    }
                    .contact-value.copied .copy-feedback {
                        opacity: 1;
                    }

                    /* --- Quote Section --- */
                    .quote-section {
                        background: #ADD8E6;
                        padding: 24px;
                        border-radius: 12px;
                        border-left: 5px solid #1E90FF;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    }
                    .quote-section p:first-child {
                        font-style: italic;
                        color: var(--text-primary);
                        font-size: 18px;
                    }

                    /* --- Footer --- */
                    .bio-modal-footer {
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
                        .bio-modal-container {
                            width: 100vw;
                            height: 100vh;
                            max-width: 100vw;
                            max-height: 100vh;
                            border-radius: 0;
                        }
                        .bio-modal-header {
                            padding: 15px 20px; /* Smaller padding */
                        }
                        .bio-modal-title {
                            font-size: 18px; /* Smaller font size */
                        }
                        .bio-modal-title span:first-child { /* Emoji */
                            font-size: 24px;
                        }
                        .bio-modal-close-btn {
                            font-size: 24px; /* Smaller font size */
                            width: 36px;
                            height: 36px;
                        }
                        .bio-modal-content {
                            padding: 20px; /* Smaller padding */
                            font-size: 14px; /* Smaller font size for content */
                        }
                        .bio-section h2 {
                            font-size: 20px; /* Smaller section headers */
                        }
                        .bio-section h3 {
                            font-size: 16px; /* Smaller sub-headers */
                        }
                        .quote-section p:first-child {
                            font-size: 16px; /* Smaller quote font size */
                        }
                        .bio-modal-footer {
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

                <div class="bio-modal-container">
                    <header class="bio-modal-header">
                        <h1 class="bio-modal-title">
                            <span style="font-size: 28px;">👤</span>
                            <span>About Shona Sparrow</span>
                        </h1>
                        <button class="bio-modal-close-btn" id="chrystal-close-btn" title="Close">✕</button>
                    </header>

                    <main class="bio-modal-content">
                        <!-- PROFILE IMAGE -->
                        <div class="profile-image-container">
                            <img src="/images/MOON TIDE/SHONA.jpg" alt="Shona Sparrow" class="profile-image">
                        </div>

                        <!-- INTRODUCTION -->
                        <section class="bio-section">
                            <h2>Our Lead Contact</h2>
                            <p>
                                <strong>Shona Sparrow</strong> is the lead contact and guiding force behind Moon Tide Reconciliation. She brings decades of experience, deep cultural knowledge, and a profound commitment to fostering meaningful reconciliation through transformative experiences.
                            </p>
                            <p>
                                Shona's leadership combines the wisdom of Indigenous traditions with a vision for creating powerful moments of connection that bridge communities and inspire lasting change.
                            </p>
                        </section>

                        <!-- MISSION -->
                        <section class="bio-section">
                            <h2>Moon Tide Reconciliation</h2>
                            <p>
                                We are a collective of <strong>Indigenous Elders</strong>, <strong>knowledge keepers</strong>, artists, and facilitators deeply rooted in the ancestral wisdom and living traditions of our peoples. Our name reflects the natural, cyclical pull toward understanding—a tide that invites everyone to engage in the vital work of reconciliation.
                            </p>
                            <p>
                                We believe that true <strong>reconciliation is not built on words alone</strong>, but through shared, tangible experiences that <strong>open hearts and minds</strong>.
                            </p>
                        </section>

                        <!-- OUR WORK -->
                        <section class="bio-section">
                            <h2>Our Mission</h2>
                            <p>
                                Our mission is to create <strong>powerful moments of connection</strong> that foster empathy, dialogue, and healing, guiding individuals and organizations on a <strong>transformative journey from awareness toward meaningful action</strong> and a more just, equitable future for all who share this land.
                            </p>
                            <p>
                                We offer a variety of <strong>transformative cultural workshops</strong> designed to engage hearts and minds, from interactive experiences like the Kairos Blanket Exercise to hands-on cedar weaving and sacred medicine pouch making.
                            </p>
                        </section>

                        <!-- VALUES -->
                        <section class="bio-section">
                            <h2>Our Approach</h2>
                            <p>
                                <strong>Authenticity:</strong> We honor ancestral wisdom while embracing contemporary understanding.
                            </p>
                            <p>
                                <strong>Inclusion:</strong> We welcome individuals and organizations of all backgrounds to engage in the journey of reconciliation.
                            </p>
                            <p>
                                <strong>Healing:</strong> We create spaces where dialogue, reflection, and connection lead to genuine transformation.
                            </p>
                            <p>
                                <strong>Respect:</strong> We honor the land, our communities, and each person's journey toward understanding.
                            </p>
                        </section>

                        <!-- CONTACT -->
                        <section class="bio-section">
                            <h2>Connect With Us</h2>
                            <div class="contact-info">
                                <p>
                                    <strong>Phone:</strong> <span class="contact-value" id="phone-copy" title="Click to call">
                                        <span class="contact-icon">📞</span>
                                        <span>236-300-3005</span>
                                        <span class="copy-feedback">Copied!</span>
                                    </span><br>
                                    <strong>Email:</strong> <span class="contact-value" id="email-copy" title="Click to copy">
                                        <span class="contact-icon">📋</span>
                                        <span>shona@moontidereconciliation.com</span>
                                        <span class="copy-feedback">Copied!</span>
                                    </span><br>
                                    <strong>Website:</strong> <span class="contact-value" id="website-copy" title="Click to copy">
                                        <span class="contact-icon">🔗</span>
                                        <span>www.moontidereconciliation.com</span>
                                        <span class="copy-feedback">Copied!</span>
                                    </span><br>
                                    <strong>Locations:</strong> Douglas Lake and Vancouver, BC
                                </p>
                            </div>
                        </section>

                        <!-- CLOSING -->
                        <section class="quote-section">
                            <p>
                                "We cannot command the tide, only learn to navigate its currents toward a shared horizon."
                            </p>
                            <p style="margin: 12px 0 0 0; color: #666; font-size: 14px; font-weight: 600; text-align: right;">
                                — Moon Tide Reconciliation
                            </p>
                        </section>
                    </main>

                    <footer class="bio-modal-footer">
                        <button class="back-button" onclick="window.moduleManager.closeCurrentModule()">← Back to Chat</button>
                    </footer>
                </div>
            </div>
        `;

        return html;
    },

    async attachEventListeners(payload = {}) {
        console.log('[ChrystalModule] Attaching event listeners');

        const closeBtn = document.getElementById('chrystal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.moduleManager) {
                    window.moduleManager.closeCurrentModule();
                }
            });
        }

        const backdrop = document.getElementById('chrystal-backdrop');
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

        // Phone copy functionality
        const phoneCopy = document.getElementById('phone-copy');
        if (phoneCopy) {
            phoneCopy.addEventListener('click', async () => {
                const phone = '236-300-3005';
                try {
                    await navigator.clipboard.writeText(phone);
                    phoneCopy.classList.add('copied');
                    setTimeout(() => {
                        phoneCopy.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy phone:', err);
                }
            });
        }

        // Email copy functionality
        const emailCopy = document.getElementById('email-copy');
        if (emailCopy) {
            emailCopy.addEventListener('click', async () => {
                const email = 'shona@moontidereconciliation.com';
                try {
                    await navigator.clipboard.writeText(email);
                    emailCopy.classList.add('copied');
                    setTimeout(() => {
                        emailCopy.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy email:', err);
                }
            });
        }

        // Website copy functionality
        const websiteCopy = document.getElementById('website-copy');
        if (websiteCopy) {
            websiteCopy.addEventListener('click', async () => {
                const website = 'www.moontidereconciliation.com';
                try {
                    await navigator.clipboard.writeText(website);
                    websiteCopy.classList.add('copied');
                    setTimeout(() => {
                        websiteCopy.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy website:', err);
                }
            });
        }
    }
};

export default chrystalModule;