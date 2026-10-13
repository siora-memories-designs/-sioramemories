/**
 * Siora Memories and Design - Customer & Google Reviews System
 * Flipkart-style customer review cards, verified backend persistent reviews,
 * and official Google Business Profile API status integration.
 */

(function () {
  'use strict';

  // State
  let reviewsState = {
    websiteReviews: [],
    googleReviews: [],
    googleConnected: false,
    googleMessage: ''
  };

  const ratingDescriptions = {
    1: '1 - Terrible',
    2: '2 - Poor',
    3: '3 - Average',
    4: '4 - Very Good',
    5: '5 - Excellent'
  };

  // Helper to escape HTML safely
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Format ISO date into "09 Oct 2026"
  function formatDate(isoStr) {
    if (!isoStr) return 'Recently';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Recently';
    }
  }

  // Calculate rating stats
  function calculateStats(reviews) {
    if (!reviews || reviews.length === 0) {
      return { count: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach(r => {
      const rating = parseInt(r.rating, 10) || 5;
      dist[rating] = (dist[rating] || 0) + 1;
      sum += rating;
    });
    return {
      count: reviews.length,
      average: (sum / reviews.length).toFixed(1),
      distribution: dist
    };
  }

  // Fetch reviews from backend API
  async function fetchReviews() {
    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      reviewsState.websiteReviews = data.websiteReviews || [];
      reviewsState.googleReviews = data.googleReviews || [];
      reviewsState.googleConnected = Boolean(data.googleConnected);
      reviewsState.googleMessage = data.googleMessage || '';
      return reviewsState;
    } catch (err) {
      console.warn('Could not fetch reviews from server, falling back to empty:', err);
      return reviewsState;
    }
  }

  // Render Rating Summary (Flipkart style overview)
  function renderSummary(container, reviews) {
    if (!container) return;
    const stats = calculateStats(reviews);

    if (stats.count === 0) {
      container.innerHTML = `
        <div class="fk-summary-card empty-summary">
          <div class="fk-summary-header">
            <div class="fk-summary-title">
              <h3>Customer Reviews</h3>
              <p>Ratings and reviews from genuine customers</p>
            </div>
            <button class="btn btn-primary open-review-modal-btn" type="button">
              <i class="fas fa-pencil-alt"></i> Write a Review
            </button>
          </div>
          <div class="fk-empty-prompt">
            <i class="far fa-comment-dots"></i>
            <p>No reviews yet. Be the first to share your experience with Siora Memories and Design!</p>
          </div>
        </div>
      `;
      return;
    }

    const avg = parseFloat(stats.average);
    const avgClass = avg >= 4.0 ? 'high' : avg >= 3.0 ? 'medium' : 'low';

    container.innerHTML = `
      <div class="fk-summary-card">
        <div class="fk-summary-header">
          <div class="fk-summary-title">
            <h3>Customer Reviews</h3>
            <p>Verified ratings and reviews from genuine customers</p>
          </div>
          <button class="btn btn-primary open-review-modal-btn" type="button">
            <i class="fas fa-pencil-alt"></i> Write a Review
          </button>
        </div>
        <div class="fk-summary-body">
          <div class="fk-rating-score-box">
            <div class="fk-score-badge ${avgClass}">
              <span>${stats.average}</span>
              <i class="fas fa-star"></i>
            </div>
            <div class="fk-score-meta">
              <strong>${stats.count} ${stats.count === 1 ? 'Rating & Review' : 'Ratings & Reviews'}</strong>
              <span>Verified Customer Feedback</span>
            </div>
          </div>
          <div class="fk-rating-bars">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star] || 0;
              const pct = stats.count > 0 ? Math.round((count / stats.count) * 100) : 0;
              return `
                <div class="fk-bar-row">
                  <span class="fk-bar-label">${star} <i class="fas fa-star"></i></span>
                  <div class="fk-bar-track">
                    <div class="fk-bar-fill star-${star}" style="width: ${pct}%;"></div>
                  </div>
                  <span class="fk-bar-count">${count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Render Flipkart-style individual review card HTML
  function createReviewCardHTML(review) {
    const rating = Math.max(1, Math.min(5, parseInt(review.rating, 10) || 5));
    const isGoogle = review.source === 'google';
    const sourceLabel = isGoogle ? 'Google Review' : 'Website Review';
    const badgeClass = isGoogle ? 'google-source' : 'website-source';
    const pillClass = rating >= 4 ? 'pill-high' : rating >= 3 ? 'pill-med' : 'pill-low';

    return `
      <article class="fk-review-card" data-id="${escapeHtml(review.id || '')}">
        <div class="fk-card-top">
          <div class="fk-rating-pill ${pillClass}">
            ${rating} <i class="fas fa-star"></i>
          </div>
          <span class="fk-source-badge ${badgeClass}">
            <i class="${isGoogle ? 'fab fa-google' : 'fas fa-check-circle'}"></i> ${sourceLabel}
          </span>
        </div>
        <div class="fk-review-body">
          <p class="fk-review-comment">${escapeHtml(review.text)}</p>
        </div>
        <div class="fk-card-bottom">
          <div class="fk-author-section">
            <span class="fk-author-name">${escapeHtml(review.name)}</span>
            <span class="fk-verified-buyer"><i class="fas fa-badge-check"></i> Verified Buyer</span>
          </div>
          <span class="fk-review-date">${formatDate(review.date)}</span>
        </div>
      </article>
    `;
  }

  // Render list of review cards
  function renderReviewsList(container, reviews) {
    if (!container) return;

    if (!reviews || reviews.length === 0) {
      container.innerHTML = `
        <div class="fk-no-reviews-box">
          <i class="far fa-star"></i>
          <h4>No Website Reviews Yet</h4>
          <p>We take pride in every handcrafted album, website, and design. Be the first to write a review!</p>
          <button class="btn btn-primary open-review-modal-btn" type="button" style="margin-top: 15px;">
            <i class="fas fa-pencil-alt"></i> Write the First Review
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => createReviewCardHTML(r)).join('');
  }

  // Update Google Reviews container
  function updateGoogleSection(container, data) {
    if (!container) return;

    if (data.googleConnected && data.googleReviews && data.googleReviews.length > 0) {
      container.innerHTML = `
        <div class="google-logo" style="margin-bottom: 25px;">
          <i class="fab fa-google" style="font-size: 48px; color: #4285F4; margin-bottom: 10px;"></i>
          <h3 style="font-size: 1.6rem; color: var(--dark-color); font-family: var(--font-heading);">SIORA Memories and Design</h3>
          <span class="google-status-pill connected"><i class="fas fa-check-circle"></i> Connected to Google Business Profile</span>
        </div>
        <div class="google-reviews-grid">
          ${data.googleReviews.map(r => createReviewCardHTML(r)).join('')}
        </div>
        <div style="margin-top: 25px;">
          <a href="https://www.google.com/search?q=SIORA+Memories+and+Design" target="_blank" class="btn-google">
            <i class="fas fa-pencil-alt"></i> Review us on Google
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="google-logo" style="margin-bottom: 20px;">
          <i class="fab fa-google" style="font-size: 48px; color: #4285F4; margin-bottom: 10px;"></i>
          <h3 style="font-size: 1.6rem; color: var(--dark-color); font-family: var(--font-heading);">SIORA Memories and Design</h3>
        </div>
        <div class="google-status-box">
          <div class="google-status-pill not-connected">
            <i class="fas fa-link-slash"></i> Google Business Profile API: Not Connected
          </div>
          <p class="google-status-desc">
            Direct Google reviews sync automatically when official Google API credentials are provided.
            You can still share your love and rate us directly on Google!
          </p>
        </div>
        <div style="margin-top: 25px;">
          <a href="https://www.google.com/search?q=SIORA+Memories+and+Design" target="_blank" class="btn-google">
            <i class="fas fa-pencil-alt"></i> Review us on Google
          </a>
        </div>
      `;
    }
  }

  // Modal injector & manager
  function ensureReviewModal() {
    let modal = document.getElementById('review-modal');
    if (modal) return modal;

    const modalHTML = `
      <div id="review-modal" class="fk-modal-overlay" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="fk-modal-dialog">
          <div class="fk-modal-header">
            <div class="fk-modal-title-group">
              <h3 id="modal-title"><i class="fas fa-star" style="color: #cfae70; margin-right: 8px;"></i> Write a Review</h3>
              <p>Share your experience with Siora Memories and Design</p>
            </div>
            <button type="button" class="fk-modal-close" id="close-review-modal" aria-label="Close modal">&times;</button>
          </div>

          <form id="review-submission-form" novalidate>
            <div class="fk-form-group">
              <label class="fk-label">Rate Your Experience <span class="required">*</span></label>
              <div class="fk-star-picker" id="star-picker" role="radiogroup" aria-label="Rating from 1 to 5 stars">
                <button type="button" class="star-btn" data-rating="1" aria-label="1 star"><i class="fas fa-star"></i></button>
                <button type="button" class="star-btn" data-rating="2" aria-label="2 stars"><i class="fas fa-star"></i></button>
                <button type="button" class="star-btn" data-rating="3" aria-label="3 stars"><i class="fas fa-star"></i></button>
                <button type="button" class="star-btn" data-rating="4" aria-label="4 stars"><i class="fas fa-star"></i></button>
                <button type="button" class="star-btn active" data-rating="5" aria-label="5 stars"><i class="fas fa-star"></i></button>
              </div>
              <div class="fk-rating-text" id="rating-text">5 - Excellent</div>
              <input type="hidden" name="rating" id="review-rating-input" value="5">
            </div>

            <div class="fk-form-group">
              <label class="fk-label" for="review-name-input">Your Name <span class="required">*</span></label>
              <input 
                type="text" 
                id="review-name-input" 
                name="name" 
                class="fk-input" 
                placeholder="Enter your name (e.g. Priya)" 
                maxlength="60"
                required
              >
              <span class="fk-field-error" id="name-error"></span>
            </div>

            <div class="fk-form-group">
              <label class="fk-label" for="review-text-input">Your Review <span class="required">*</span></label>
              <textarea 
                id="review-text-input" 
                name="text" 
                class="fk-textarea" 
                rows="4" 
                placeholder="Tell us what you loved about our work, quality, or service..."
                maxlength="1000"
                required
              ></textarea>
              <div class="fk-textarea-meta">
                <span class="fk-field-error" id="text-error"></span>
                <span class="fk-char-counter"><span id="char-count">0</span> / 1000</span>
              </div>
            </div>

            <div class="fk-form-alert" id="form-alert" style="display: none;"></div>

            <div class="fk-modal-footer">
              <button type="button" class="btn btn-secondary" id="cancel-review-btn">Cancel</button>
              <button type="submit" class="btn btn-primary" id="submit-review-btn">
                <span class="btn-text">Submit Review</span>
                <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i> Submitting...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('review-modal');
    setupModalEvents(modal);
    return modal;
  }

  // Setup modal behavior & validation
  function setupModalEvents(modal) {
    const form = document.getElementById('review-submission-form');
    const closeBtn = document.getElementById('close-review-modal');
    const cancelBtn = document.getElementById('cancel-review-btn');
    const starPicker = document.getElementById('star-picker');
    const ratingInput = document.getElementById('review-rating-input');
    const ratingText = document.getElementById('rating-text');
    const nameInput = document.getElementById('review-name-input');
    const textInput = document.getElementById('review-text-input');
    const charCount = document.getElementById('char-count');
    const nameError = document.getElementById('name-error');
    const textError = document.getElementById('text-error');
    const formAlert = document.getElementById('form-alert');
    const submitBtn = document.getElementById('submit-review-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    let currentRating = 5;

    function updateStars(rating) {
      currentRating = rating;
      ratingInput.value = rating;
      ratingText.textContent = ratingDescriptions[rating] || `${rating} Stars`;

      const buttons = starPicker.querySelectorAll('.star-btn');
      buttons.forEach(btn => {
        const val = parseInt(btn.getAttribute('data-rating'), 10);
        if (val <= rating) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Star click & hover
    starPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.star-btn');
      if (!btn) return;
      const r = parseInt(btn.getAttribute('data-rating'), 10);
      updateStars(r);
    });

    starPicker.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.star-btn');
      if (!btn) return;
      const hoverRating = parseInt(btn.getAttribute('data-rating'), 10);
      const buttons = starPicker.querySelectorAll('.star-btn');
      buttons.forEach(b => {
        const val = parseInt(b.getAttribute('data-rating'), 10);
        if (val <= hoverRating) {
          b.classList.add('hover');
        } else {
          b.classList.remove('hover');
        }
      });
    });

    starPicker.addEventListener('mouseleave', () => {
      const buttons = starPicker.querySelectorAll('.star-btn');
      buttons.forEach(b => b.classList.remove('hover'));
    });

    // Character counter
    textInput.addEventListener('input', () => {
      charCount.textContent = textInput.value.length;
      if (textError.textContent) textError.textContent = '';
    });

    nameInput.addEventListener('input', () => {
      if (nameError.textContent) nameError.textContent = '';
    });

    function closeModal() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      form.reset();
      updateStars(5);
      charCount.textContent = '0';
      nameError.textContent = '';
      textError.textContent = '';
      formAlert.style.display = 'none';
      formAlert.className = 'fk-form-alert';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });

    // Submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const nameVal = nameInput.value.trim();
      const textVal = textInput.value.trim();
      const ratingVal = parseInt(ratingInput.value, 10) || 5;

      nameError.textContent = '';
      textError.textContent = '';
      formAlert.style.display = 'none';

      if (!nameVal || nameVal.length < 2) {
        nameError.textContent = 'Please enter your name (at least 2 characters).';
        valid = false;
      }

      if (!textVal || textVal.length < 5) {
        textError.textContent = 'Please share your review (at least 5 characters).';
        valid = false;
      }

      if (!valid) return;

      // Submit to backend
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';

      try {
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameVal,
            rating: ratingVal,
            text: textVal
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to submit review');
        }

        // Add newly submitted review to state
        reviewsState.websiteReviews.unshift(result.review);

        // Re-render UI
        const summaryContainer = document.getElementById('reviews-summary-container');
        const listContainer = document.getElementById('reviews-list-container');
        renderSummary(summaryContainer, reviewsState.websiteReviews);
        renderReviewsList(listContainer, reviewsState.websiteReviews);

        // Success state
        formAlert.className = 'fk-form-alert success';
        formAlert.textContent = 'Thank you! Your review has been submitted successfully.';
        formAlert.style.display = 'block';

        setTimeout(() => {
          closeModal();
          // Optional scroll to the top of review list
          if (listContainer) {
            listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 1200);

      } catch (err) {
        console.error('Review submit error:', err);
        formAlert.className = 'fk-form-alert error';
        formAlert.textContent = err.message || 'Something went wrong. Please try again.';
        formAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
      }
    });

    // Public open method
    modal.open = function () {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(() => nameInput.focus(), 100);
    };
  }

  // Attach global button listener for "Write a Review" buttons
  function attachOpenModalListeners(modal) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-review-modal-btn');
      if (btn) {
        e.preventDefault();
        modal.open();
      }
    });
  }

  // Initialize reviews module on page load
  async function init() {
    const summaryContainer = document.getElementById('reviews-summary-container');
    const listContainer = document.getElementById('reviews-list-container');
    const googleContainer = document.getElementById('google-reviews-placeholder') || document.querySelector('.google-reviews-container');

    // Only run if at least one review container exists on page
    if (!summaryContainer && !listContainer && !googleContainer) {
      return;
    }

    const modal = ensureReviewModal();
    attachOpenModalListeners(modal);

    // Fetch and render
    const data = await fetchReviews();
    renderSummary(summaryContainer, data.websiteReviews);
    renderReviewsList(listContainer, data.websiteReviews);
    if (googleContainer) {
      updateGoogleSection(googleContainer, data);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
