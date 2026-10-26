(() => {
  window.GCVH_VIDEO_STUDIO_ACTIVE = true;
  const token = localStorage.getItem('gcvh_customer_token') || sessionStorage.getItem('gcvh_customer_token');
  if (!token) {
    location.replace('login.html');
    return;
  }

  const apiBase = window.GCVH_CONFIG.API_BASE_URL;
  const container = document.getElementById('videosContainer');
  const alertBox = document.getElementById('videoAlert');
  const pager = document.getElementById('videoPagination');
  const pageLabel = document.getElementById('videoPageLabel');
  const previousPageButton = document.getElementById('previousVideosPage');
  const nextPageButton = document.getElementById('nextVideosPage');
  const uploadModal = document.getElementById('uploadModal');
  const uploadForm = document.getElementById('uploadForm');
  const submitButton = document.getElementById('submitUploadBtn');
  const fileInput = document.getElementById('upVideoFile');
  let activeTab = 'my';
  let currentPage = 1;
  let lastPage = 1;
  let requestSerial = 0;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function showAlert(message, isError = false) {
    alertBox.textContent = message;
    alertBox.className = `video-alert ${isError ? 'error' : 'success'}`;
    alertBox.hidden = false;
  }

  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem('gcvh_customer_token');
      sessionStorage.removeItem('gcvh_customer_token');
      location.replace('login.html');
      throw new Error('Your session expired. Please sign in again.');
    }
    if (!response.ok) throw new Error(data.error || data.message || 'Request failed.');
    return data;
  }

  function resolvePublishedVideo(url) {
    if (!url) return '';
    try {
      const apiUrl = new URL(apiBase);
      const videoUrl = new URL(url, apiUrl.origin);
      if (!['http:', 'https:'].includes(videoUrl.protocol)) return '';
      return videoUrl.href;
    } catch (_) {
      return '';
    }
  }

  function updatePager(pageData) {
    lastPage = Math.max(1, Number(pageData.totalPages || 1));
    pageLabel.textContent = `Page ${pageData.page || currentPage} of ${lastPage} · ${Number(pageData.total || 0)} videos`;
    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= lastPage;
    pager.hidden = lastPage <= 1;
  }

  function statusBadge(status) {
    const labels = {
      pending: 'Pending review',
      approved: 'Published · $5 credited',
      rejected: 'Not approved'
    };
    return `<span class="video-status ${escapeHtml(status)}">${labels[status] || 'Published'}</span>`;
  }

  function renderVideos(items) {
    if (!items.length) {
      container.innerHTML = `
        <div class="video-empty">
          <div style="font-size:36px;margin-bottom:10px;">🎬</div>
          <h3>${activeTab === 'my' ? "You haven't submitted any videos yet." : 'No published videos yet.'}</h3>
          <p>${activeTab === 'my' ? 'Upload a video and submit it for admin review. Approved videos earn a one-time $5 reward.' : 'Approved member videos will appear here.'}</p>
        </div>`;
      return;
    }

    container.innerHTML = items.map(video => {
      const publishedUrl = resolvePublishedVideo(video.video_url);
      const needsPrivatePreview = activeTab === 'my' && video.source === 'request' && !publishedUrl;
      const previewId = Number(video.request_id || video.id);
      const videoElement = publishedUrl
        ? `<video src="${escapeHtml(publishedUrl)}" controls preload="metadata" playsinline></video>`
        : `<video controls preload="none" playsinline></video>`;
      const previewControl = needsPrivatePreview
        ? `<button class="video-preview-btn" type="button" data-preview-id="${previewId}">Load private preview</button>`
        : '';
      const videoStatus = activeTab === 'my' ? statusBadge(video.status) : '';
      const adminNote = video.status === 'rejected' && video.admin_note
        ? `<p class="video-review-note"><b>Admin note:</b> ${escapeHtml(video.admin_note)}</p>`
        : '';
      const rewardNotice = video.status === 'approved'
        ? '<p class="video-reward-note">The $5.00 reward has been added to your available account balance.</p>'
        : '';

      return `
        <article class="video-card">
          <div class="video-player-wrap">${videoElement}</div>
          <div class="video-card-body">
            <div class="video-card-topline">${videoStatus}<span class="video-date">${escapeHtml(video.created_at ? new Date(video.created_at).toLocaleDateString() : '')}</span></div>
            <h3 class="video-card-title">${escapeHtml(video.title || 'Member video')}</h3>
            <p class="video-card-desc">${escapeHtml(video.description || '')}</p>
            <div class="video-meta"><span>By <b>${escapeHtml(video.author || 'Member')}</b></span></div>
            ${previewControl}${adminNote}${rewardNotice}
          </div>
        </article>`;
    }).join('');

    container.querySelectorAll('.video-preview-btn').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Loading preview…';
        try {
          const response = await fetch(`${apiBase}/videos/mine/${button.dataset.previewId}/media`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Unable to load private video preview.');
          }
          const video = button.closest('.video-card').querySelector('video');
          video.src = URL.createObjectURL(await response.blob());
          button.remove();
        } catch (error) {
          button.disabled = false;
          button.textContent = 'Retry private preview';
          showAlert(error.message, true);
        }
      });
    });
  }

  async function loadVideos() {
    const serial = ++requestSerial;
    alertBox.hidden = true;
    container.innerHTML = '<div class="video-empty">Loading videos…</div>';
    pager.hidden = true;
    try {
      const endpoint = activeTab === 'my'
        ? `/videos/mine?page=${currentPage}`
        : `/videos?page=${currentPage}`;
      const data = await request(endpoint);
      if (serial !== requestSerial) return;
      currentPage = Number(data.page || currentPage);
      renderVideos(Array.isArray(data.items) ? data.items : []);
      updatePager(data);
    } catch (error) {
      if (serial !== requestSerial) return;
      container.innerHTML = '<div class="video-empty">Unable to load videos. Please refresh and try again.</div>';
      showAlert(error.message, true);
    }
  }

  document.getElementById('tabMyVideos').addEventListener('click', () => {
    activeTab = 'my';
    currentPage = 1;
    document.getElementById('tabMyVideos').classList.add('active');
    document.getElementById('tabCommunity').classList.remove('active');
    loadVideos();
  });

  document.getElementById('tabCommunity').addEventListener('click', () => {
    activeTab = 'community';
    currentPage = 1;
    document.getElementById('tabCommunity').classList.add('active');
    document.getElementById('tabMyVideos').classList.remove('active');
    loadVideos();
  });

  previousPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadVideos();
    }
  });
  nextPageButton.addEventListener('click', () => {
    if (currentPage < lastPage) {
      currentPage += 1;
      loadVideos();
    }
  });

  document.getElementById('openUploadBtn').addEventListener('click', () => uploadModal.classList.add('open'));
  document.getElementById('closeUploadModal').addEventListener('click', () => uploadModal.classList.remove('open'));
  document.getElementById('cancelUploadBtn').addEventListener('click', () => uploadModal.classList.remove('open'));

  uploadForm.addEventListener('submit', async event => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      showAlert('Choose a video file before submitting.', true);
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      showAlert('Video files must be 200 MB or smaller.', true);
      return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('upTitle').value.trim());
    formData.append('description', document.getElementById('upDescription').value.trim());
    formData.append('video', file);
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting…';

    try {
      const data = await request('/videos', { method: 'POST', body: formData });
      uploadForm.reset();
      uploadModal.classList.remove('open');
      activeTab = 'my';
      currentPage = 1;
      document.getElementById('tabMyVideos').classList.add('active');
      document.getElementById('tabCommunity').classList.remove('active');
      showAlert(data.message || 'Video submitted for admin review.');
      loadVideos();
    } catch (error) {
      showAlert(error.message, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit for Review';
    }
  });

  const profileName = document.getElementById('sidebarUserName');
  const profileAvatar = document.getElementById('sidebarAvatar');
  try {
    const user = JSON.parse(localStorage.getItem('gcvh_customer_user') || sessionStorage.getItem('gcvh_customer_user') || '{}');
    const name = user.full_name || user.fullName || user.email || '';
    if (name && profileName) profileName.textContent = name;
    if (name && profileAvatar) profileAvatar.textContent = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  } catch (_) {}

  request('/me').then(me => {
    const reward = document.getElementById('videoRewardBalance');
    if (reward) reward.textContent = `$${Number(me.video_reward_balance || 0).toFixed(2)}`;
  }).catch(error => showAlert(error.message, true));

  loadVideos();
})();
