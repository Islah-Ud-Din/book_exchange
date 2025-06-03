// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  $('[data-toggle="tooltip"]').tooltip();

//   // Initialize Bootstrap popovers
  $('[data-toggle="popover"]').popover();

//   // Add CSRF token to all AJAX requests
$.ajaxSetup({
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
  }
});
  // Star rating functionality
  initStarRating();

  // Message read status
  initMessageRead();

  // Search form handling
  initSearchForm();

  // Genre badge click handling
  initGenreBadges();

  // Request status change handling
  initRequestStatus();

  // File input handling
  initFileInputs();

  // Form validation
  initFormValidation();
});

function initStarRating() {
  document.querySelectorAll('.rating .star').forEach(star => {
    star.addEventListener('click', function() {
      const rating = this.getAttribute('data-value');
      const container = this.closest('.rating');

      // Update visual stars
      container.querySelectorAll('.star').forEach((s, index) => {
        if (index < rating) {
          s.classList.add('fas');
          s.classList.remove('far');
        } else {
          s.classList.add('far');
          s.classList.remove('fas');
        }
      });

      // Update hidden input if exists
      const input = container.querySelector('input[type="hidden"]');
      if (input) {
        input.value = rating;
      }
    });
  });
}

function initMessageRead() {
  document.querySelectorAll('.message-link').forEach(link => {
    link.addEventListener('click', function() {
      const messageId = this.dataset.id;
      if (messageId) {
        fetch(`/messages/${messageId}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          }
        });
      }
    });
  });
}

function initSearchForm() {
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = document.getElementById('search-query').value.trim();
      const genre = document.getElementById('search-genre').value;
      const location = document.getElementById('search-location').value;

      // Build URL with query parameters
      let url = '/books/search?';
      if (query) url += `q=${encodeURIComponent(query)}&`;
      if (genre) url += `genre=${encodeURIComponent(genre)}&`;
      if (location) url += `location=${encodeURIComponent(location)}`;

      window.location.href = url;
    });
  }
}

function initGenreBadges() {
  document.querySelectorAll('.genre-badge').forEach(badge => {
    badge.addEventListener('click', function() {
      const genre = this.textContent.trim();
      const searchGenre = document.getElementById('search-genre');
      if (searchGenre) {
        searchGenre.value = genre;
        document.getElementById('search-form').submit();
      }
    });
  });
}

function initRequestStatus() {
  document.querySelectorAll('.request-status').forEach(select => {
    select.addEventListener('change', function() {
      const requestId = this.dataset.id;
      const status = this.value;

      fetch(`/requests/${requestId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ status })
      })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data.success) {
          location.reload();
        } else {
          alert('Error updating request status');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error updating request status');
      });
    });
  });
}

function initFileInputs() {
  document.querySelectorAll('.custom-file-input').forEach(input => {
    input.addEventListener('change', function(e) {
      const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose file';
      e.target.nextElementSibling.textContent = fileName;
    });
  });
}

function initFormValidation() {
  // Example form validation - extend as needed
  const forms = document.querySelectorAll('.needs-validation');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
}

// AJAX helper function
function ajaxRequest(method, url, data, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-CSRF-Token', document.querySelector('meta[name="csrf-token"]').content);

  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback(null, JSON.parse(xhr.responseText));
    } else {
      callback(new Error(xhr.statusText), null);
    }
  };

  xhr.onerror = function() {
    callback(new Error('Network Error'), null);
  };

  xhr.send(JSON.stringify(data));
}

// Smooth scroll to element
function smoothScrollTo(element) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast show align-items-center text-white bg-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}
