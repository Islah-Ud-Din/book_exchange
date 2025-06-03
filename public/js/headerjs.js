const dropdownToggle = document.getElementById('navbarDropdown');
const dropdownMenu = document.getElementById('customDropdown');

dropdownToggle.addEventListener('click', function (e) {
    e.preventDefault(); // prevent default anchor behavior

    // Toggle display
    if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    } else {
        dropdownMenu.style.display = 'block';
    }
});

// Optional: close dropdown if clicked outside
document.addEventListener('click', function (event) {
    if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
    }
});
