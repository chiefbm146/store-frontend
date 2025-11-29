/**
 * Affiliate User Menu System
 * Handles sign-in, affiliate status check, and portal display
 * For index.html and store-booking.html
 */

class AffiliateUserMenu {
  constructor() {
    this.user = null;
    this.affiliateData = null;
    this.init();
  }

  init() {
    // Wait for Firebase to be ready
    if (typeof firebase === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.user = user;
        this.checkAffiliateStatus();
        this.updateUIForSignedIn(user);
      } else {
        this.user = null;
        this.affiliateData = null;
        this.updateUIForSignedOut();
      }
    });
  }

  async checkAffiliateStatus() {
    if (!this.user) return;

    try {
      const idToken = await this.user.getIdToken(true);
      const response = await fetch('/api/client/affiliate-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.affiliateData = data;
        this.updatePortalUI(data);
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    }
  }

  updateUIForSignedOut() {
    // Hide portal, show sign-in button
    const signInBtn = document.getElementById('affiliateSignInBtn');
    const portal = document.getElementById('affiliatePortalContainer');

    if (signInBtn) signInBtn.style.display = 'inline-block';
    if (portal) portal.style.display = 'none';
  }

  updateUIForSignedIn(user) {
    // Hide sign-in button, show portal
    const signInBtn = document.getElementById('affiliateSignInBtn');
    const portal = document.getElementById('affiliatePortalContainer');
    const userNameEl = document.getElementById('affiliateUserName');

    if (signInBtn) signInBtn.style.display = 'none';
    if (portal) portal.style.display = 'block';
    if (userNameEl) {
      userNameEl.textContent = user.displayName || user.email.split('@')[0];
    }
  }

  updatePortalUI(affiliateData) {
    if (affiliateData.isAffiliate) {
      // User is an affiliate - show portal features
      this.showAffiliatePortal(affiliateData);
    } else {
      // User is not an affiliate - show signup form
      this.showAffiliateSignupForm();
    }
  }

  showAffiliatePortal(affiliateData) {
    const portalContent = document.getElementById('affiliatePortalContent');
    if (!portalContent) return;

    const affiliateId = affiliateData.affiliateId;
    const referralLink = `https://aarie.ca/?ref=${affiliateId}`;

    portalContent.innerHTML = `
      <div style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: #0891b2; font-size: 1.2rem;">Your Affiliate Dashboard</h3>

        <!-- Referral Link -->
        <div style="margin-bottom: 25px;">
          <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #1a1a1a;">Your Referral Link:</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" value="${referralLink}" readonly style="flex: 1; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; font-family: monospace; background: #f8f9fa;">
            <button onclick="navigator.clipboard.writeText('${referralLink}'); alert('Copied!');" style="padding: 10px 20px; background: #0891b2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Copy</button>
          </div>
        </div>

        <!-- Share Buttons -->
        <div style="margin-bottom: 25px;">
          <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #1a1a1a;">Share on Social Media:</label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}" target="_blank" style="padding: 10px 16px; background: #1877f2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">📘 Facebook</a>
            <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Check out AARIE.CA - The 7-Day Launchpad!')}" target="_blank" style="padding: 10px 16px; background: #000; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">𝕏 Twitter</a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}" target="_blank" style="padding: 10px 16px; background: #0a66c2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">in LinkedIn</a>
          </div>
        </div>

        <!-- Download Media -->
        <div style="margin-bottom: 15px;">
          <p style="font-weight: 600; color: #0891b2; margin-bottom: 10px;">📥 Download Marketing Materials</p>
          <a href="/affiliate-aarie#media-section" style="color: #0891b2; text-decoration: none; font-weight: 600;">View all videos & graphics →</a>
        </div>
      </div>
    `;
  }

  showAffiliateSignupForm() {
    const portalContent = document.getElementById('affiliatePortalContent');
    if (!portalContent) return;

    portalContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h3 style="margin-bottom: 15px; color: #0891b2; font-size: 1.2rem;">Become an Affiliate</h3>
        <p style="color: #666; margin-bottom: 20px; font-size: 0.95rem;">Earn 8% commission on every referral. Instant approval!</p>
        <a href="/affiliate-aarie" style="display: inline-block; padding: 12px 30px; background: #0891b2; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Apply Now</a>
      </div>
    `;
  }

  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  }

  logout() {
    firebase.auth().signOut().catch(error => {
      console.error('Logout error:', error);
    });
  }

  // Update social share buttons on page with affiliate link
  updatePageShareButtons() {
    if (!this.affiliateData || !this.affiliateData.isAffiliate) return;

    const affiliateId = this.affiliateData.affiliateId;
    const referralLink = `https://aarie.ca/?ref=${affiliateId}`;
    const encodedUrl = encodeURIComponent(referralLink);

    // Update any share buttons with id="pageShareBtn_[platform]"
    const facebookBtn = document.getElementById('pageShareBtn_facebook');
    const twitterBtn = document.getElementById('pageShareBtn_twitter');
    const linkedinBtn = document.getElementById('pageShareBtn_linkedin');

    if (facebookBtn) {
      facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    }
    if (twitterBtn) {
      twitterBtn.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent('Check out AARIE.CA!')}`;
    }
    if (linkedinBtn) {
      linkedinBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    }

    // Show affiliate badge
    const affiliateBadge = document.getElementById('affiliateBadge');
    if (affiliateBadge) {
      affiliateBadge.style.display = 'inline-block';
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.affiliateMenu = new AffiliateUserMenu();
});
